import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Sin Supabase configurado todo vive en memoria, con un único usuario: sirve para desarrollar y probar.
export const local = !process.env.SUPABASE_URL;

const supabase = local
  ? null
  : createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const memoria = { perfil: { id: "local", prueba_usada: false }, historias: [], audio: new Map() };

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

export async function leerAudio(usuario, huella) {
  if (local) return memoria.audio.get(huella) ?? null;
  const { data, error } = await supabase.storage.from("audio").download(`${usuario}/${huella}.mp3`);
  return error ? null : Buffer.from(await data.arrayBuffer());
}

export async function guardarAudio(usuario, huella, audio) {
  if (local) return void memoria.audio.set(huella, audio);
  comprobar(
    await supabase.storage.from("audio").upload(`${usuario}/${huella}.mp3`, audio, { contentType: "audio/mpeg", upsert: true }),
  );
}

// Borra al usuario y, en cascada, su perfil y sus historias.
export async function borrarUsuario(id) {
  if (local) {
    memoria.perfil = { id: "local", prueba_usada: false };
    memoria.historias = [];
    memoria.audio.clear();
    return;
  }
  const archivos = comprobar(await supabase.storage.from("audio").list(id, { limit: 1000 }));
  if (archivos.length) {
    comprobar(await supabase.storage.from("audio").remove(archivos.map((a) => `${id}/${a.name}`)));
  }
  comprobar(await supabase.auth.admin.deleteUser(id));
}
