import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));
if (existsSync(join(raiz, ".env.local"))) process.loadEnvFile(join(raiz, ".env.local"));

const { escribirHistoria, hayIA } = await import("./historias.mjs");
const { narrar, hayVoz, vocesGuardadas, audioGuardado } = await import("./voz.mjs");
const { pintarFondos, pintarFicha, pintarEscena, hayImagenes, claveFicha, ESPECIES } = await import("./fondos.mjs");
const datos = await import("./datos.mjs");
const pagos = await import("./pagos.mjs");
const { inicioDelPeriodo, restantes } = await import("./planes.mjs");

const PUERTO = Number(process.env.PORT || 4173);
const ANFITRION = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".jpg": "image/jpeg", ".mp3": "audio/mpeg", ".woff2": "font/woff2",
};
const CAMPOS = { nombre: 30, especie: 10, personalidad: 30, mania: 80, tono: 20 };
const COLORES = ["color", "collar"];
const CABECERAS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy":
    // accounts.google.com: el botón oficial de «Continuar con Google», que solo se carga al abrir la ventana de entrar.
    "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; " +
    "script-src 'self' https://accounts.google.com/gsi/client; frame-src https://accounts.google.com/gsi/; " +
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; " +
    `connect-src 'self' https://accounts.google.com/gsi/ ${process.env.SUPABASE_URL || ""}; frame-ancestors 'none'; base-uri 'self'`,
};

const pases = new Map(); // Pases de audio: el reproductor no puede mandar la sesión.
setInterval(() => {
  for (const [pase, { caduca }] of pases) if (caduca < Date.now()) pases.delete(pase);
}, 60000).unref();
const generando = new Set(); // Impide saltarse el máximo pidiendo dos historias a la vez.

// Si un fondo falla, se marca para que la página se quede con el escenario dibujado y no lo siga esperando.
const REINTENTOS = [30000, 120000]; // Google se satura a ratos: las páginas que fallan se vuelven a pintar más tarde.
const repintando = new Map(); // Evita pintar dos veces la misma página a la vez.

async function fichaDe(usuario, mascota) {
  const clave = claveFicha(mascota);
  let ficha = await datos.leerFicha(usuario, clave);
  if (!ficha) {
    ficha = await pintarFicha(mascota);
    await datos.guardarFicha(usuario, clave, ficha);
  }
  return ficha;
}

// Marca en la historia guardada qué páginas tienen imagen, releyéndola para no pisar otros cambios.
async function marcarPaginas(usuario, id, cambios) {
  const actual = await datos.leerHistoria(id, usuario);
  if (!actual) return;
  const paginas = actual.paginas.map((pagina, i) => (i in cambios ? { ...pagina, imagen: cambios[i] } : pagina));
  await datos.actualizarHistoria(id, usuario, { paginas });
}

function repintarPagina(usuario, historia, i) {
  const clave = `${historia.id}-${i}`;
  if (!repintando.has(clave)) {
    repintando.set(clave, (async () => {
      try {
        const imagen = await pintarEscena(historia.paginas[i], historia.mascota, await fichaDe(usuario, historia.mascota));
        await datos.guardarFondo(usuario, historia.id, i, imagen);
        await marcarPaginas(usuario, historia.id, { [i]: "escena" });
        return true;
      } catch (error) {
        console.error(`Fondo ${i} (reintento):`, error.message);
        return false;
      } finally {
        repintando.delete(clave);
      }
    })());
  }
  return repintando.get(clave);
}

async function pintarEnSegundoPlano(usuario, historia) {
  try {
    const clave = claveFicha(historia.mascota);
    const pintadas = await pintarFondos(historia.paginas, historia.mascota, {
      leerFicha: () => datos.leerFicha(usuario, clave),
      guardarFicha: (imagen) => datos.guardarFicha(usuario, clave, imagen),
      guardar: (i, imagen) => datos.guardarFondo(usuario, historia.id, i, imagen),
    });
    let pendientes = pintadas.flatMap((bien, i) => (bien || !historia.paginas[i].fondo ? [] : [i]));
    for (const pausa of REINTENTOS) {
      if (pendientes.length === 0) return;
      await new Promise((listo) => setTimeout(listo, pausa));
      const resultados = await Promise.all(pendientes.map((i) => repintarPagina(usuario, historia, i)));
      pendientes = pendientes.filter((_, n) => !resultados[n]);
    }
    // Si Google sigue sin responder, la página se pintará cuando alguien llegue a ella.
    if (pendientes.length) await marcarPaginas(usuario, historia.id, Object.fromEntries(pendientes.map((i) => [i, false])));
  } catch (error) {
    console.error("Fondos:", error.message);
  }
}

