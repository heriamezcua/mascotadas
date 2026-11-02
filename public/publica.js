import { ponerFondo } from "./ilustracion.js";

const $ = (id) => document.getElementById(id);
const enlace = location.pathname.split("/").pop();
const NOMBRES_VOZ = { "espana-hombre": "Marco", "espana-mujer": "Laura", "latam-hombre": "Mateo", "latam-mujer": "Samanta" };
const ESCENA = '<svg class="escena" viewBox="0 0 800 500" role="img" aria-label="Ilustración de la historia" xmlns="http://www.w3.org/2000/svg"><g class="capa-fondo"></g></svg>';

const estado = { historia: null, pagina: 0, leyendo: false, audio: null };
const imagenes = new Map();

function urlFondo(pagina) {
  return `/api/publica/fondo?e=${enlace}&pagina=${pagina}`;
}

// Precarga la imagen para que al pasar de página aparezca sin esperas.
function cargarImagen(pagina) {
  if (!estado.historia.paginas[pagina]?.imagen) return Promise.resolve(null);
  if (!imagenes.has(pagina)) {
    imagenes.set(pagina, new Promise((listo) => {
      const img = new Image();
      img.onload = () => listo(img.src);
      img.onerror = () => listo(null);
      img.src = urlFondo(pagina);
    }));
  }
  return imagenes.get(pagina);
}

async function pintarPagina() {
  const { historia, pagina } = estado;
  const datos = historia.paginas[pagina];
  const total = historia.paginas.length;
  const figura = $("pagina");
  figura.className = "pagina-libro esperando-imagen";
  figura.innerHTML = ESCENA;
  $("texto-pagina").textContent = datos.texto;
  $("contador").textContent = `${pagina + 1} de ${total}`;
  $("puntos").replaceChildren(...historia.paginas.map((_, i) => {
    const punto = document.createElement("span");
    punto.className = i === pagina ? "actual" : i < pagina ? "leida" : "";
    return punto;
  }));
  $("anterior").disabled = pagina === 0;
  $("siguiente").disabled = pagina === total - 1;
  $("final").hidden = pagina !== total - 1;
  pintarVoces();
  cargarImagen(pagina + 1);
  const escena = figura.querySelector(".escena");
  const url = await cargarImagen(pagina);
  if (!escena.isConnected) return;
  figura.classList.remove("esperando-imagen");
  if (url) ponerFondo(escena, url, true);
  else figura.classList.add("sin-imagen");
}

/* ---------- Narración: solo con los audios que su dueño ya escuchó ---------- */

function pintarVoces() {
  const voces = estado.historia.paginas[estado.pagina].voces;
  const antes = $("voz").value;
  $("voz").replaceChildren(...voces.map((voz) => new Option(`Voz: ${NOMBRES_VOZ[voz] ?? voz}`, voz)));
  if (voces.includes(antes)) $("voz").value = antes;
  $("narracion").hidden = voces.length === 0;
}

function audioEn(como) {
  const sonando = como === "sonando";
  $("leer").classList.toggle("sonando", sonando);
  $("leer").setAttribute("aria-label", sonando ? "Pausar" : como === "pausa" ? "Continuar" : "Escuchar");
  $("estado-audio").textContent = { parado: "Escuchar", sonando: "Escuchando", pausa: "En pausa" }[como];
}

function parar() {
  estado.leyendo = false;
  estado.audio?.pause();
  estado.audio = null;
  audioEn("parado");
}

function leerPagina() {
  const voz = $("voz").value;
  if (!voz) return parar();
  const audio = new Audio(`/api/publica/voz?e=${enlace}&pagina=${estado.pagina}&voz=${voz}`);
  estado.audio = audio;
  audio.onended = () => {
    if (!estado.leyendo) return;
    const siguiente = estado.pagina + 1;
    if (siguiente >= estado.historia.paginas.length || !estado.historia.paginas[siguiente].voces.includes(voz)) return parar();
    irA(siguiente);
    leerPagina();
  };
  audioEn("sonando");
  audio.play().catch(parar);
}

function irA(pagina) {
  estado.pagina = pagina;
  pintarPagina();
  window.scrollTo({ top: 0 });
}

$("leer").addEventListener("click", () => {
  if (estado.leyendo) {
    estado.leyendo = false;
    estado.audio?.pause();
    return audioEn("pausa");
  }
  estado.leyendo = true;
  if (estado.audio) {
    audioEn("sonando");
    estado.audio.play();
  } else {
    leerPagina();
  }
});
$("voz").addEventListener("change", () => {
  const seguia = estado.leyendo;
  parar();
  if (seguia) {
    estado.leyendo = true;
    leerPagina();
  }
});
$("anterior").addEventListener("click", () => { parar(); irA(estado.pagina - 1); });
$("siguiente").addEventListener("click", () => { parar(); irA(estado.pagina + 1); });

async function iniciar() {
  const respuesta = await fetch(`/api/publica?e=${encodeURIComponent(enlace)}`).catch(() => null);
  $("cargando-publica").hidden = true;
  if (!respuesta?.ok) {
    $("no-disponible").hidden = false;
    return;
  }
  estado.historia = await respuesta.json();
  $("protagonista").textContent = estado.historia.mascota.nombre;
  $("titulo-libro").textContent = estado.historia.titulo;
  $("libro").hidden = false;
  pintarPagina();
}

iniciar();
