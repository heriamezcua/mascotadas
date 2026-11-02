import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));
if (existsSync(join(raiz, ".env.local"))) process.loadEnvFile(join(raiz, ".env.local"));

const { escribirHistoria, hayIA } = await import("./historias.mjs");
const { narrar, hayVoz } = await import("./voz.mjs");
const datos = await import("./datos.mjs");
const pagos = await import("./pagos.mjs");
const { inicioDelPeriodo, restantes } = await import("./planes.mjs");

const PUERTO = Number(process.env.PORT || 4173);
const ANFITRION = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
};
const CAMPOS = { nombre: 30, especie: 10, personalidad: 30, mania: 80, tono: 20 };
const COLORES = ["color", "collar"];
const CABECERAS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data:; media-src 'self' blob:; style-src 'self' 'unsafe-inline'; " +
    `connect-src 'self' ${process.env.SUPABASE_URL || ""}; frame-ancestors 'none'; base-uri 'self'`,
};

const generando = new Set(); // Impide saltarse el máximo pidiendo dos historias a la vez.

function limpiar(cuerpo) {
  const mascota = {};
  for (const [campo, largo] of Object.entries(CAMPOS)) mascota[campo] = String(cuerpo[campo] ?? "").trim().slice(0, largo);
  for (const campo of COLORES) mascota[campo] = /^#[0-9a-f]{6}$/i.test(cuerpo[campo]) ? cuerpo[campo] : "#888888";
  return mascota.nombre && mascota.mania ? mascota : null;
}

async function leerCrudo(req, maximo = 2000) {
  const trozos = [];
  let total = 0;
  for await (const trozo of req) {
    total += trozo.length;
    if (total > maximo) throw new Error("Demasiado largo");
    trozos.push(trozo);
  }
  return Buffer.concat(trozos);
}

const leerCuerpo = async (req) => JSON.parse((await leerCrudo(req)).toString() || "{}");

const responder = (res, codigo, datosRespuesta) => {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8", ...CABECERAS });
  res.end(JSON.stringify(datosRespuesta));
};

async function cuentaDe(usuario) {
  const perfil = await datos.leerPerfil(usuario.id);
  const usados = perfil.plan ? await datos.contarHistorias(usuario.id, inicioDelPeriodo(perfil)) : 0;
  return { perfil, quedan: restantes(perfil, usados) };
}

const rutas = {
  "GET /api/estado": async (req, res) => responder(res, 200, {
    ia: hayIA(),
    voz: hayVoz(),
    local: datos.local,
    supabaseUrl: process.env.SUPABASE_URL ?? null,
    supabaseAnon: process.env.SUPABASE_ANON_KEY ?? null,
  }),

  "GET /api/yo": async (req, res, usuario) => {
    const { perfil, quedan } = await cuentaDe(usuario);
    const historias = await datos.listarHistorias(usuario.id);
    responder(res, 200, { email: usuario.email, plan: perfil.plan ?? null, quedan, historias });
  },

  "POST /api/historia": async (req, res, usuario) => {
    if (generando.has(usuario.id)) return responder(res, 429, { error: "Ya estamos escribiendo una historia." });
    const mascota = limpiar(await leerCuerpo(req));
    if (!mascota) return responder(res, 400, { error: "Faltan el nombre o su manía" });

    generando.add(usuario.id);
    try {
      const { perfil, quedan } = await cuentaDe(usuario);
      if (quedan === 0) return responder(res, 402, { error: "limite", plan: perfil.plan ?? null });
      const { titulo, paginas, modo } = await escribirHistoria(mascota);
      responder(res, 200, await datos.crearHistoria(usuario.id, { titulo, paginas, modo, mascota }));
    } finally {
      generando.delete(usuario.id);
    }
  },

  // La voz solo lee páginas de las historias del propio usuario: la clave no sirve para narrar otra cosa.
  "POST /api/voz": async (req, res, usuario) => {
    const { historia: id, pagina } = await leerCuerpo(req);
    const { plan } = await datos.leerPerfil(usuario.id);
    const historia = plan ? await datos.leerHistoria(id, usuario.id) : null;
    const texto = historia?.paginas[pagina]?.texto;
    if (!texto) return responder(res, 404, { error: "No existe" });
    const audio = await narrar(usuario.id, texto);
    res.writeHead(200, { "Content-Type": "audio/mpeg", ...CABECERAS });
    res.end(audio);
  },

  "POST /api/pago": async (req, res, usuario) => {
    const { plan, empezarYa } = await leerCuerpo(req);
    if (!["prueba", "premium"].includes(plan)) return responder(res, 400, { error: "Plan no válido" });
    if (empezarYa !== true) return responder(res, 400, { error: "Falta aceptar el inicio inmediato" });
    responder(res, 200, { url: await pagos.crearPago(usuario, plan) });
  },

  "POST /api/portal": async (req, res, usuario) => {
    const url = await pagos.crearPortal(usuario);
    return url ? responder(res, 200, { url }) : responder(res, 404, { error: "Sin suscripción" });
  },

  "DELETE /api/cuenta": async (req, res, usuario) => {
    await pagos.cancelarSuscripcion(usuario);
    await datos.borrarUsuario(usuario.id);
    responder(res, 200, { ok: true });
  },
};

const PUBLICAS = new Set(["GET /api/estado"]);

async function atenderApi(req, res, ruta) {
  if (ruta === "/api/stripe") {
    try {
      await pagos.recibirEvento(await leerCrudo(req, 1_000_000), req.headers["stripe-signature"]);
      return responder(res, 200, { recibido: true });
    } catch (error) {
      console.error("Stripe:", error.message);
      return responder(res, 400, { error: "Evento no válido" });
    }
  }

  const clave = `${req.method} ${ruta}`;
  const accion = rutas[clave];
  if (!accion) return responder(res, 404, { error: "No existe" });
  try {
    const usuario = PUBLICAS.has(clave) ? null : await datos.usuarioDe(req);
    if (!usuario && !PUBLICAS.has(clave)) return responder(res, 401, { error: "Entra en tu cuenta" });
    await accion(req, res, usuario);
  } catch (error) {
    console.error(clave, error.message);
    if (!res.headersSent) responder(res, 500, { error: "Algo ha fallado. Inténtalo otra vez." });
  }
}

createServer(async (req, res) => {
  const ruta = new URL(req.url, "http://localhost").pathname;
  if (ruta.startsWith("/api/")) return atenderApi(req, res, ruta);

  const relativa = normalize(ruta === "/" ? "index.html" : ruta.slice(1));
  if (relativa.startsWith("..")) return responder(res, 404, { error: "No existe" });
  for (const candidato of [relativa, `${relativa}.html`]) {
    try {
      const archivo = await readFile(join(raiz, "public", candidato));
      res.writeHead(200, { "Content-Type": TIPOS[extname(candidato)] || "application/octet-stream", ...CABECERAS });
      return res.end(archivo);
    } catch {
      // Prueba el siguiente.
    }
  }
  responder(res, 404, { error: "No existe" });
}).listen(PUERTO, ANFITRION, () => {
  console.log(`Mascotadas en http://localhost:${PUERTO} (${datos.local ? "local" : "producción"}, ${hayIA() ? "con IA" : "historias de muestra"})`);
});