function limpiar(cuerpo) {
  const mascota = {};
  for (const [campo, largo] of Object.entries(CAMPOS)) mascota[campo] = String(cuerpo[campo] ?? "").trim().slice(0, largo);
  if (!ESPECIES[mascota.especie]) mascota.especie = "perro";
  for (const campo of COLORES) mascota[campo] = /^#[0-9a-f]{6}$/i.test(cuerpo[campo]) ? cuerpo[campo] : "#888888";
  if (cuerpo.collar === "ninguno") mascota.collar = "ninguno";
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
    imagenes: hayImagenes(),
    local: datos.local,
    supabaseUrl: process.env.SUPABASE_URL ?? null,
    supabaseAnon: process.env.SUPABASE_ANON_KEY ?? null,
    googleCliente: process.env.GOOGLE_CLIENT_ID ?? null, // Público: lo usa el botón de Google en el navegador.
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
      const conFondo = paginas.map((pagina) => ({ ...pagina, imagen: hayImagenes() && pagina.fondo ? "escena" : false }));
      const historia = await datos.crearHistoria(usuario.id, { titulo, paginas: conFondo, modo, mascota });
      // Los fondos tardan minutos: la historia se abre ya y cada fondo aparece en cuanto está pintado.
      if (hayImagenes()) pintarEnSegundoPlano(usuario.id, historia);
      responder(res, 200, historia);
    } finally {
      generando.delete(usuario.id);
    }
  },

  // Pinta en el momento una página que falló, mientras quien lee espera con el quiz.
  "POST /api/repintar": async (req, res, usuario) => {
    const { historia: id, pagina } = await leerCuerpo(req);
    const historia = await datos.leerHistoria(id, usuario.id);
    if (!historia?.paginas[pagina]?.fondo || !hayImagenes()) return responder(res, 404, { error: "No existe" });
    if (await datos.leerFondo(usuario.id, id, pagina)) {
      if (historia.paginas[pagina].imagen !== "escena") await marcarPaginas(usuario.id, id, { [pagina]: "escena" });
      return responder(res, 200, { ok: true });
    }
    const bien = await repintarPagina(usuario.id, historia, pagina);
    responder(res, bien ? 200 : 503, bien ? { ok: true } : { error: "Ahora mismo no podemos pintarla. Inténtelo en un momento." });
  },

  "GET /api/fondo": async (req, res, usuario) => {
    const consulta = new URL(req.url, "http://localhost").searchParams;
    const historia = consulta.get("historia") ?? "";
    const pagina = Number(consulta.get("pagina"));
    if (!/^[0-9a-f-]{36}$/i.test(historia) || !Number.isInteger(pagina) || pagina < 0 || pagina > 9) {
      return responder(res, 400, { error: "No válido" });
    }
    const imagen = await datos.leerFondo(usuario.id, historia, pagina);
    if (!imagen) {
      const fallido = (await datos.leerHistoria(historia, usuario.id))?.paginas[pagina]?.imagen === false;
      return responder(res, fallido ? 410 : 404, { error: "No existe" });
    }
    res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=604800", ...CABECERAS });
    res.end(imagen);
  },

  // La voz solo lee páginas de las historias del propio usuario: la clave no sirve para narrar otra cosa.
  // Devuelve un pase de un rato para que el reproductor del navegador pida el audio sin cabecera de sesión.
  "POST /api/voz": async (req, res, usuario) => {
    const { historia: id, pagina, voz } = await leerCuerpo(req);
    const { plan } = await datos.leerPerfil(usuario.id);
    const historia = plan ? await datos.leerHistoria(id, usuario.id) : null;
    const texto = historia?.paginas[pagina]?.texto;
    if (!texto) return responder(res, 404, { error: "No existe" });
    const pase = randomUUID();
    pases.set(pase, { usuario: usuario.id, texto, voz, caduca: Date.now() + 10 * 60000 });
    responder(res, 200, { url: `/api/escuchar?pase=${pase}` });
  },

  "GET /api/escuchar": async (req, res) => {
    const pase = pases.get(new URL(req.url, "http://localhost").searchParams.get("pase"));
    if (!pase || pase.caduca < Date.now()) return responder(res, 404, { error: "No existe" });
    const { audio, flujo, guardar } = await narrar(pase.usuario, pase.texto, pase.voz);
    if (audio) {
      res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": audio.length, ...CABECERAS });
      return res.end(audio);
    }
    // Se lee hasta el final aunque el oyente se vaya, para guardar la página entera y no pagarla dos veces.
    res.writeHead(200, { "Content-Type": "audio/mpeg", ...CABECERAS });
    const trozos = [];
    for await (const trozo of flujo) {
      trozos.push(trozo);
      if (!res.destroyed) res.write(trozo);
    }
    res.end();
    await guardar(Buffer.concat(trozos));
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

  // Compartir: solo el dueño crea o quita el enlace público de su historia.
  "POST /api/compartir": async (req, res, usuario) => {
    const { historia } = await leerCuerpo(req);
    const enlace = await datos.compartirHistoria(historia, usuario.id);
    if (!enlace) return responder(res, 404, { error: "No existe" });
    responder(res, 200, { enlace });
  },

  "DELETE /api/compartir": async (req, res, usuario) => {
    const { historia } = await leerCuerpo(req);
    await datos.dejarDeCompartir(historia, usuario.id);
    responder(res, 200, { ok: true });
  },

  // Lo que ve un visitante de una historia compartida: sin datos del dueño.
  "GET /api/publica": async (req, res) => {
    const historia = await compartidaDe(req);
    if (!historia) return responder(res, 404, { error: "No existe" });
    const voces = hayVoz() ? await vocesGuardadas(historia.usuario, historia.paginas.map((p) => p.texto)) : [];
    responder(res, 200, {
      titulo: historia.titulo,
      mascota: { nombre: historia.mascota.nombre, especie: historia.mascota.especie },
      paginas: historia.paginas.map((p, i) => ({ texto: p.texto, imagen: Boolean(p.imagen), voces: voces[i] ?? [] })),
    });
  },

  "GET /api/publica/fondo": async (req, res) => {
    const historia = await compartidaDe(req);
    const pagina = paginaDe(req, historia);
    const imagen = pagina === null ? null : await datos.leerFondo(historia.usuario, historia.id, pagina);
    if (!imagen) return responder(res, 404, { error: "No existe" });
    res.writeHead(200, { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=86400", ...CABECERAS });
    res.end(imagen);
  },

  "GET /api/publica/voz": async (req, res) => {
    const historia = await compartidaDe(req);
    const pagina = paginaDe(req, historia);
    const voz = new URL(req.url, "http://localhost").searchParams.get("voz");
    const audio = pagina === null ? null : await audioGuardado(historia.usuario, historia.paginas[pagina].texto, voz);
    if (!audio) return responder(res, 404, { error: "No existe" });
    res.writeHead(200, { "Content-Type": "audio/mpeg", "Content-Length": audio.length, "Cache-Control": "public, max-age=86400", ...CABECERAS });
    res.end(audio);
  },

  "DELETE /api/cuenta": async (req, res, usuario) => {
    await pagos.cancelarSuscripcion(usuario);
    await datos.borrarUsuario(usuario.id);
    responder(res, 200, { ok: true });
  },
};

// Escuchar se autoriza con su pase; las de una historia compartida, con su enlace.
const PUBLICAS = new Set(["GET /api/estado", "GET /api/escuchar", "GET /api/publica", "GET /api/publica/fondo", "GET /api/publica/voz"]);
const ENLACE = /^[A-Za-z0-9_-]{8,24}$/;

async function compartidaDe(req) {
  const enlace = new URL(req.url, "http://localhost").searchParams.get("e") ?? "";
  return ENLACE.test(enlace) ? datos.leerCompartida(enlace) : null;
}

function paginaDe(req, historia) {
  const pagina = Number(new URL(req.url, "http://localhost").searchParams.get("pagina"));
  return historia && Number.isInteger(pagina) && historia.paginas[pagina] ? pagina : null;
}

const escaparHtml = (texto) => String(texto).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// La página pública lleva el título y la portada de la historia para que el enlace se vea bonito al compartirlo.
async function servirCompartida(res, enlace) {
  const historia = ENLACE.test(enlace) ? await datos.leerCompartida(enlace).catch(() => null) : null;
  let html = await readFile(join(raiz, "public", "historia.html"), "utf8");
  const titulo = historia ? `${historia.titulo} · Mascotadas` : "Historia no disponible · Mascotadas";
  html = html
    .replaceAll("{{titulo}}", escaparHtml(titulo))
    .replaceAll("{{imagen}}", historia ? `https://mascotadas.com/api/publica/fondo?e=${enlace}&amp;pagina=0` : "https://mascotadas.com/img/ejemplo.jpg");
  res.writeHead(historia ? 200 : 404, { "Content-Type": TIPOS[".html"], ...CABECERAS });
  res.end(html);
}

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
  if (ruta.startsWith("/h/")) return servirCompartida(res, ruta.slice(3));

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
