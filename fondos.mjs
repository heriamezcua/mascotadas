import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";

const MODELO = process.env.MASCOTADAS_MODELO_IMAGEN || "gemini-nano-banana-2.1";

// El estilo es fijo para que la ficha y todas las páginas parezcan del mismo dibujo animado.
const ESTILO =
  "Children's cartoon illustration. Flat toon style with thick dark purple-black outlines, " +
  "bold saturated colors, simple rounded shapes and soft cel shading, like a modern 2D animated series.";

const ESPECIES = { perro: "dog", gato: "cat", conejo: "rabbit" };

export function hayImagenes() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function quien(mascota) {
  return `a ${ESPECIES[mascota.especie] ?? "pet"} named ${mascota.nombre}, fur color ${mascota.color} (hex), ` +
    `wearing a collar colored ${mascota.collar} (hex). Personality: ${mascota.personalidad}.`;
}

// La misma mascota descrita igual reutiliza su ficha en todas sus historias.
export function claveFicha(mascota) {
  const rasgos = [mascota.nombre, mascota.especie, mascota.color, mascota.collar, mascota.personalidad].join("|").toLowerCase();
  return createHash("sha256").update(rasgos).digest("hex").slice(0, 24);
}

const SATURADO = [429, 500, 503];
const PAUSAS = [8000, 20000];

// Google a veces está saturado unos segundos: se reintenta antes de dar la página por perdida.
async function pintar(input) {
  for (let intento = 0; ; intento++) {
    try {
      return await pintarUnaVez(input);
    } catch (error) {
      if (!SATURADO.includes(error.status) || intento >= PAUSAS.length) throw error;
      await new Promise((listo) => setTimeout(listo, PAUSAS[intento]));
    }
  }
}

async function pintarUnaVez(input) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const respuesta = await ai.interactions.create({
    model: MODELO,
    input,
    response_format: { type: "image", mime_type: "image/jpeg", aspect_ratio: "16:9", image_size: "1K" },
  });
  const imagen = respuesta.output_image;
  if (!imagen?.data) throw new Error("La IA no ha devuelto la imagen");
  return Buffer.from(imagen.data, "base64");
}

export function pintarFicha(mascota) {
  return pintar(
    `${ESTILO}\nCharacter reference sheet of the main character: ${quien(mascota)} ` +
      "Cute, expressive, big eyes, full body, a few poses, plain light cream background, no text.",
  );
}

// Cada página se pinta con la ficha delante, para que la mascota sea la misma en toda la historia.
export function pintarEscena(pagina, mascota, ficha) {
  return pintar([
    { type: "image", data: ficha.toString("base64"), mime_type: "image/jpeg" },
    {
      type: "text",
      text: `${ESTILO}\nThe attached image is the main character: ${quien(mascota)} ` +
        "Draw exactly this same character (same colors, collar, proportions and style) inside this scene, " +
        "in the foreground, clearly visible and acting out the moment.\n" +
        `Scene: ${pagina.fondo}\nWhat happens: ${pagina.texto}\n` +
        "Wide 16:9. Only this one animal, no people, no text, no letters, no logos, no watermark.",
    },
  ]);
}

// Pinta todas las páginas a la vez; si alguna falla, esa página se queda con el escenario dibujado.
export async function pintarFondos(paginas, mascota, { leerFicha, guardarFicha, guardar }) {
  let ficha = await leerFicha();
  if (!ficha) {
    ficha = await pintarFicha(mascota);
    await guardarFicha(ficha);
  }
  const resultados = await Promise.allSettled(
    paginas.map(async (pagina, i) => {
      if (!pagina.fondo) return false;
      await guardar(i, await pintarEscena(pagina, mascota, ficha));
      return true;
    }),
  );
  resultados.forEach((r, i) => r.status === "rejected" && console.error(`Fondo ${i}:`, r.reason?.message));
  return resultados.map((r) => r.status === "fulfilled" && r.value);
}
