import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

// Arranca el servidor de verdad, sin Supabase (todo en memoria), y prueba lo que ve un visitante.
const PUERTO = 4998;
const web = `http://127.0.0.1:${PUERTO}`;
let servidor;

before(async () => {
  servidor = spawn(process.execPath, ["servidor.mjs"], { env: { ...process.env, PORT: String(PUERTO), SUPABASE_URL: "" }, stdio: "ignore" });
  for (let intento = 0; intento < 50; intento++) {
    if (await fetch(`${web}/api/estado`).then(() => true, () => false)) return;
    await new Promise((listo) => setTimeout(listo, 100));
  }
  throw new Error("El servidor no arranca");
});

after(() => servidor.kill());

test("la portada lleva las cabeceras de seguridad y los archivos con versión", async () => {
  const respuesta = await fetch(web);
  assert.equal(respuesta.status, 200);
  for (const cabecera of ["content-security-policy", "x-frame-options", "permissions-policy", "strict-transport-security"]) {
    assert.ok(respuesta.headers.get(cabecera), `falta ${cabecera}`);
  }
  const html = await respuesta.text();
  const app = html.match(/src="(\/v\/[\w-]+\/app\.js)"/)?.[1];
  assert.ok(app, "app.js sin versión");
  assert.ok(!html.includes("{{v}}"));
  assert.equal((await fetch(web + app)).status, 200);
});

test("no se puede salir de la carpeta public", async () => {
  const { request } = await import("node:http");
  for (const ruta of ["/../servidor.mjs", "/v/x/../../.env.local", "/..%2fservidor.mjs"]) {
    // fetch normaliza las rutas: se manda tal cual con http.
    const codigo = await new Promise((listo) => request({ host: "127.0.0.1", port: PUERTO, path: ruta, agent: false }, (r) => {
      r.resume();
      r.on("end", () => listo(r.statusCode));
    }).end());
    assert.equal(codigo, 404, ruta);
  }
});

test("la API no se guarda en caché y rechaza datos mal formados", async () => {
  const estado = await fetch(`${web}/api/estado`);
  assert.equal(estado.headers.get("cache-control"), "no-store");
  const pedir = (ruta, cuerpo) => fetch(web + ruta, { method: "POST", body: JSON.stringify(cuerpo) }).then((r) => r.status);
  assert.equal(await pedir("/api/voz", { historia: "x", pagina: 0, voz: "espana-hombre" }), 400);
  assert.equal(await pedir("/api/voz", { historia: crypto.randomUUID(), pagina: 0, voz: "__proto__" }), 400);
  assert.equal(await pedir("/api/repintar", { historia: crypto.randomUUID(), pagina: 99 }), 400);
  assert.equal(await pedir("/api/compartir", { historia: "1 or 1=1" }), 400);
  assert.equal((await fetch(`${web}/api/publica/voz?e=abcdefgh&pagina=0&voz=constructor`)).status, 404);
});
