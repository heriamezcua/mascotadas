import Stripe from "stripe";
import { guardarPerfil, leerPerfil, sumarPack } from "./datos.mjs";
import { esAnual, inicioDeSuscripcion, planDeSuscripcion } from "./planes.mjs";

// Sin clave de Stripe, fuera de producción, los pagos se simulan: sirve para desarrollar y probar.
export const simulado = !process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production";
const stripe = simulado ? null : new Stripe(process.env.STRIPE_SECRET_KEY);
// Con las claves de prueba de Stripe la web funciona como demo: nadie paga de verdad (tarjeta 4242 4242 4242 4242).
export const demo = simulado || process.env.STRIPE_SECRET_KEY.startsWith("sk_test_");
const WEB = process.env.WEB_URL || "http://localhost:4173";
const { STRIPE_WEBHOOK_SECRET } = process.env;

// Lo que se puede comprar. nivel: para saber si un cambio de plan es una subida (solo se permite subir).
export const PRODUCTOS = {
  basico: { precio: process.env.STRIPE_PRECIO_BASICO, nivel: 1, anual: false },
  basico_anual: { precio: process.env.STRIPE_PRECIO_BASICO_ANUAL, nivel: 1, anual: true },
  premium: { precio: process.env.STRIPE_PRECIO_PREMIUM, nivel: 2, anual: false },
  premium_anual: { precio: process.env.STRIPE_PRECIO_PREMIUM_ANUAL, nivel: 2, anual: true },
  pack_1: { precio: process.env.STRIPE_PACK_1, historias: 1 },
  pack_5: { precio: process.env.STRIPE_PACK_5, historias: 5 },
  pack_15: { precio: process.env.STRIPE_PACK_15, historias: 15 },
};
const PRECIOS_PREMIUM = [PRODUCTOS.premium.precio, PRODUCTOS.premium_anual.precio].filter(Boolean);
const productoDePrecio = (precio) => Object.values(PRODUCTOS).find((p) => p.precio && p.precio === precio);

// Para pasar de un plan a otro sin pasar otra vez por la caja: solo a uno más alto, o del mismo al anual.
export function esSubida(actual, nuevo) {
  if (!actual || !nuevo || nuevo.historias || actual === nuevo) return false;
  return nuevo.nivel > actual.nivel || (nuevo.nivel === actual.nivel && nuevo.anual && !actual.anual);
}

const CONDICIONES = "Al pagar aceptas los términos y condiciones de mascotadas.com/condiciones.";
const cliente = (perfil, usuario) => (perfil.stripe_customer ? { customer: perfil.stripe_customer } : { customer_email: usuario.email });
const comunes = {
  automatic_tax: { enabled: true },
  // Stripe solo pide aceptar las condiciones si la cuenta activada tiene su URL configurada.
  ...(process.env.STRIPE_PEDIR_CONDICIONES === "si" ? { consent_collection: { terms_of_service: "required" } } : {}),
  locale: "es",
  success_url: `${WEB}/?pago=ok`,
  cancel_url: `${WEB}/?pago=cancelado`,
};

export async function crearPago(usuario, nombre) {
  const producto = PRODUCTOS[nombre];
  const perfil = await leerPerfil(usuario.id);

  if (simulado) {
    if (producto.historias) await sumarPack(`simulada-${Date.now()}`, usuario.id, producto.historias, 0);
    else {
      await guardarPerfil(usuario.id, {
        plan: producto.nivel === 2 ? "premium" : "prueba",
        anual: producto.anual,
        periodo_inicio: new Date().toISOString(),
        prueba_usada: true,
      });
    }
    return `${WEB}/?pago=ok`;
  }

  // Packs: pago único, sin suscripción. El aviso de Stripe suma las historias al terminar el pago.
  if (producto.historias) {
    const sesion = await stripe.checkout.sessions.create({
      mode: "payment",
      client_reference_id: usuario.id,
      ...cliente(perfil, usuario),
      ...(perfil.stripe_customer ? {} : { customer_creation: "always" }),
      line_items: [{ price: producto.precio, quantity: 1 }],
      metadata: { usuario: usuario.id, historias: String(producto.historias) },
      invoice_creation: { enabled: true }, // Factura de la compra, como en las suscripciones.
      custom_text: { submit: { message: `Las historias del pack valen 12 meses. ${CONDICIONES}` } },
      ...comunes,
    });
    return sesion.url;
  }

  // Quien ya está suscrito cambia de plan sin pasar otra vez por la caja: se cobra hoy lo que corresponda.
  if (perfil.stripe_suscripcion && perfil.plan) {
    const actual = await stripe.subscriptions.retrieve(perfil.stripe_suscripcion);
    if (!esSubida(productoDePrecio(actual.items.data[0].price.id), producto)) {
      throw Object.assign(new Error("Ese cambio de plan no está disponible"), { status: 409 });
    }
    await stripe.subscriptions.update(actual.id, {
      items: [{ id: actual.items.data[0].id, price: producto.precio }],
      trial_end: "now",
      proration_behavior: "always_invoice",
    });
    return `${WEB}/?pago=ok`;
  }

  const conPrueba = !perfil.prueba_usada;
  const precio = { basico: "4,99 € al mes", basico_anual: "49,99 € al año", premium: "19,99 € al mes", premium_anual: "199,99 € al año" };
  const despues = precio[nombre];
  const sesion = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: usuario.id,
    ...cliente(perfil, usuario),
    line_items: [{ price: producto.precio, quantity: 1 }],
    subscription_data: {
      metadata: { usuario: usuario.id },
      ...(conPrueba ? { trial_period_days: 3 } : {}),
    },
    payment_method_collection: "always",
    custom_text: {
      submit: {
        message: conPrueba
          ? `Hoy no pagas nada. Si no cancelas en los 3 días de prueba, empezará tu plan de ${despues}. ${CONDICIONES}`
          : `${CONDICIONES} Puedes cancelar cuando quieras.`,
      },
    },
    ...comunes,
  });
  return sesion.url;
}

