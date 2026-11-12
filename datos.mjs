import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

// Sin Supabase configurado todo vive en memoria, con un único usuario: sirve para desarrollar y probar.
export const local = !process.env.SUPABASE_URL;

const supabase = local
  ? null
  : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const memoria = { perfil: { id: "local", prueba_usada: false }, historias: [], archivos: new Map() };

function comprobar({ data, error }) {
  if (error) throw new Error(error.message);
  return data;
}

export async function usuarioDe(req) {
  if (local) return { id: "local", email: "local@mascotadas.test" };
  const token = req.headers.authorization?.replace(/^Bearer /, "");
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  return error ? null : data.user;
}

export async function leerPerfil(id) {
  if (local) return memoria.perfil;
  const fila = comprobar(await supabase.from("perfiles").select("*").eq("id", id).maybeSingle());
  return fila ?? { id, prueba_usada: false };
}

export async function guardarPerfil(id, cambios) {
  if (local) return Object.assign(memoria.perfil, cambios);
  comprobar(await supabase.from("perfiles").upsert({ id, ...cambios }));
}

// Historias de pack que siguen valiendo (0 si han caducado).
export const extraDe = (perfil, ahora = new Date()) =>
  perfil?.historias_extra > 0 && new Date(perfil.extra_caducan) > ahora ? perfil.historias_extra : 0;

// Suma un pack comprado. Devuelve false si esa compra ya se había sumado.
export async function sumarPack(compra, usuario, historias, importe) {
  if (local) {
    memoria.compras ??= new Set();
    if (memoria.compras.has(compra)) return false;
    memoria.compras.add(compra);
    const perfil = memoria.perfil;
    perfil.historias_extra = extraDe(perfil) + historias;
    perfil.extra_caducan = new Date(Date.now() + 365 * 86400000).toISOString();
    return true;
  }
  return comprobar(await supabase.rpc("sumar_pack", { p_compra: compra, p_usuario: usuario, p_historias: historias, p_importe: importe }));
}

// Gasta una historia de pack; false si no le queda ninguna válida.
export async function gastarExtra(usuario) {
  if (local) {
    if (!extraDe(memoria.perfil)) return false;
    memoria.perfil.historias_extra--;
    return true;
  }
  return comprobar(await supabase.rpc("gastar_extra", { p_usuario: usuario }));
}

export async function devolverExtra(usuario) {
  if (local) return void memoria.perfil.historias_extra++;
  comprobar(await supabase.rpc("devolver_extra", { p_usuario: usuario }));
}

export async function listarHistorias(usuario) {
  if (local) return memoria.historias;
  return comprobar(
    await supabase.from("historias").select("*").eq("usuario", usuario).order("creado", { ascending: false }),
  );
}

export async function leerHistoria(id, usuario) {
  if (local) return memoria.historias.find((c) => c.id === id) ?? null;
  return comprobar(await supabase.from("historias").select("*").eq("id", id).eq("usuario", usuario).maybeSingle());
}

// Compartir da a la historia un enlace público imposible de adivinar; dejar de compartir lo borra.
export async function compartirHistoria(id, usuario) {
  const historia = await leerHistoria(id, usuario);
  if (!historia) return null;
  if (historia.compartida) return historia.compartida;
  const enlace = randomBytes(9).toString("base64url");
  await actualizarHistoria(id, usuario, { compartida: enlace });
  return enlace;
}

export async function dejarDeCompartir(id, usuario) {
  await actualizarHistoria(id, usuario, { compartida: null });
}

export async function leerCompartida(enlace) {
  if (local) return memoria.historias.find((c) => c.compartida === enlace) ?? null;
  return comprobar(await supabase.from("historias").select("*").eq("compartida", enlace).maybeSingle());
}

export async function crearHistoria(usuario, historia) {
  if (local) {
    const fila = { id: randomUUID(), usuario, creado: new Date().toISOString(), ...historia };
    memoria.historias.unshift(fila);
    return fila;
  }
  return comprobar(await supabase.from("historias").insert({ usuario, ...historia }).select().single());
}

// Historias del plan creadas desde una fecha; las de pack no cuentan para su límite.
export async function contarHistorias(usuario, desde) {
  if (local) return memoria.historias.filter((c) => new Date(c.creado) >= desde && !c.de_pack).length;
  const { count, error } = await supabase
    .from("historias")
    .select("id", { count: "exact", head: true })
    .eq("usuario", usuario)
    .eq("de_pack", false)
    .gte("creado", desde.toISOString());
  if (error) throw new Error(error.message);
  return count;
}

