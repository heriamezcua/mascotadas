// historias: cuántas por periodo (la prueba entera o cada mes); alDia: cuántas como mucho en un mismo día.
export const PLANES = {
  prueba: { historias: 3 },
  basico: { historias: 8, alDia: 2 },
  premium: { historias: 30, alDia: 5 },
};

const ZONA = "Europe/Madrid";

export function inicioDelDia(ahora = new Date()) {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONA, hourCycle: "h23", hour: "numeric", minute: "numeric", second: "numeric",
  }).formatToParts(ahora);
  const valor = (tipo) => Number(partes.find((p) => p.type === tipo).value);
  const segundos = valor("hour") * 3600 + valor("minute") * 60 + valor("second");
  return new Date(Math.floor(ahora.getTime() / 1000) * 1000 - segundos * 1000);
}

// Suma meses a una fecha; si el día no existe en ese mes (31 de febrero), se queda en el último.
function sumarMeses(fecha, meses) {
  const resultado = new Date(fecha);
  const dia = resultado.getUTCDate();
  resultado.setUTCDate(1);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(resultado.getUTCFullYear(), resultado.getUTCMonth() + 1, 0)).getUTCDate();
  resultado.setUTCDate(Math.min(dia, ultimo));
  return resultado;
}

// Desde cuándo se cuentan los historias del periodo actual. Los planes por meses cuentan cada mes desde el día en
// que empezó el periodo de pago: así el anual también da sus historias mes a mes y no todas de golpe.
export function inicioDelPeriodo(perfil, ahora = new Date()) {
  const ancla = new Date(perfil.periodo_inicio);
  let meses = 0;
  while (sumarMeses(ancla, meses + 1) <= ahora) meses++;
  return sumarMeses(ancla, meses);
}

// Las que le quedan este periodo (mes) y hoy; puede crear la menor de las dos.
export function restantes(perfil, usados, usadosHoy = 0) {
  if (!perfil?.plan) return { mes: 0, hoy: 0, quedan: 0 };
  const { historias, alDia } = PLANES[perfil.plan];
  const mes = Math.max(0, historias - usados);
  const hoy = alDia ? Math.max(0, alDia - usadosHoy) : mes;
  return { mes, hoy, quedan: Math.min(mes, hoy) };
}

// Traduce una suscripción de Stripe al plan que da acceso. preciosPremium: los precios mensual y anual de Premium.
export function planDeSuscripcion(suscripcion, preciosPremium) {
  if (!["active", "trialing"].includes(suscripcion.status)) return null;
  if (suscripcion.status === "trialing") return "prueba";
  const premium = suscripcion.items.data.some((item) => [preciosPremium].flat().includes(item.price.id));
  return premium ? "premium" : "basico";
}

export const esAnual = (suscripcion) => suscripcion.items.data[0]?.price?.recurring?.interval === "year";

export function inicioDeSuscripcion(suscripcion) {
  const segundos = suscripcion.items.data[0]?.current_period_start ?? suscripcion.current_period_start;
  return new Date(segundos * 1000).toISOString();
}
