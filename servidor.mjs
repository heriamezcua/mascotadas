import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { brotliCompressSync, constants as zlib } from "node:zlib";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const raiz = fileURLToPath(new URL(".", import.meta.url));
if (existsSync(join(raiz, ".env.local"))) process.loadEnvFile(join(raiz, ".env.local"));

const { escribirHistoria, hayIA } = await import("./historias.mjs");
const { narrar, hayVoz, vocesGuardadas, audioGuardado, VOCES } = await import("./voz.mjs");
const { pintarFondos, pintarFicha, pintarEscena, hayImagenes, claveFicha, ESPECIES } = await import("./fondos.mjs");
const datos = await import("./datos.mjs");
const pagos = await import("./pagos.mjs");
const { inicioDelDia, inicioDelPeriodo, restantes } = await import("./planes.mjs");

const PUERTO = Number(process.env.PORT || 4173);
// Los archivos de la web se piden con la versión en la ruta (/v/<versión>/app.js): cambia en cada publicación,
// así el navegador y Cloudflare pueden guardarlos un año sin servir nunca uno viejo.
const VERSION = (process.env.RAILWAY_GIT_COMMIT_SHA || randomUUID()).slice(0, 8);
const PRODUCCION = process.env.NODE_ENV === "production";
const COMPRIMIBLES = new Set([".html", ".css", ".js", ".svg", ".txt", ".xml"]);
const estaticos = new Map(); // En producción los archivos no cambian: se leen del disco una sola vez.
const ANFITRION = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
const TIPOS = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".jpg": "image/jpeg", ".webp": "image/webp", ".mp3": "audio/mpeg", ".woff2": "font/woff2",
};
const CAMPOS = { nombre: 30, especie: 10, personalidad: 30, mania: 80, tono: 20 };
const COLORES = ["color", "collar"];
const CABECERAS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // La web no usa cámara, micrófono, ubicación ni pagos del navegador: nadie podrá pedirlos desde ella.
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  // Aísla la pestaña de otras webs; «allow-popups» deja abrir la ventana de Google para entrar.
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Content-Security-Policy":
    // accounts.google.com: el botón oficial de «Continuar con Google», que solo se carga al abrir la ventana de entrar.
    // cloudflareinsights.com: las estadísticas de Cloudflare (sin cookies), que Cloudflare añade a cada página.
    "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; " +
    "script-src 'self' https://accounts.google.com/gsi/client https://static.cloudflareinsights.com; " +
    "frame-src https://accounts.google.com/gsi/; " +
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style; " +
    `connect-src 'self' https://accounts.google.com/gsi/ https://cloudflareinsights.com ${process.env.SUPABASE_URL || ""}; ` +
    "object-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'" +
    (process.env.NODE_ENV === "production" ? "; upgrade-insecure-requests" : ""),
};

// Límite de peticiones por IP y minuto, para frenar a quien intente forzar códigos, gastar la IA o tumbar la web.
// Las acciones caras tienen su propio límite, más bajo.
const LIMITES = { general: 300, caras: 20 };
const CARAS = new Set(["POST /api/historia", "POST /api/repintar", "POST /api/voz", "POST /api/pago", "POST /api/empezar-ya", "POST /api/portal", "POST /api/compartir", "DELETE /api/cuenta"]);
const contadores = new Map();
setInterval(() => contadores.clear(), 60000).unref();