// Historias creadas por todos los usuarios desde una fecha: el tope diario de la demo.
export async function historiasDesde(desde) {
  if (local) return memoria.historias.filter((c) => new Date(c.creado) >= desde).length;
  const { count, error } = await supabase.from("historias").select("id", { count: "exact", head: true }).gte("creado", desde.toISOString());
  if (error) throw new Error(error.message);
  return count;
}

export async function actualizarHistoria(id, usuario, cambios) {
  if (local) return Object.assign(memoria.historias.find((c) => c.id === id), cambios);
  return comprobar(await supabase.from("historias").update(cambios).eq("id", id).eq("usuario", usuario).select().single());
}

// Los archivos de cada usuario van en su carpeta de cada cubo: "audio" (narraciones) y "fondos" (escenarios).
const CUBOS = ["audio", "fondos"];

async function leerArchivo(cubo, ruta) {
  if (local) return memoria.archivos.get(`${cubo}/${ruta}`) ?? null;
  const { data, error } = await supabase.storage.from(cubo).download(ruta);
  return error ? null : Buffer.from(await data.arrayBuffer());
}

async function guardarArchivo(cubo, ruta, contenido, tipo) {
  if (local) return void memoria.archivos.set(`${cubo}/${ruta}`, contenido);
  comprobar(await supabase.storage.from(cubo).upload(ruta, contenido, { contentType: tipo, upsert: true }));
}

export const leerAudio = (usuario, huella) => leerArchivo("audio", `${usuario}/${huella}.mp3`);

// Nombres de los audios que ya tiene guardados un usuario, para saber qué se puede escuchar sin generar nada.
export async function audiosDe(usuario) {
  if (local) return new Set([...memoria.archivos.keys()].filter((k) => k.startsWith(`audio/${usuario}/`)).map((k) => k.split("/").pop()));
  const nombres = new Set();
  for (let desde = 0; ; desde += 1000) {
    const lote = comprobar(await supabase.storage.from("audio").list(usuario, { limit: 1000, offset: desde }));
    for (const archivo of lote) nombres.add(archivo.name);
    if (lote.length < 1000) return nombres;
  }
}
export const guardarAudio = (usuario, huella, audio) => guardarArchivo("audio", `${usuario}/${huella}.mp3`, audio, "audio/mpeg");
// Los fondos se guardan en WebP: pesan unas 6 veces menos que el JPEG de la IA y se ven igual.
const aWebp = (imagen) => sharp(imagen).webp({ quality: 80, effort: 5 }).toBuffer();

export async function leerFondo(usuario, historia, pagina) {
  const ruta = `${usuario}/${historia}-${pagina}`;
  const webp = await leerArchivo("fondos", `${ruta}.webp`);
  if (webp) return webp;
  // Las historias de antes del cambio están en JPEG: se pasan a WebP la primera vez que se leen.
  const jpg = await leerArchivo("fondos", `${ruta}.jpg`);
  if (!jpg) return null;
  const convertida = await aWebp(jpg);
  guardarArchivo("fondos", `${ruta}.webp`, convertida, "image/webp").catch((error) => console.error("Fondo a WebP:", error.message));
  return convertida;
}
export const guardarFondo = async (usuario, historia, pagina, imagen) =>
  guardarArchivo("fondos", `${usuario}/${historia}-${pagina}.webp`, await aWebp(imagen), "image/webp");

// Para las vistas previas de los enlaces (WhatsApp, Instagram...), que no siempre entienden WebP.
export const fondoEnJpeg = (imagen) => sharp(imagen).jpeg({ quality: 82 }).toBuffer();

export const leerFicha = (usuario, clave) => leerArchivo("fondos", `${usuario}/ficha-${clave}.jpg`);
export const guardarFicha = (usuario, clave, imagen) =>
  guardarArchivo("fondos", `${usuario}/ficha-${clave}.jpg`, imagen, "image/jpeg");

// Borra al usuario y, en cascada, su perfil y sus historias.
export async function borrarUsuario(id) {
  if (local) {
    memoria.perfil = { id: "local", prueba_usada: false };
    memoria.historias = [];
    memoria.archivos.clear();
    return;
  }
  for (const cubo of CUBOS) {
    const archivos = comprobar(await supabase.storage.from(cubo).list(id, { limit: 1000 }));
    if (archivos.length) comprobar(await supabase.storage.from(cubo).remove(archivos.map((a) => `${id}/${a.name}`)));
  }
  comprobar(await supabase.auth.admin.deleteUser(id));
}
