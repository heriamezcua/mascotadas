import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { hayIA } from "./historias.mjs";

// Cuento de ejemplo ya escrito, ilustrado y narrado (carpeta cuento/). Sin clave de la IA, la web lo usa para todas
// las historias nuevas: se puede probar entera sin gastar nada en IA.
const carpeta = fileURLToPath(new URL("./cuento/", import.meta.url));
const datos = existsSync(join(carpeta, "cuento.json")) ? JSON.parse(readFileSync(join(carpeta, "cuento.json"), "utf8")) : null;

export const usarCuento = () => Boolean(datos) && !hayIA();

export const historiaDelCuento = () => ({
  titulo: datos.titulo,
  modo: "cuento",
  paginas: datos.paginas.map((pagina) => ({ ...pagina, imagen: "escena" })),
});

export const fondoDelCuento = (pagina) => readFile(join(carpeta, `fondo-${pagina}.webp`)).catch(() => null);
export const vozDelCuento = (pagina, voz) => readFile(join(carpeta, `voz-${voz}-${pagina}.mp3`)).catch(() => null);
