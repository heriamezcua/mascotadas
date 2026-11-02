import { createHash } from "node:crypto";
import { GoogleGenAI } from "@google/genai";

const MODELO = process.env.MASCOTADAS_MODELO_IMAGEN || "gemini-nano-banana-2.1";

// El estilo es fijo para que la ficha y todas las páginas parezcan del mismo dibujo animado.
const ESTILO =
  "Children's cartoon illustration. Flat toon style with thick dark purple-black outlines, " +
  "bold saturated colors, simple rounded shapes and soft cel shading, like a modern 2D animated series.";

// Especie en inglés, de qué está cubierta y qué lleva puesto del color del "collar".
export const ESPECIES = {
  perro: ["dog", "fur", "collar"],
  gato: ["cat", "fur", "collar"],
  conejo: ["rabbit", "fur", "collar"],
  hamster: ["hamster", "fur", "collar"],
  cobaya: ["guinea pig", "fur", "collar"],
  chinchilla: ["chinchilla", "fur", "collar"],
  huron: ["ferret", "fur", "collar"],
  erizo: ["hedgehog", "spines", "little bow tie"],
  cerdito: ["mini pig", "skin", "collar"],
  caballo: ["horse", "coat", "halter"],
  periquito: ["budgie", "feathers", "little bow tie"],
  loro: ["parrot", "feathers", "little bow tie"],
  tortuga: ["turtle", "shell", "little bow tie"],
  pez: ["goldfish", "scales", "little bow tie"],
  serpiente: ["friendly snake", "scales", "little bow tie"],
  tarantula: ["friendly fluffy tarantula with eight legs always visible in every pose", "hairy body", "little bow tie"],
};

export function hayImagenes() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function quien(mascota) {
  const [animal, cubierta, accesorio] = ESPECIES[mascota.especie] ?? ESPECIES.perro;
  const lleva = mascota.collar === "ninguno"
    ? "wearing no collar, bow or any accessory"
    : `wearing a ${accesorio} colored ${mascota.collar} (hex)`;
  return `a ${animal} named ${mascota.nombre}, ${cubierta} color ${mascota.color} (hex), ${lleva}. Personality: ${mascota.personalidad}.`;
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
