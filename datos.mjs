import { randomBytes, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

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

export async function contarHistorias(usuario, desde) {
  if (local) return memoria.historias.filter((c) => new Date(c.creado) >= desde).length;
  const { count, error } = await supabase
    .from("historias")
    .select("id", { count: "exact", head: true })
    .eq("usuario", usuario)
    .gte("creado", desde.toISOString());
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
export const leerFondo = (usuario, historia, pagina) => leerArchivo("fondos", `${usuario}/${historia}-${pagina}.jpg`);
export const guardarFondo = (usuario, historia, pagina, imagen) =>
  guardarArchivo("fondos", `${usuario}/${historia}-${pagina}.jpg`, imagen, "image/jpeg");

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
