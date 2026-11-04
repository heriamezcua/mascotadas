import test from "node:test";
import assert from "node:assert/strict";
import { esAnual, inicioDelDia, inicioDelPeriodo, inicioDeSuscripcion, planDeSuscripcion, restantes } from "./planes.mjs";

const suscripcion = (status, precio = "basico") => ({ status, items: { data: [{ price: { id: precio }, current_period_start: 1000 }] } });

test("el día empieza a medianoche en Madrid, también en horario de invierno y verano", () => {
  assert.equal(inicioDelDia(new Date("2026-01-15T12:30:45Z")).toISOString(), "2026-01-14T23:00:00.000Z");
  assert.equal(inicioDelDia(new Date("2026-07-15T12:30:45Z")).toISOString(), "2026-07-14T22:00:00.000Z");
});

test("todos los planes cuentan por meses desde el periodo de facturación", () => {
  const ahora = new Date("2026-01-15T12:00:00Z");
  const periodo = "2026-01-02T10:00:00.000Z";
  assert.equal(inicioDelPeriodo({ plan: "basico", periodo_inicio: periodo }, ahora).toISOString(), periodo);
  assert.equal(inicioDelPeriodo({ plan: "premium", periodo_inicio: periodo }, ahora).toISOString(), periodo);
});

test("las historias restantes respetan el máximo del mes y el del día", () => {
  const quedan = (plan, usados, hoy) => restantes(plan && { plan }, usados, hoy).quedan;
  assert.equal(quedan(null, 0, 0), 0);
  // La prueba: 3 en total, sin máximo por día.
  assert.equal(quedan("prueba", 0, 0), 3);
  assert.equal(quedan("prueba", 2, 2), 1);
  assert.equal(quedan("prueba", 3, 3), 0);
  // Básico: 8 al mes y 2 al día.
  assert.equal(quedan("basico", 0, 0), 2);
  assert.equal(quedan("basico", 2, 2), 0);
  assert.equal(quedan("basico", 7, 0), 1);
  assert.equal(quedan("basico", 8, 0), 0);
  // Premium: 30 al mes y 5 al día.
  assert.equal(quedan("premium", 0, 0), 5);
  assert.equal(quedan("premium", 4, 4), 1);
  assert.equal(quedan("premium", 5, 5), 0);
  assert.equal(quedan("premium", 28, 0), 2);
  assert.equal(quedan("premium", 30, 0), 0);
  assert.deepEqual(restantes({ plan: "basico" }, 3, 2), { mes: 5, hoy: 0, quedan: 0 });
});

test("el estado de Stripe decide el acceso", () => {
  assert.equal(planDeSuscripcion(suscripcion("trialing"), "premium"), "prueba");
  assert.equal(planDeSuscripcion(suscripcion("active"), "premium"), "basico");
  assert.equal(planDeSuscripcion(suscripcion("active", "premium"), "premium"), "premium");
  for (const estado of ["past_due", "canceled", "unpaid", "incomplete"]) {
    assert.equal(planDeSuscripcion(suscripcion(estado), "premium"), null);
  }
});

test("el periodo sale de la línea de la suscripción", () => {
  assert.equal(inicioDeSuscripcion(suscripcion("active")), new Date(1000000).toISOString());
});

test("el plan anual da sus historias mes a mes desde el día de pago", () => {
  const perfil = { plan: "basico", periodo_inicio: "2026-01-31T10:00:00.000Z" };
  assert.equal(inicioDelPeriodo(perfil, new Date("2026-02-15T00:00:00Z")).toISOString(), "2026-01-31T10:00:00.000Z");
  // Febrero no tiene 31: el mes siguiente empieza el último día de febrero.
  assert.equal(inicioDelPeriodo(perfil, new Date("2026-03-01T00:00:00Z")).toISOString(), "2026-02-28T10:00:00.000Z");
  assert.equal(inicioDelPeriodo(perfil, new Date("2026-03-31T10:00:00Z")).toISOString(), "2026-03-31T10:00:00.000Z");
  assert.equal(inicioDelPeriodo(perfil, new Date("2026-12-31T09:00:00Z")).toISOString(), "2026-11-30T10:00:00.000Z");
});

test("Premium anual también es Premium, y se distingue lo anual", () => {
  const anual = { status: "active", items: { data: [{ price: { id: "premium-anual", recurring: { interval: "year" } } }] } };
  assert.equal(planDeSuscripcion(anual, ["premium", "premium-anual"]), "premium");
  assert.equal(esAnual(anual), true);
  assert.equal(esAnual(suscripcion("active")), false);
});
