import { createHash } from "node:crypto";
import { guardarAudio, leerAudio } from "./datos.mjs";

// Voces de la biblioteca de ElevenLabs que se pueden elegir al escuchar.
export const VOCES = {
  "espana-hombre": process.env.MASCOTADAS_VOZ || "Ril2RJBy9NBSOWRuV8uO", // Marco Aurelio
  "espana-mujer": "yiWEefwu5z3DQCM79clN", // Laura López
  "latam-hombre": "vPrtQbTwtAoP87VnQmID", // Mateo Aragón
  "latam-mujer": "qBvury71WUJfVeT1STkG", // Samanta
};
const MODELO = process.env.MASCOTADAS_MODELO_VOZ || "eleven_v4";

export function hayVoz() {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

// Cada texto se paga una vez: releer una historia sale del almacén.
// Si no está guardado, devuelve el audio en streaming según lo genera ElevenLabs, para que empiece a sonar en un segundo.
export async function narrar(usuario, texto, voz) {
  if (!hayVoz()) throw new Error("Falta la clave de ElevenLabs");
  const VOZ = VOCES[voz] ?? VOCES["espana-hombre"];

  const huella = createHash("sha256").update(`${VOZ}|${MODELO}|${texto}`).digest("hex");
  const guardado = await leerAudio(usuario, huella);
  if (guardado) return { audio: guardado };

  const respuesta = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}/stream?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      text: texto,
      model_id: MODELO,
      voice_settings: { stability: 0.6, similarity_boost: 0.7, style: 0, speed: 0.9, use_speaker_boost: true },
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!respuesta.ok) throw new Error(`ElevenLabs respondió ${respuesta.status}: ${(await respuesta.text()).slice(0, 200)}`);

  return { flujo: respuesta.body, guardar: (audio) => guardarAudio(usuario, huella, audio) };
}
