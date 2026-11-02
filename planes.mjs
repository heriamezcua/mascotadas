export const PLANES = {
  prueba: { historias: 3 },
  basico: { historias: 12 },
  premium: { historias: 2, diario: true },
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

// Desde cuándo se cuentan los historias del periodo actual.
export function inicioDelPeriodo(perfil, ahora = new Date()) {
  return PLANES[perfil.plan].diario ? inicioDelDia(ahora) : new Date(perfil.periodo_inicio);
}

export function restantes(perfil, usados) {
  if (!perfil?.plan) return 0;
  return Math.max(0, PLANES[perfil.plan].historias - usados);
}

// Traduce una suscripción de Stripe al plan que da acceso.
export function planDeSuscripcion(suscripcion, precioPremium) {
  if (!["active", "trialing"].includes(suscripcion.status)) return null;
  if (suscripcion.status === "trialing") return "prueba";
  const premium = suscripcion.items.data.some((item) => item.price.id === precioPremium);
  return premium ? "premium" : "basico";
}

export function inicioDeSuscripcion(suscripcion) {
  const segundos = suscripcion.items.data[0]?.current_period_start ?? suscripcion.current_period_start;
  return new Date(segundos * 1000).toISOString();
}