function superaLimite(req, tipo) {
  // Cloudflare manda la IP real del visitante; si se entra sin pasar por Cloudflare, vale la de la conexión.
  const ip = req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.socket.remoteAddress;
  const clave = `${tipo}|${ip}`;
  const veces = (contadores.get(clave) ?? 0) + 1;
  contadores.set(clave, veces);
  return veces > LIMITES[tipo];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esPagina = (pagina) => Number.isInteger(pagina) && pagina >= 0 && pagina <= 9;
const esVoz = (voz) => typeof voz === "string" && Object.hasOwn(VOCES, voz);

const pases = new Map(); // Pases de audio: el reproductor no puede mandar la sesión.
setInterval(() => {
  for (const [pase, { caduca }] of pases) if (caduca < Date.now()) pases.delete(pase);
}, 60000).unref();
const generando = new Set(); // Impide saltarse el máximo pidiendo dos historias a la vez.
// En la demo pública, historias como mucho al día entre todos los visitantes: cada una cuesta dinero de IA.
const TOPE_DEMO = Number(process.env.TOPE_DIARIO_DEMO || 30);

// Si un fondo falla, se marca para que la página se quede con el escenario dibujado y no lo siga esperando.
const REINTENTOS = [30000, 120000]; // Google se satura a ratos: las páginas que fallan se vuelven a pintar más tarde.
const repintando = new Map(); // Evita pintar dos veces la misma página a la vez.

// Al publicar una versión nueva, Railway avisa a la vieja para que cierre. Antes de apagarse termina lo que está
// pintando, para no perder ilustraciones ya pagadas; las esperas entre reintentos se cortan y esas páginas se
// pintarán cuando alguien llegue a ellas.
let cerrando = false;
const trabajos = new Set();
const despertadores = new Set();

function enMarcha(promesa) {
  trabajos.add(promesa);
  promesa.finally(() => trabajos.delete(promesa));
  return promesa;
}

const pausar = (ms) => new Promise((listo) => {
  const fin = () => {
    clearTimeout(reloj);
    despertadores.delete(fin);
    listo();
  };
  const reloj = setTimeout(fin, ms);
  despertadores.add(fin);
});

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
    repintando.set(clave, enMarcha((async () => {
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
    })()));
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
      if (pendientes.length === 0 || cerrando) break;
      await pausar(pausa);
      if (cerrando) break;
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

// Las respuestas de la API llevan datos de la cuenta: que no las guarde ninguna caché.
const responder = (res, codigo, datosRespuesta) => {
  res.writeHead(codigo, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...CABECERAS });
  res.end(JSON.stringify(datosRespuesta));
};

// quedan: historias del plan que puede crear ahora (lo que le quede del mes, sin pasar del máximo de hoy);
// mes y hoy, cada límite por separado; extra: las de packs que siguen valiendo.
async function cuentaDe(usuario) {
  const perfil = await datos.leerPerfil(usuario.id);
  const inicio = perfil.plan ? inicioDelPeriodo(perfil) : null;
  // El día cuenta desde las 00:00 o desde que empezó el plan actual, lo que sea más tarde: al pasar de la prueba
  // (o del Básico) a un plan de pago, las historias de antes no gastan el máximo de ese día.
  const [usados, usadosHoy] = inicio
    ? await Promise.all([
      datos.contarHistorias(usuario.id, inicio),
      datos.contarHistorias(usuario.id, new Date(Math.max(inicioDelDia(), inicio))),
    ])
    : [0, 0];
  return { perfil, ...restantes(perfil, usados, usadosHoy), extra: datos.extraDe(perfil) };
}

