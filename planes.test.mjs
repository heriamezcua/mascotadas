import test from "node:test";
import assert from "node:assert/strict";
import { inicioDelDia, inicioDelPeriodo, inicioDeSuscripcion, planDeSuscripcion, restantes } from "./planes.mjs";

const suscripcion = (status, precio = "basico") => ({ status, items: { data: [{ price: { id: precio }, current_period_start: 1000 }] } });

test("el día empieza a medianoche en Madrid, también en horario de invierno y verano", () => {
  assert.equal(inicioDelDia(new Date("2026-01-15T12:30:45Z")).toISOString(), "2026-01-14T23:00:00.000Z");
  assert.equal(inicioDelDia(new Date("2026-07-15T12:30:45Z")).toISOString(), "2026-07-14T22:00:00.000Z");
});

test("premium cuenta por día y el resto por periodo de facturación", () => {
  const ahora = new Date("2026-01-15T12:00:00Z");
  assert.equal(inicioDelPeriodo({ plan: "premium" }, ahora).toISOString(), "2026-01-14T23:00:00.000Z");
  const periodo = "2026-01-02T10:00:00.000Z";
  assert.equal(inicioDelPeriodo({ plan: "basico", periodo_inicio: periodo }, ahora).toISOString(), periodo);
});

test("los historias restantes respetan el máximo de cada plan", () => {
  assert.equal(restantes(null, 0), 0);
  assert.equal(restantes({ plan: "prueba" }, 2), 1);
  assert.equal(restantes({ plan: "prueba" }, 3), 0);
  assert.equal(restantes({ plan: "basico" }, 7), 1);
  assert.equal(restantes({ plan: "basico" }, 8), 0);
  assert.equal(restantes({ plan: "premium" }, 0), 1);
  assert.equal(restantes({ plan: "premium" }, 1), 0);
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
