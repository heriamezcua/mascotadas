import { createHash } from "node:crypto";
import { guardarAudio, leerAudio } from "./datos.mjs";

const VOZ = process.env.MASCOTADAS_VOZ || "Ril2RJBy9NBSOWRuV8uO";
const MODELO = process.env.MASCOTADAS_MODELO_VOZ || "eleven_v4";

export function hayVoz() {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

// Cada texto se paga una vez: releer una historia sale del almacén.
export async function narrar(usuario, texto) {
  if (!hayVoz()) throw new Error("Falta la clave de ElevenLabs");

  const huella = createHash("sha256").update(`${VOZ}|${MODELO}|${texto}`).digest("hex");
  const guardado = await leerAudio(usuario, huella);
  if (guardado) return guardado;

  const respuesta = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOZ}?output_format=mp3_44100_128`, {
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

  const audio = Buffer.from(await respuesta.arrayBuffer());
  await guardarAudio(usuario, huella, audio);
  return audio;
}