const rutas = {
  "GET /api/estado": async (req, res) => responder(res, 200, {
    ia: hayIA(),
    voz: hayVoz(),
    imagenes: hayImagenes(),
    local: datos.local,
    demo: pagos.demo,
    supabaseUrl: process.env.SUPABASE_URL ?? null,
    supabaseAnon: process.env.SUPABASE_ANON_KEY ?? null,
    googleCliente: process.env.GOOGLE_CLIENT_ID ?? null, // Público: lo usa el botón de Google en el navegador.
  }),

  "GET /api/yo": async (req, res, usuario) => {
    const { perfil, quedan, mes, hoy, extra } = await cuentaDe(usuario);
    const historias = await datos.listarHistorias(usuario.id);
    responder(res, 200, {
      email: usuario.email,
      plan: perfil.plan ?? null,
      anual: Boolean(perfil.anual),
      quedan,
      mes,
      hoy,
      extra,
      extraCaducan: extra ? perfil.extra_caducan : null,
      cliente: Boolean(perfil.stripe_customer), // Tiene facturas que ver en el portal de Stripe.
      pruebaUsada: Boolean(perfil.prueba_usada),
      historias,
    });
  },

  "POST /api/historia": async (req, res, usuario) => {
    if (generando.has(usuario.id)) return responder(res, 429, { error: "Ya estamos escribiendo una historia." });
    if (pagos.demo && (await datos.historiasDesde(inicioDelDia())) >= TOPE_DEMO) {
      return responder(res, 503, { error: "demo", mensaje: "La demo ha llegado a su máximo de historias de hoy. Vuelva mañana." });
    }
    const mascota = limpiar(await leerCuerpo(req));
    if (!mascota) return responder(res, 400, { error: "Faltan el nombre o su manía" });

    generando.add(usuario.id);
    let dePack = false;
    try {
      const { perfil, quedan } = await cuentaDe(usuario);
      // Primero se gastan las del plan; cuando se acaban, las de los packs (se descuenta antes de escribir).
      if (quedan === 0) {
        dePack = await datos.gastarExtra(usuario.id);
        if (!dePack) return responder(res, 402, { error: "limite", plan: perfil.plan ?? null });
      }
      const { titulo, paginas, modo } = await escribirHistoria(mascota);
      const conFondo = paginas.map((pagina) => ({ ...pagina, imagen: hayImagenes() && pagina.fondo ? "escena" : false }));
      const historia = await datos.crearHistoria(usuario.id, { titulo, paginas: conFondo, modo, mascota, de_pack: dePack });
      dePack = false; // Ya está creada: la historia del pack está bien gastada.
      // Los fondos tardan minutos: la historia se abre ya y cada fondo aparece en cuanto está pintado.
      if (hayImagenes()) enMarcha(pintarEnSegundoPlano(usuario.id, historia));
      responder(res, 200, historia);
    } finally {
      // Si algo falló después de descontarla, se devuelve.
      if (dePack) await datos.devolverExtra(usuario.id).catch((error) => console.error("Devolver historia de pack:", error.message));
      generando.delete(usuario.id);
    }
  },

  // Pinta en el momento una página que falló, mientras quien lee espera con el quiz.
  "POST /api/repintar": async (req, res, usuario) => {
    const { historia: id, pagina } = await leerCuerpo(req);
    if (!UUID.test(id) || !esPagina(pagina)) return responder(res, 400, { error: "No válido" });
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
    if (!UUID.test(historia) || !esPagina(pagina)) {
      return responder(res, 400, { error: "No válido" });
    }
    const imagen = await datos.leerFondo(usuario.id, historia, pagina);
    if (!imagen) {
      const fallido = (await datos.leerHistoria(historia, usuario.id))?.paginas[pagina]?.imagen === false;
      return responder(res, fallido ? 410 : 404, { error: "No existe" });
    }
    res.writeHead(200, { "Content-Type": "image/webp", "Cache-Control": "private, max-age=604800", ...CABECERAS });
    res.end(imagen);
  },

  // La voz solo lee páginas de las historias del propio usuario: la clave no sirve para narrar otra cosa.
  // Devuelve un pase de un rato para que el reproductor del navegador pida el audio sin cabecera de sesión.
  "POST /api/voz": async (req, res, usuario) => {
    const { historia: id, pagina, voz } = await leerCuerpo(req);
    if (!UUID.test(id) || !esPagina(pagina) || !esVoz(voz)) return responder(res, 400, { error: "No válido" });
    // Se narran las historias de quien tiene plan, y las de pack siempre (ya están pagadas).
    const { plan } = await datos.leerPerfil(usuario.id);
    const historia = await datos.leerHistoria(id, usuario.id);
    const texto = plan || historia?.de_pack ? historia?.paginas[pagina]?.texto : null;
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
    const { producto, empezarYa } = await leerCuerpo(req);
    if (!Object.hasOwn(pagos.PRODUCTOS, producto) || !pagos.PRODUCTOS[producto].precio && !pagos.simulado) {
      return responder(res, 400, { error: "Producto no válido" });
    }
    if (empezarYa !== true) return responder(res, 400, { error: "Falta aceptar el inicio inmediato" });
    try {
      responder(res, 200, { url: await pagos.crearPago(usuario, producto) });
    } catch (error) {
      if (error.status !== 409) throw error;
      responder(res, 409, { error: error.message });
    }
  },

  // Terminar la prueba antes de tiempo: primero se enseña qué se cobrará y, al confirmar, se cobra.
  "GET /api/prueba": async (req, res, usuario) => {
    const plan = await pagos.planDeLaPrueba(usuario);
    return plan ? responder(res, 200, plan) : responder(res, 404, { error: "No está en la prueba gratis" });
  },

  "POST /api/empezar-ya": async (req, res, usuario) => {
    try {
      await pagos.empezarYa(usuario);
      responder(res, 200, { ok: true });
    } catch (error) {
      if (![402, 409].includes(error.status)) throw error;
      responder(res, error.status, { error: error.message });
    }
  },

  "POST /api/portal": async (req, res, usuario) => {
    const url = await pagos.crearPortal(usuario);
    return url ? responder(res, 200, { url }) : responder(res, 404, { error: "Sin suscripción" });
  },

  // Compartir: solo el dueño crea o quita el enlace público de su historia.
  "POST /api/compartir": async (req, res, usuario) => {
    const { historia } = await leerCuerpo(req);
    if (!UUID.test(historia)) return responder(res, 400, { error: "No válido" });
    const enlace = await datos.compartirHistoria(historia, usuario.id);
    if (!enlace) return responder(res, 404, { error: "No existe" });
    responder(res, 200, { enlace });
  },

  "DELETE /api/compartir": async (req, res, usuario) => {
    const { historia } = await leerCuerpo(req);
    if (!UUID.test(historia)) return responder(res, 400, { error: "No válido" });
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
    const enJpeg = new URL(req.url, "http://localhost").searchParams.get("formato") === "jpg";
    res.writeHead(200, { "Content-Type": enJpeg ? "image/jpeg" : "image/webp", "Cache-Control": "public, max-age=86400", ...CABECERAS });
    res.end(enJpeg ? await datos.fondoEnJpeg(imagen) : imagen);
  },

  "GET /api/publica/voz": async (req, res) => {
    const historia = await compartidaDe(req);
    const pagina = paginaDe(req, historia);
    const voz = new URL(req.url, "http://localhost").searchParams.get("voz");
    const audio = pagina === null || !esVoz(voz) ? null : await audioGuardado(historia.usuario, historia.paginas[pagina].texto, voz);
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
  html = html.replaceAll("{{v}}", VERSION);
  const titulo = historia ? `${historia.titulo} · Mascotadas` : "Historia no disponible · Mascotadas";
  html = html
    .replaceAll("{{titulo}}", escaparHtml(titulo))
    .replaceAll("{{imagen}}", historia ? `https://mascotadas.com/api/publica/fondo?e=${enlace}&amp;pagina=0&amp;formato=jpg` : "https://mascotadas.com/img/compartir.jpg");
  res.writeHead(historia ? 200 : 404, { "Content-Type": TIPOS[".html"], ...CABECERAS });
  res.end(html);
}

// Lee un archivo de public (o la página .html del mismo nombre) con su ETag, para que el navegador pueda preguntar
// «¿ha cambiado?» y recibir un 304 sin contenido si no.
async function leerEstatico(relativa) {
  if (estaticos.has(relativa)) return estaticos.get(relativa);
  for (const candidato of [relativa, `${relativa}.html`]) {
    let archivo;
    try {
      archivo = await readFile(join(raiz, "public", candidato));
    } catch {
      continue;
    }
    const tipo = extname(candidato);
    if (tipo === ".html") archivo = Buffer.from(archivo.toString("utf8").replaceAll("{{v}}", VERSION));
    const etiqueta = `"${createHash("sha1").update(archivo).digest("base64url").slice(0, 20)}"`;
    const estatico = { archivo, tipo, etiqueta };
    if (PRODUCCION) estaticos.set(relativa, estatico);
    return estatico;
  }
  return null;
}

async function atenderApi(req, res, ruta) {
  // HEAD es un GET sin contenido (Node no envía el cuerpo): lo usan los monitores de caídas como UptimeRobot.
  const clave = `${req.method === "HEAD" ? "GET" : req.method} ${ruta}`;
  if (ruta !== "/api/stripe" && (superaLimite(req, "general") || (CARAS.has(clave) && superaLimite(req, "caras")))) {
    res.setHeader("Retry-After", "60");
    return responder(res, 429, { error: "Demasiadas peticiones seguidas. Espera un minuto y vuelve a intentarlo." });
  }
  if (ruta === "/api/stripe") {
    try {
      await pagos.recibirEvento(await leerCrudo(req, 1_000_000), req.headers["stripe-signature"]);
      return responder(res, 200, { recibido: true });
    } catch (error) {
      console.error("Stripe:", error.message);
      return responder(res, 400, { error: "Evento no válido" });
    }
  }

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

// Un fallo inesperado se apunta en el registro en vez de tumbar el servidor.
process.on("unhandledRejection", (error) => console.error("Sin capturar:", error?.message ?? error));

const servidor = createServer(async (req, res) => {
  const ruta = new URL(req.url, "http://localhost").pathname;
  if (ruta.startsWith("/api/")) return atenderApi(req, res, ruta);
  if (ruta.startsWith("/h/")) return servirCompartida(res, ruta.slice(3));

  const versionada = /^\/v\/[\w-]+\//.test(ruta);
  const limpia = versionada ? ruta.replace(/^\/v\/[\w-]+/, "") : ruta;
  const relativa = normalize(limpia === "/" ? "index.html" : limpia.slice(1));
  if (relativa.startsWith("..")) return responder(res, 404, { error: "No existe" });
  const estatico = await leerEstatico(relativa);
  if (!estatico) return responder(res, 404, { error: "No existe" });
  const { archivo, tipo, etiqueta } = estatico;
  const brotli = COMPRIMIBLES.has(tipo) && /\bbr\b/.test(req.headers["accept-encoding"] || "");
  // Fuera de producción no se guarda nada, para ver cada cambio al recargar.
  const cache = !PRODUCCION || tipo === ".html" ? "no-cache" : versionada ? "public, max-age=31536000, immutable" : "public, max-age=3600";
  if (req.headers["if-none-match"] === etiqueta) {
    res.writeHead(304, { ETag: etiqueta, "Cache-Control": cache });
    return res.end();
  }
  const extra = COMPRIMIBLES.has(tipo) ? { Vary: "Accept-Encoding", ...(brotli && { "Content-Encoding": "br" }) } : {};
  res.writeHead(200, { "Content-Type": TIPOS[tipo] || "application/octet-stream", "Cache-Control": cache, ETag: etiqueta, ...extra, ...CABECERAS });
  // El texto se comprime con Brotli (pesa unas 4 veces menos); en producción, al máximo y una sola vez por archivo.
  const calidad = PRODUCCION ? 11 : 5;
  res.end(brotli ? (estatico.br ??= brotliCompressSync(archivo, { params: { [zlib.BROTLI_PARAM_QUALITY]: calidad } })) : archivo);
}).listen(PUERTO, ANFITRION, () => {
  console.log(`Mascotadas en http://localhost:${PUERTO} (${datos.local ? "local" : "producción"}, ${hayIA() ? "con IA" : "historias de muestra"})`);
});
// Quien envía una petición muy despacio no puede tener conexiones abiertas indefinidamente.
servidor.headersTimeout = 10000;
servidor.requestTimeout = 15000;

async function cerrar() {
  if (cerrando) return;
  cerrando = true;
  console.log(`Cerrando: termino ${trabajos.size} pintura(s) y las peticiones en marcha.`);
  // Por si algo se queda colgado: Railway da 180 s (railway.json) y se sale un poco antes.
  setTimeout(() => process.exit(0), 170000).unref();
  const cerrado = new Promise((listo) => servidor.close(listo)); // No acepta más conexiones; espera a las abiertas.
  servidor.closeIdleConnections();
  for (const despertar of [...despertadores]) despertar();
  await Promise.allSettled([...trabajos, cerrado]);
  process.exit(0);
}
process.on("SIGTERM", cerrar);
process.on("SIGINT", cerrar);