// Qué plan empezará al acabar la prueba y cuánto costará, para enseñarlo antes de cobrar.
export async function planDeLaPrueba(usuario) {
  const perfil = await leerPerfil(usuario.id);
  if (perfil.plan !== "prueba") return null;
  if (simulado) return { nivel: 1, anual: Boolean(perfil.anual), importe: perfil.anual ? 4999 : 499 };
  const suscripcion = await stripe.subscriptions.retrieve(perfil.stripe_suscripcion);
  const precio = suscripcion.items.data[0].price;
  const producto = productoDePrecio(precio.id);
  return { nivel: producto?.nivel ?? 1, anual: esAnual(suscripcion), importe: precio.unit_amount };
}

// Termina la prueba ya y cobra el plan hoy. Si el cobro falla, Stripe no cambia nada y la prueba sigue.
export async function empezarYa(usuario) {
  const perfil = await leerPerfil(usuario.id);
  if (perfil.plan !== "prueba") throw Object.assign(new Error("No está en la prueba gratis"), { status: 409 });
  if (simulado) {
    await guardarPerfil(usuario.id, { plan: "basico", periodo_inicio: new Date().toISOString() });
    return;
  }
  try {
    await stripe.subscriptions.update(perfil.stripe_suscripcion, {
      trial_end: "now",
      proration_behavior: "none",
      payment_behavior: "error_if_incomplete",
    });
  } catch (error) {
    if (error.type === "StripeCardError") throw Object.assign(new Error("No se ha podido cobrar con su tarjeta."), { status: 402 });
    throw error;
  }
}

export async function crearPortal(usuario) {
  if (simulado) return `${WEB}/`;
  const { stripe_customer: customer } = await leerPerfil(usuario.id);
  if (!customer) return null;
  return (await stripe.billingPortal.sessions.create({ customer, return_url: WEB })).url;
}

export async function cancelarSuscripcion(usuario) {
  if (simulado) return;
  const { stripe_suscripcion: id, plan } = await leerPerfil(usuario.id);
  if (id && plan) await stripe.subscriptions.cancel(id);
}

// Pack pagado: suma sus historias una sola vez, aunque Stripe avise varias.
async function packPagado(sesion) {
  if (sesion.mode !== "payment" || sesion.payment_status !== "paid") return;
  const usuario = sesion.metadata?.usuario;
  const historias = Number(sesion.metadata?.historias);
  if (!usuario || !Number.isInteger(historias) || historias <= 0) return;
  await sumarPack(sesion.id, usuario, historias, sesion.amount_total ?? 0);
  const perfil = await leerPerfil(usuario);
  if (!perfil.stripe_customer && sesion.customer) await guardarPerfil(usuario, { stripe_customer: sesion.customer });
}

export async function recibirEvento(cuerpo, firma) {
  const evento = stripe.webhooks.constructEvent(cuerpo, firma, STRIPE_WEBHOOK_SECRET);
  // Los pagos con transferencia o similares se confirman más tarde, con el segundo aviso.
  if (["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(evento.type)) {
    return packPagado(evento.data.object);
  }
  if (!evento.type.startsWith("customer.subscription.")) return;

  // Los avisos de Stripe pueden llegar tarde o desordenados: se consulta el estado actual en vez de fiarse del aviso,
  // para que uno viejo no devuelva el plan a quien ya canceló.
  const suscripcion = await stripe.subscriptions.retrieve(evento.data.object.id);
  const usuario = suscripcion.metadata?.usuario;
  if (!usuario) return;
  // Si el perfil ya apunta a otra suscripción más nueva, este aviso es de una antigua y no debe pisarla.
  const { stripe_suscripcion: actual, plan: planActual } = await leerPerfil(usuario);
  if (actual && actual !== suscripcion.id && planActual && !["active", "trialing"].includes(suscripcion.status)) return;

  const plan = planDeSuscripcion(suscripcion, PRECIOS_PREMIUM);
  await guardarPerfil(usuario, {
    stripe_customer: suscripcion.customer,
    stripe_suscripcion: suscripcion.id,
    plan,
    anual: esAnual(suscripcion),
    periodo_inicio: inicioDeSuscripcion(suscripcion),
    ...(plan === "prueba" ? { prueba_usada: true } : {}),
  });
}
