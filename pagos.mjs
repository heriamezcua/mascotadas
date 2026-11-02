import Stripe from "stripe";
import { guardarPerfil, leerPerfil } from "./datos.mjs";
import { inicioDeSuscripcion, planDeSuscripcion } from "./planes.mjs";

// Sin clave de Stripe, fuera de producción, los pagos se simulan: sirve para desarrollar y probar.
export const simulado = !process.env.STRIPE_SECRET_KEY && process.env.NODE_ENV !== "production";
const stripe = simulado ? null : new Stripe(process.env.STRIPE_SECRET_KEY);
const WEB = process.env.WEB_URL || "http://localhost:4173";
const { STRIPE_PRECIO_BASICO, STRIPE_PRECIO_PREMIUM, STRIPE_WEBHOOK_SECRET } = process.env;

function lineas(plan) {
  if (plan === "premium") return [{ price: STRIPE_PRECIO_PREMIUM, quantity: 1 }];
  return [{ price: STRIPE_PRECIO_BASICO, quantity: 1 }];
}

export async function crearPago(usuario, plan) {
  const perfil = await leerPerfil(usuario.id);

  if (simulado) {
    await guardarPerfil(usuario.id, {
      plan: plan === "premium" ? "premium" : "prueba",
      periodo_inicio: new Date().toISOString(),
      prueba_usada: true,
    });
    return `${WEB}/?pago=ok`;
  }

  // Quien ya está suscrito cambia de plan sin pasar otra vez por la caja.
  if (perfil.stripe_suscripcion && perfil.plan) {
    const actual = await stripe.subscriptions.retrieve(perfil.stripe_suscripcion);
    await stripe.subscriptions.update(actual.id, {
      items: [{ id: actual.items.data[0].id, price: STRIPE_PRECIO_PREMIUM }],
      trial_end: "now",
      proration_behavior: "create_prorations",
    });
    return `${WEB}/?pago=ok`;
  }

  const conPrueba = plan !== "premium" && !perfil.prueba_usada;
  const sesion = await stripe.checkout.sessions.create({
    mode: "subscription",
    client_reference_id: usuario.id,
    ...(perfil.stripe_customer ? { customer: perfil.stripe_customer } : { customer_email: usuario.email }),
    line_items: lineas(plan),
    subscription_data: {
      metadata: { usuario: usuario.id },
      ...(conPrueba ? { trial_period_days: 3 } : {}),
    },
    payment_method_collection: "always",
    automatic_tax: { enabled: true },
    // Stripe solo pide aceptar las condiciones si la cuenta activada tiene su URL configurada.
    ...(process.env.STRIPE_PEDIR_CONDICIONES === "si" ? { consent_collection: { terms_of_service: "required" } } : {}),
    custom_text: {
      submit: {
        message: conPrueba
          ? "Hoy no pagas nada. Si no cancelas en los 3 días de prueba, empezará tu plan de 4,99 € al mes. Al continuar aceptas las condiciones de mascotadas.com/condiciones."
          : "Al pagar aceptas las condiciones de mascotadas.com/condiciones. Puedes cancelar cuando quieras.",
      },
    },
    locale: "es",
    success_url: `${WEB}/?pago=ok`,
    cancel_url: `${WEB}/?pago=cancelado`,
  });
  return sesion.url;
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

export async function recibirEvento(cuerpo, firma) {
  const evento = stripe.webhooks.constructEvent(cuerpo, firma, STRIPE_WEBHOOK_SECRET);
  if (!evento.type.startsWith("customer.subscription.")) return;

  const suscripcion = evento.data.object;
  const usuario = suscripcion.metadata?.usuario;
  if (!usuario) return;

  const plan = planDeSuscripcion(suscripcion, STRIPE_PRECIO_PREMIUM);
  await guardarPerfil(usuario, {
    stripe_customer: suscripcion.customer,
    stripe_suscripcion: suscripcion.id,
    plan,
    periodo_inicio: inicioDeSuscripcion(suscripcion),
    ...(plan === "prueba" ? { prueba_usada: true } : {}),
  });
}
