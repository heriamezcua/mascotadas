import { ilustrar, ponerFondo } from "./ilustracion.js";
import { empezarQuiz } from "./quiz.js";

const $ = (id) => document.getElementById(id);
const BORRADOR = "mascotadas.borrador";
const VOZ = "mascotadas.voz";
const VISTAS = ["portada", "panel", "crear", "cargando", "libro"];

// Opciones del formulario: el valor es lo que recibe la IA; la etiqueta, lo que se ve.
const ESPECIES = [
  ["perro", "Perro"], ["gato", "Gato"], ["conejo", "Conejo"], ["hamster", "Hámster"],
  ["cobaya", "Cobaya"], ["periquito", "Periquito"], ["tortuga", "Tortuga"], ["pez", "Pez"],
  ["chinchilla", "Chinchilla"], ["huron", "Hurón"], ["erizo", "Erizo"], ["cerdito", "Cerdito"],
  ["caballo", "Caballo"], ["loro", "Loro"], ["serpiente", "Serpiente"], ["tarantula", "Tarántula"],
];
const VISIBLES = 8; // El resto de especies se abre con «Más animales».
const PERSONALIDADES = [
  ["muy dramático", "Dramático"], ["un genio incomprendido", "Genio incomprendido"], ["vago profesional", "Vago profesional"],
  ["valiente sin motivo", "Valiente"], ["un cotilla", "Cotilla"], ["un tragón sin remedio", "Tragón"],
  ["un miedica de campeonato", "Miedica"], ["juguetón sin descanso", "Juguetón"], ["un pegajoso incurable", "Pegajoso"],
  ["presumido como una estrella", "Presumido"], ["un gruñón con buen corazón", "Gruñón"],
];
const TONOS = [
  ["comedia", "Comedia", "#FFD23F", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="#FFD23F" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="16" r="12"/><path d="M10 18c2 4 10 4 12 0" fill="none"/><path d="M11 12.5h.1M21 12.5h.1" stroke-width="3.5"/></svg>'],
  ["película de espías", "Espías", "#3DD6B0", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13h24"/><path d="M5 13l1.5 6a3 3 0 0 0 3 2h2a3 3 0 0 0 3-2.5L15 15h2l.5 3.5a3 3 0 0 0 3 2.5h2a3 3 0 0 0 3-2l1.5-6" fill="#2B1840"/><path d="M9 13l2-6h10l2 6"/></svg>'],
  ["detective", "Detective", "#9FE3FF", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="13" cy="13" r="8" fill="#9FE3FF"/><path d="M19 19l8 8" stroke-width="4"/></svg>'],
  ["epopeya", "Epopeya", "#D9E2EC", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M22 4l6 0 0 6-12 12-6-6z" fill="#D9E2EC"/><path d="M8 18l6 6M6 26l4-4M5 21l6 6"/></svg>'],
  ["culebrón", "Culebrón", "#FF8FB8", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="#FF8FB8" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 27S5 20.5 5 12a6 6 0 0 1 11-3.3A6 6 0 0 1 27 12c0 8.5-11 15-11 15z"/></svg>'],
  ["documental animal", "Documental", "#3DD6B0", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="19" r="6" fill="#3DD6B0"/><circle cx="23" cy="19" r="6" fill="#3DD6B0"/><path d="M13 13l1-5h4l1 5M15 19h2"/></svg>'],
  ["ciencia ficción", "Ciencia ficción", "#B69CFF", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3c5 3 7 8 7 14l-3 5h-8l-3-5c0-6 2-11 7-14z" fill="#B69CFF"/><circle cx="16" cy="13" r="2.5" fill="#fff"/><path d="M12 25l-1 4M16 25v4M20 25l1 4"/></svg>'],
  ["aventura pirata", "Piratas", "#FFD23F", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="none" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="16" cy="7" r="3"/><path d="M16 10v18M10 15h12"/><path d="M5 19c1 6 6 9 11 9s10-3 11-9"/></svg>'],
  ["miedo para niños", "Miedo suave", "#B69CFF", '<svg viewBox="0 0 32 32" aria-hidden="true" fill="#fff" stroke="#2B1840" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 28V14a9 9 0 0 1 18 0v14l-3-2.5-3 2.5-3-2.5-3 2.5-3-2.5z"/><path d="M12.5 14h.1M19.5 14h.1" stroke-width="4"/></svg>'],
];
const COLORES = [
  ["#c98a4f", "Canela"], ["#2e2a2a", "Negro"], ["#efe6da", "Blanco"], ["#8d8d99", "Gris"], ["#e08a3c", "Naranja"],
  ["#7a5230", "Marrón"], ["#5fae4e", "Verde"], ["#4a90d9", "Azul"], ["#f2c94c", "Amarillo"],
];
const COLLARES = [["#d9503f", "Rojo"], ["#3f7fd9", "Azul"], ["#3fa37a", "Verde"], ["#e8a42c", "Amarillo"], ["#2b2b2b", "Negro"], ["ninguno", "Ninguno"]];
const RASGOS = ["nombre", "especie", "personalidad", "mania", "color", "collar"];
// Manías de ejemplo: cada vez que se abre el formulario salen 3 distintas al azar.
const IDEAS = [
  "Roba calcetines", "Odia el aspirador", "Duerme encima del teclado", "Ladra al cartero", "Persigue su cola",
  "Esconde juguetes en el sofá", "Se sube a la mesa", "Mira fijamente la nevera", "Bebe agua del grifo", "Le teme a las bolsas",
  "Duerme en la ropa limpia", "Roba la comida del plato", "Se mete en todas las cajas", "Persigue la luz del móvil", "Ronca muy fuerte",
  "Ataca los pies bajo la manta", "Abre los armarios", "Muerde los cables", "Canta cuando suena el timbre", "Tira cosas de la mesa",
  "Se esconde en la lavadora", "Odia la ducha", "Espera en la puerta", "Roba las zapatillas", "Habla con los pájaros",
  "Duerme panza arriba", "Se come las plantas", "Persigue a las moscas", "Celoso del robot aspirador", "Se tumba sobre el periódico",
  "Ladra a su reflejo", "Esconde comida para luego", "Despierta a todos al amanecer", "Arrastra la manta por la casa", "Se asusta con los globos",
  "Le encanta el queso", "Se sube a las cortinas", "Lame las ventanas", "Sigue a todos al baño", "Colecciona tapones",
];

const barajarIdeas = () => IDEAS.map((idea) => [Math.random(), idea]).sort((a, b) => a[0] - b[0]).map(([, idea]) => idea);

function pintarIdeas() {
  const actuales = new Set([...$("ideas").children].map((boton) => boton.textContent));
  const nuevas = barajarIdeas().filter((idea) => !actuales.has(idea)).slice(0, 3);
  $("ideas").replaceChildren(...nuevas.map((idea) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "idea";
    boton.textContent = idea;
    return boton;
  }));
}
const LIMITES = { prueba: 3, basico: 8, premium: 1 };
const NOMBRES_PLAN = { prueba: "Prueba gratis", basico: "Mensual", premium: "Premium" };
const TICK = '<span class="marca-ok" aria-hidden="true"><svg><use href="#i-tick"/></svg></span>';

const etiqueta = (lista, valor) => lista.find(([v]) => v === valor)?.[1] ?? valor;
const escapar = (texto) => String(texto).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));
const euros = (n) => `${n.toFixed(2).replace(".", ",")} €`;
const fecha = (d) => d.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

const estado = {
  config: null, cliente: null, sesion: null, cuenta: null, vista: "portada",
  actual: null, pagina: 0, leyendo: false, audio: null, turno: 0, mascota: null, ultimaPeticion: null,
};

/* ---------- Fondos pintados por IA ---------- */

const fondos = new Map(); // Cada fondo se descarga una vez por visita.
const listos = new Map(); // Los fondos que ya han terminado de cargar (o de fallar).

// Un fondo recién pedido puede tardar unos minutos en pintarse: mientras no exista, se vuelve a preguntar.
function cargarFondo(historia, pagina) {
  const clave = `${historia}-${pagina}`;
  if (!fondos.has(clave)) {
    fondos.set(clave, (async () => {
      for (let intento = 0; intento < 72; intento++) {
        const r = await api(`/api/fondo?historia=${historia}&pagina=${pagina}`).catch(() => null);
        if (r?.ok) {
          const url = URL.createObjectURL(await r.blob());
          listos.set(clave, url);
          return url;
        }
        if (r && r.status !== 404) break;
        await esperar(5000);
      }
      fondos.delete(clave);
      listos.set(clave, null);
      return null;
    })());
  }
  return fondos.get(clave);
}

// Las páginas con descripción de escena se pintan con IA; solo las historias antiguas, sin ella, usan el dibujo.
const conIA = (historia, i) => Boolean(historia.paginas[i]?.fondo || historia.paginas[i]?.imagen);
const paginaLista = (historia, i) => !conIA(historia, i) || Boolean(listos.get(`${historia.id}-${i}`));

// Las historias con imágenes de IA nunca enseñan el dibujo de reserva: un hueco que brilla hasta que llega la imagen.
const ESCENA_VACIA = '<svg class="escena" viewBox="0 0 800 500" role="img" aria-label="Ilustración de la historia" xmlns="http://www.w3.org/2000/svg"><g class="capa-fondo"></g></svg>';
const escenaDe = (historia, i) => (conIA(historia, i) ? ESCENA_VACIA : ilustrar(historia.paginas[i], historia.mascota));

const repintados = new Map(); // Páginas que se están volviendo a pintar ahora mismo.

// Una página cuyo pintado falló se vuelve a pintar al necesitarla; las demás solo se descargan.
function asegurarFondo(historia, i) {
  const pagina = historia.paginas[i];
  const clave = `${historia.id}-${i}`;
  if (pagina?.imagen !== false || !pagina.fondo) return cargarFondo(historia.id, i);
  if (!repintados.has(clave)) {
    repintados.set(clave, (async () => {
      const respuesta = await api("/api/repintar", { method: "POST", body: JSON.stringify({ historia: historia.id, pagina: i }) }).catch(() => null);
      repintados.delete(clave);
      if (!respuesta?.ok) return null;
      pagina.imagen = "escena";
      fondos.delete(clave);
      listos.delete(clave);
      return cargarFondo(historia.id, i);
    })());
  }
  return repintados.get(clave);
}

async function pintarFondo(contenedor, historia, pagina) {
  if (!conIA(historia, pagina)) return;
  const escena = contenedor.querySelector(".escena");
  contenedor.classList.add("esperando-imagen");
  const url = await asegurarFondo(historia, pagina);
  if (!escena.isConnected) return; // Si ya se ha pasado de página, no se toca la nueva.
  contenedor.classList.remove("esperando-imagen");
  if (url) ponerFondo(escena, url, historia.paginas[pagina].imagen !== true); // true: historias antiguas con la mascota dibujada encima.
  else contenedor.classList.add("sin-imagen");
}

/* ---------- Utilidades ---------- */

function leerBorrador() {
  try {
    return JSON.parse(localStorage.getItem(BORRADOR));
  } catch {
    return null;
  }
}

function guardarBorrador(datos) {
  try {
    if (datos) localStorage.setItem(BORRADOR, JSON.stringify(datos));
    else localStorage.removeItem(BORRADOR);
  } catch {
    // Sin almacenamiento solo se pierde el formulario al entrar.
  }
}

async function api(ruta, opciones = {}) {
  const headers = { ...(opciones.body ? { "Content-Type": "application/json" } : {}) };
  if (estado.sesion) headers.Authorization = `Bearer ${estado.sesion.access_token}`;
  return fetch(ruta, { ...opciones, headers });
}

const dentro = () => estado.config?.local || Boolean(estado.sesion);

function mostrar(vista) {
  estado.vista = vista;
  for (const id of VISTAS) $(id).hidden = id !== vista;
  document.body.className = `en-${vista}`;
  if (vista !== "libro") parar();
  window.scrollTo(0, 0);
}

const inicio = () => mostrar(dentro() ? "panel" : "portada");

function cerrarVentanas() {
  for (const ventana of document.querySelectorAll("dialog[open]")) ventana.close();
}

/* ---------- Panel: sus mascotas y sus historias ---------- */

// Las mascotas guardadas salen de sus historias: la más reciente de cada nombre y especie.
function misMascotas(historias) {
  const vistas = new Map();
  for (const { mascota } of historias) {
    const clave = `${mascota.nombre.toLowerCase()}|${mascota.especie}`;
    if (!vistas.has(clave)) vistas.set(clave, mascota);
  }
  return [...vistas.values()];
}

// Mini retrato de cada especie, pintado en el mismo estilo que las historias.
const retratoHtml = (especie) => `<img class="retrato" src="img/especies/${ESPECIES.some(([v]) => v === especie) ? especie : "perro"}.jpg" alt="" width="52" height="52" loading="lazy">`;

function retrato(especie) {
  const plantilla = document.createElement("template");
  plantilla.innerHTML = retratoHtml(especie);
  return plantilla.content.firstChild;
}

function cuandoFue(texto) {
  const dia = new Date(texto);
  const hoy = new Date();
  const ayer = new Date(Date.now() - 86400000);
  if (dia.toDateString() === hoy.toDateString()) return "hoy";
  if (dia.toDateString() === ayer.toDateString()) return "ayer";
  return dia.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

function pintarMascotas(historias) {
  const mascotas = misMascotas(historias);
  if (!mascotas.includes(estado.mascota)) estado.mascota = mascotas[0] ?? null;
  $("sin-mascotas").hidden = mascotas.length > 0;
  const nueva = document.createElement("button");
  nueva.type = "button";
  nueva.className = "chip chip-nueva";
  nueva.innerHTML = '<svg width="20" height="20" aria-hidden="true"><use href="#i-mas"/></svg>';
  nueva.append(mascotas.length ? "Nueva" : "Nueva mascota");
  nueva.addEventListener("click", () => abrirCrear(null));
  $("chips-mascotas").replaceChildren(...mascotas.map((mascota, i) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.setAttribute("aria-pressed", String(mascota === estado.mascota));
    chip.append(retrato(mascota.especie), `${mascota.nombre} · ${etiqueta(ESPECIES, mascota.especie).toLowerCase()}`);
    chip.addEventListener("click", () => {
      estado.mascota = mascota;
      pintarMascotas(historias);
    });
    return chip;
  }), nueva);
  $("nueva-historia-texto").textContent = estado.mascota ? `Nueva historia de ${estado.mascota.nombre}` : "Crear una historia";
}

function pintarSaldo() {
  const { plan, quedan } = estado.cuenta ?? {};
  $("saldo").hidden = !plan;
  if (!plan) return;
  const limite = LIMITES[plan];
  $("t-saldo").textContent = plan === "premium"
    ? quedan ? "Hoy le queda 1 historia nueva" : "Hoy ya ha estrenado su historia"
    : `Le ${quedan === 1 ? "queda 1 historia nueva" : `quedan ${quedan} historias nuevas`}`;
  $("saldo-de").textContent = plan === "premium" ? "cada día" : `de ${limite}`;
  $("saldo-barra").style.gridTemplateColumns = `repeat(${limite}, minmax(0, 1fr))`;
  $("saldo-barra").setAttribute("aria-label", `${limite - quedan} de ${limite} historias usadas`);
  $("saldo-barra").replaceChildren(...Array.from({ length: limite }, (_, i) => {
    const trozo = document.createElement("span");
    if (i >= limite - quedan) trozo.className = "libre";
    return trozo;
  }));
  $("saldo-plan").textContent = `Plan ${NOMBRES_PLAN[plan]} ·`;
}

// Las miniaturas cargan su imagen solo al aparecer en pantalla; luego sirve también al abrir la historia.
const miniaturasVisibles = new IntersectionObserver((entradas) => {
  for (const { isIntersecting, target } of entradas) {
    if (!isIntersecting) continue;
    miniaturasVisibles.unobserve(target);
    pintarFondo(target, target.historia, 0);
  }
}, { rootMargin: "200px" });

function pintarHistorias(historias) {
  $("num-historias").textContent = historias.length === 1 ? "1 historia" : `${historias.length} historias`;
  $("num-historias").hidden = historias.length === 0;
  $("sin-historias").hidden = historias.length > 0;
  $("lista-historias").replaceChildren(...historias.map((historia) => {
    const tono = TONOS.find(([v]) => v === historia.mascota.tono) ?? TONOS[0];
    const li = document.createElement("li");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "historia";
    boton.innerHTML = `<span class="miniatura${historia.paginas[0]?.imagen ? " esperando-imagen" : ""}" aria-hidden="true">${escenaDe(historia, 0)}</span>
      <span class="historia-texto"><span class="historia-titulo">${escapar(historia.titulo)}</span>
      <span class="historia-meta">${escapar(historia.mascota.nombre)} · ${tono[1]} · ${cuandoFue(historia.creado)}</span></span>`;
    boton.addEventListener("click", () => abrir(historia));
    const miniatura = boton.querySelector(".miniatura");
    miniatura.querySelector(".escena").setAttribute("preserveAspectRatio", "xMidYMid slice"); // Recorta en vez de dejar franjas.
    miniatura.historia = historia;
    if (historia.paginas[0]?.imagen) miniaturasVisibles.observe(miniatura);
    li.append(boton);
    return li;
  }));
}

function pintarCuenta() {
  const conSesion = dentro();
  $("entrar").hidden = conSesion;
  $("mi-cuenta").hidden = !conSesion;
  const historias = estado.cuenta?.historias ?? [];
  $("panel-cargando").hidden = true;
  $("panel-contenido").hidden = false;
  pintarMascotas(historias);
  pintarSaldo();
  pintarHistorias(historias);
  pintarUsara();
}

async function refrescar() {
  if (!dentro()) {
    estado.cuenta = null;
  } else {
    const respuesta = await api("/api/yo").catch(() => null);
    estado.cuenta = respuesta?.ok ? await respuesta.json() : null;
  }
  pintarCuenta();
}

/* ---------- Formulario de crear historia ---------- */

function opcion(clase, nombre, valor, contenido) {
  const label = document.createElement("label");
  label.className = clase;
  label.innerHTML = `<input type="radio" name="${nombre}" value="${escapar(valor)}">${contenido}`;
  return label;
}

function construirFormulario() {
  $("especies").replaceChildren(...ESPECIES.map(([valor, nombre], i) => {
    const tile = opcion("tile", "especie", valor, `${retratoHtml(valor)}${nombre}${TICK}`);
    tile.dataset.extra = String(i >= VISIBLES);
    return tile;
  }));
  $("personalidades").replaceChildren(...PERSONALIDADES.map(([valor, nombre]) => opcion("pastilla", "personalidad", valor, escapar(nombre))));
  $("tonos").replaceChildren(...TONOS.map(([valor, nombre, , icono]) => opcion("tile", "tono", valor, `${icono}${nombre}${TICK}`)));
  $("colores").replaceChildren(...COLORES.map(([valor, nombre]) => opcion("muestra", "color", valor, `<span class="punto" style="background:${valor}"></span>${nombre}${TICK}`)));
  $("collares").replaceChildren(...COLLARES.map(([valor, nombre]) => opcion("muestra", "collar", valor,
    `<span class="punto ${valor === "ninguno" ? "punto-ninguno" : "punto-collar"}" ${valor === "ninguno" ? "" : `style="border-color:${valor}"`}></span>${nombre}${TICK}`)));
}

function mostrarEspecies(todas) {
  const elegida = $("formulario").elements.especie.value;
  const extra = ESPECIES.findIndex(([v]) => v === elegida) >= VISIBLES;
  const abiertas = todas || extra;
  for (const tile of $("especies").children) tile.hidden = tile.dataset.extra === "true" && !abiertas;
  $("mas-especies").setAttribute("aria-expanded", String(abiertas));
  $("mas-especies").querySelector("span").textContent = abiertas ? "Ver menos animales" : `Más animales (${ESPECIES.length - VISIBLES})`;
  $("mas-especies").hidden = extra;
}

// Rellena el formulario con una mascota guardada, o lo deja en blanco con las primeras opciones.
function ponerMascota(mascota) {
  const elementos = $("formulario").elements;
  const primeras = { especie: ESPECIES[0][0], personalidad: PERSONALIDADES[0][0], tono: TONOS[0][0], color: COLORES[0][0], collar: COLLARES[0][0] };
  for (const campo of [...RASGOS, "tono"]) {
    const valor = mascota?.[campo] ?? primeras[campo] ?? "";
    const control = elementos[campo];
    control.value = valor;
    if (control instanceof RadioNodeList && control.value !== valor) control.value = primeras[campo];
  }
  for (const campo of ["nombre", "mania"]) marcarError(campo, false);
  mostrarEspecies(false);
  pintarResumen();
}

function pintarResumen() {
  const datos = Object.fromEntries(new FormData($("formulario")));
  const nombre = datos.nombre?.trim() || "Su mascota";
  const collar = datos.collar === "ninguno" ? "sin collar ni lazo" : `collar ${etiqueta(COLLARES, datos.collar).toLowerCase()}`;
  $("resumen").textContent = [
    nombre,
    `${etiqueta(ESPECIES, datos.especie).toLowerCase()} ${etiqueta(PERSONALIDADES, datos.personalidad).toLowerCase()}`,
    `${etiqueta(COLORES, datos.color).toLowerCase()}, ${collar}`,
    etiqueta(TONOS, datos.tono).toLowerCase(),
  ].join(" · ");
}

function pintarUsara() {
  const { plan, quedan } = estado.cuenta ?? {};
  $("usara").textContent = !plan
    ? "3 días gratis · luego 4,99 €/mes"
    : plan === "premium"
      ? "Usará su historia nueva de hoy"
      : quedan ? `Usará 1 de sus ${quedan} historias nuevas` : "Ya ha usado sus historias nuevas";
}

function marcarError(campo, hay) {
  $(campo).setAttribute("aria-invalid", String(hay));
  $(`${campo}-error`).hidden = !hay;
}

function abrirCrear(mascota) {
  cerrarVentanas();
  ponerMascota(mascota);
  pintarIdeas();
  $("error").hidden = true;
  mostrar("crear");
}

function volver() {
  cerrarVentanas();
  inicio();
}

/* ---------- Espera y creación ---------- */

// El récord del quiz viaja con la cuenta: se guarda en los datos del usuario de Supabase.
function opcionesQuiz() {
  const usuario = estado.sesion?.user;
  if (!usuario || !estado.cliente) return {};
  return {
    recordCuenta: usuario.user_metadata?.record_quiz ?? 0,
    guardar: (record) => {
      if (record <= (estado.sesion?.user?.user_metadata?.record_quiz ?? 0)) return;
      estado.cliente.auth.updateUser({ data: { record_quiz: record } }).catch(() => {});
    },
  };
}

function fase(nombre, porcentaje, texto) {
  $("progreso").textContent = texto;
  $("barra-progreso").setAttribute("aria-valuenow", String(porcentaje));
  $("barra-progreso").querySelector(".relleno").style.width = `${porcentaje}%`;
  $("etapa-escribir").className = nombre === "escribir" ? "actual" : "hecha";
  $("etapa-pintar").className = nombre === "pintar" ? "actual" : nombre === "lista" ? "hecha" : "";
}

const ESPERA_MAXIMA = 150000; // Si los fondos se atascan, la historia se abre igual y terminan de llegar dentro.

// La historia se abre cuando las 3 primeras páginas tienen su fondo; el resto se sigue pintando mientras se lee.
async function esperarFondos(historia) {
  const primeras = historia.paginas.slice(0, 3).flatMap((pagina, i) => (pagina.imagen ? [cargarFondo(historia.id, i)] : []));
  let listas = 0;
  const contar = () => fase("pintar", 40 + Math.round((55 * listas) / Math.max(primeras.length, 1)), `Pintando sus escenarios: ${listas} de ${primeras.length}…`);
  contar();
  const todas = Promise.all(primeras.map((fondo) => fondo.then(() => { listas++; contar(); })));
  await Promise.race([todas, esperar(ESPERA_MAXIMA)]);
}

async function crear(mascota) {
  estado.ultimaPeticion = mascota;
  estado.reintentar = () => crear(mascota);
  mostrar("cargando");
  $("progreso-caja").hidden = false;
  $("lista").hidden = true;
  $("fallo").hidden = true;
  fase("escribir", 15, `Escribiendo la historia de ${mascota.nombre}…`);
  empezarQuiz(opcionesQuiz());
  try {
    const respuesta = await api("/api/historia", { method: "POST", body: JSON.stringify(mascota) });
    const datos = await respuesta.json();
    if (respuesta.status === 402) {
      await refrescar();
      inicio();
      return abrirMuro();
    }
    if (!respuesta.ok) throw new Error(datos.error);
    guardarBorrador(null);
    await Promise.all([refrescar(), esperarFondos(datos)]);
    // No se abre sola: así nadie se queda a medias de una pregunta del quiz.
    fase("lista", 100, "¡Ya está!");
    $("progreso-caja").hidden = true;
    $("lista-titulo").textContent = `¡La historia de ${mascota.nombre} está lista!`;
    $("abrir-texto").textContent = "Abrir";
    $("abrir-lista").onclick = () => abrir(datos);
    $("lista").hidden = false;
    $("abrir-lista").focus();
  } catch (error) {
    $("progreso-caja").hidden = true;
    $("fallo-texto").textContent = `No hemos podido terminar la historia de ${mascota.nombre}. No se ha gastado ninguna de sus historias.`;
    $("fallo").hidden = false;
    console.error(error);
  }
}

function pedirHistoria(mascota) {
  if (!dentro()) {
    guardarBorrador(mascota);
    return pedirAcceso();
  }
  if (!estado.cuenta?.quedan) {
    guardarBorrador(mascota);
    return estado.cuenta?.plan ? abrirAgotadas() : abrirMuro();
  }
  crear(mascota);
}

// Tras entrar o pagar, retoma la historia que estaba pidiendo.
function continuar() {
  const borrador = leerBorrador();
  if (!borrador) return;
  ponerMascota(borrador);
  pedirHistoria(borrador);
}

// Stripe avisa al servidor por su cuenta: el plan puede tardar unos segundos en llegar.
async function esperarPlan() {
  for (let intento = 0; intento < 15 && !estado.cuenta?.plan; intento++) {
    await esperar(1000);
    await refrescar();
  }
}

/* ---------- Lectura y narración ---------- */

function pintarPagina() {
  const { actual, pagina } = estado;
  const datos = actual.paginas[pagina];
  const total = actual.paginas.length;
  $("pagina").className = "pagina-libro";
  $("pagina").innerHTML = escenaDe(actual, pagina);
  $("texto-pagina").textContent = datos.texto;
  $("texto-pagina").style.animation = "none";
  void $("texto-pagina").offsetWidth; // Reinicia la animación de entrada del texto.
  $("texto-pagina").style.animation = "";
  pintarFondo($("pagina"), actual, pagina);
  if (actual.paginas[pagina + 1]?.imagen) cargarFondo(actual.id, pagina + 1);
  $("contador").textContent = `${pagina + 1} de ${total}`;
  $("puntos").replaceChildren(...actual.paginas.map((_, i) => {
    const punto = document.createElement("span");
    punto.className = i === pagina ? "actual" : i < pagina ? "leida" : "";
    return punto;
  }));
  $("anterior").disabled = pagina === 0;
  $("siguiente").hidden = pagina === total - 1;
  $("fin").hidden = pagina !== total - 1;
  $("compartir-caja").hidden = pagina !== total - 1;
  $("compartida-nota").hidden = !actual.compartida;
}

function abrir(historia) {
  parar();
  estado.actual = historia;
  estado.pagina = 0;
  $("titulo-libro").textContent = historia.titulo;
  $("aviso-muestra").hidden = historia.modo !== "muestra";
  $("aviso-voz").hidden = true;
  pintarPagina();
  mostrar("libro");
}

function irA(pagina) {
  estado.pagina = pagina;
  pintarPagina();
}

// Si la página aún no está pintada, se espera con el quiz en vez de enseñarla a medias.
async function irAPagina(pagina, seguirLeyendo) {
  const { actual } = estado;
  if (!paginaLista(actual, pagina)) {
    await Promise.race([asegurarFondo(actual, pagina), esperar(1500)]); // Lo que tarda en descargarse no merece la espera.
  }
  if (estado.actual !== actual) return;
  if (paginaLista(actual, pagina)) {
    irA(pagina);
    if (seguirLeyendo) {
      estado.leyendo = true;
      leerPagina();
    }
    return;
  }
  mostrar("cargando");
  $("progreso-caja").hidden = false;
  $("lista").hidden = true;
  $("fallo").hidden = true;
  fase("pintar", 70, `Pintando la página ${pagina + 1}…`);
  empezarQuiz(opcionesQuiz());
  await Promise.race([asegurarFondo(actual, pagina), esperar(ESPERA_MAXIMA)]);
  if (estado.vista !== "cargando" || estado.actual !== actual) return;
  if (!paginaLista(actual, pagina)) {
    $("progreso-caja").hidden = true;
    $("fallo-texto").textContent = `No hemos podido pintar la página ${pagina + 1}: el servicio de dibujo está saturado. Inténtelo en un momento.`;
    estado.reintentar = () => irAPagina(pagina, seguirLeyendo);
    $("fallo").hidden = false;
    return;
  }
  fase("lista", 100, "¡Ya está!");
  $("progreso-caja").hidden = true;
  $("lista-titulo").textContent = `¡La página ${pagina + 1} está lista!`;
  $("abrir-texto").textContent = "Seguir leyendo";
  $("abrir-lista").onclick = () => {
    mostrar("libro");
    irA(pagina);
    if (seguirLeyendo) escuchar();
  };
  $("lista").hidden = false;
  $("abrir-lista").focus();
}

// Estados de la barra de audio: parado, cargando, sonando o en pausa.
function audioEn(como) {
  const sonando = como === "sonando" || como === "cargando";
  $("leer").classList.toggle("sonando", sonando);
  $("leer").setAttribute("aria-label", sonando ? "Pausar" : como === "pausa" ? "Continuar" : "Escuchar");
  $("estado-audio").textContent = { parado: "Escuchar", cargando: "Cargando la voz…", sonando: "Escuchando", pausa: "En pausa" }[como];
}

function parar() {
  estado.turno++;
  estado.leyendo = false;
  estado.audio?.pause();
  estado.audio = null;
  audioEn("parado");
}

// Pausar conserva el audio de la página, así "Continuar" sigue en el mismo segundo.
function pausar() {
  estado.turno++;
  estado.leyendo = false;
  estado.audio?.pause();
  audioEn("pausa");
}

// El audio llega en streaming: empieza a sonar en cuanto llegan los primeros trozos.
async function prepararAudio(historia, pagina, voz) {
  const respuesta = await api("/api/voz", { method: "POST", body: JSON.stringify({ historia, pagina, voz }) }).catch(() => null);
  if (!respuesta?.ok) return null;
  const audio = new Audio((await respuesta.json()).url);
  audio.preload = "auto";
  return audio;
}

let siguiente = null; // La página siguiente se prepara mientras suena la actual.
const PAUSA_ENTRE_PAGINAS = 1500; // Al acabar una página, 1,5 segundos antes de pasar a la siguiente.

async function leerPagina() {
  const { id, paginas } = estado.actual;
  const pagina = estado.pagina;
  const voz = $("voz").value;
  const clave = `${id}-${pagina}-${voz}`;
  audioEn("cargando");
  $("aviso-voz").hidden = true;
  const promesa = siguiente?.clave === clave ? siguiente.promesa : prepararAudio(id, pagina, voz);
  siguiente = null;
  const audio = await promesa;
  if (!estado.leyendo) return;
  if (!audio) {
    parar();
    $("aviso-voz").hidden = false;
    return;
  }
  estado.audio = audio;
  if (pagina < paginas.length - 1) siguiente = { clave: `${id}-${pagina + 1}-${voz}`, promesa: prepararAudio(id, pagina + 1, voz) };
  audio.onended = async () => {
    if (!estado.leyendo) return;
    if (estado.pagina < estado.actual.paginas.length - 1) {
      // Al acabar la voz se cuenta 1,5 segundos en la misma página y luego se pasa a la siguiente.
      const turno = ++estado.turno; // Si alguien pausa o cambia de página mientras tanto, esta espera ya no manda.
      const { actual } = estado;
      await esperar(PAUSA_ENTRE_PAGINAS);
      if (estado.turno === turno && estado.leyendo && estado.actual === actual && estado.pagina === pagina) irAPagina(pagina + 1, true);
    } else {
      parar();
    }
  };
  audio.onplaying = () => estado.leyendo && audioEn("sonando");
  await audio.play().catch(() => {
    parar();
    $("aviso-voz").hidden = false;
  });
}

function escuchar() {
  estado.turno++;
  estado.leyendo = true;
  if (estado.audio) {
    audioEn("sonando");
    estado.audio.play();
  } else {
    leerPagina();
  }
}

/* ---------- Compartir en Stories ---------- */

const enlacePublico = (historia) => `${location.origin}/h/${historia.compartida}`;

function cargarImagen(src) {
  return new Promise((listo) => {
    const img = new Image();
    img.onload = () => listo(img);
    img.onerror = () => listo(null);
    img.src = src;
  });
}

// Corta el texto en líneas que quepan en el ancho; si sobran, la última acaba en «…».
function lineas(ctx, texto, ancho, maximo) {
  const resultado = [];
  let linea = "";
  for (const palabra of texto.split(/\s+/)) {
    const prueba = linea ? `${linea} ${palabra}` : palabra;
    if (ctx.measureText(prueba).width <= ancho || !linea) {
      linea = prueba;
    } else {
      resultado.push(linea);
      linea = palabra;
    }
  }
  if (linea) resultado.push(linea);
  if (resultado.length > maximo) {
    resultado.length = maximo;
    resultado[maximo - 1] = resultado[maximo - 1].replace(/\s*\S*$/, "…");
  }
  return resultado;
}

function rectRedondo(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function dibujarLogo(ctx, x, y, escala) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(escala, escala);
  ctx.fillStyle = "#FF8A2B";
  ctx.strokeStyle = "#2B1840";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(22, 22, 19.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#2B1840";
  for (const [cx, cy, rx, ry] of [[22, 27.5, 7.5, 6], [12.5, 19, 3, 3.9], [18, 13, 3, 3.9], [26, 13, 3, 3.9], [31.5, 19, 3, 3.9]]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// Imagen vertical de 1080 × 1920 con la portada, el título y mascotadas.com bien visible.
async function crearImagenStory(historia) {
  const TINTA = "#2B1840";
  await Promise.all(['800 80px "Baloo 2"', '800 40px "Nunito"', '700 36px "Nunito"'].map((fuente) => document.fonts.load(fuente)));
  const lienzo = document.createElement("canvas");
  lienzo.width = 1080;
  lienzo.height = 1920;
  const ctx = lienzo.getContext("2d");

  ctx.fillStyle = "#EAF6FF";
  ctx.fillRect(0, 0, 1080, 1920);
  ctx.fillStyle = "#B69CFF";
  for (const [x, y, r] of [[90, 120, 26], [990, 260, 18], [70, 1500, 20], [1010, 1380, 28], [160, 1840, 14], [930, 1820, 22]]) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Logo y marca, centrados arriba.
  ctx.font = '800 76px "Baloo 2"';
  const anchoMarca = 106 + 24 + ctx.measureText("Mascotadas").width;
  const mx = (1080 - anchoMarca) / 2;
  dibujarLogo(ctx, mx, 143, 2.4);
  ctx.fillStyle = TINTA;
  ctx.textBaseline = "middle";
  ctx.fillText("Mascotadas", mx + 130, 200);

  // Tarjeta con la portada de la historia.
  const titulo = lineas(ctx, historia.titulo, 860, 3);
  const tx = 70, ty = 330, tw = 940, altoImagen = 528;
  const alto = altoImagen + 110 + titulo.length * 84 + 80;
  ctx.fillStyle = TINTA;
  rectRedondo(ctx, tx + 18, ty + 22, tw, alto, 52);
  ctx.fill();
  ctx.fillStyle = "#fff";
  rectRedondo(ctx, tx, ty, tw, alto, 52);
  ctx.fill();
  ctx.save();
  rectRedondo(ctx, tx, ty, tw, alto, 52);
  ctx.clip();
  const url = historia.paginas[0]?.imagen ? await cargarFondo(historia.id, 0) : null;
  const img = url ? await cargarImagen(url) : null;
  if (img) {
    const escala = Math.max(tw / img.width, altoImagen / img.height);
    const w = img.width * escala, h = img.height * escala;
    ctx.drawImage(img, tx + (tw - w) / 2, ty + (altoImagen - h) / 2, w, h);
  } else {
    ctx.fillStyle = "#B69CFF";
    ctx.fillRect(tx, ty, tw, altoImagen);
  }
  ctx.restore();
  ctx.strokeStyle = TINTA;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(tx, ty + altoImagen);
  ctx.lineTo(tx + tw, ty + altoImagen);
  ctx.stroke();
  rectRedondo(ctx, tx, ty, tw, alto, 52);
  ctx.stroke();

  ctx.fillStyle = TINTA;
  ctx.textBaseline = "alphabetic";
  titulo.forEach((linea, i) => ctx.fillText(linea, tx + 40, ty + altoImagen + 110 + i * 84));
  ctx.fillStyle = "#4A3A5E";
  ctx.font = '800 40px "Nunito"';
  ctx.fillText(`Protagonizada por ${historia.mascota.nombre}`, tx + 40, ty + altoImagen + 110 + titulo.length * 84 + 14);

  // Llamada a leerla entera.
  const py = Math.max(ty + alto + 140, 1540);
  ctx.font = '800 60px "Baloo 2"';
  const texto = "Léela en mascotadas.com";
  const anchoPastilla = ctx.measureText(texto).width + 120;
  const px = (1080 - anchoPastilla) / 2;
  ctx.fillStyle = TINTA;
  rectRedondo(ctx, px, py + 12, anchoPastilla, 130, 65);
  ctx.fill();
  ctx.fillStyle = "#FF8A2B";
  rectRedondo(ctx, px, py, anchoPastilla, 130, 65);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.stroke();
  ctx.fillStyle = TINTA;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(texto, 540, py + 68);
  ctx.font = '700 36px "Nunito"';
  ctx.fillStyle = "#4A3A5E";
  ctx.fillText("Toca el enlace para leer la historia completa", 540, py + 210);

  return new Promise((listo) => lienzo.toBlob(listo, "image/jpeg", 0.9));
}

let story = null; // La imagen preparada: { archivo, url }.

function avisoCompartir(texto) {
  $("compartir-aviso").textContent = texto;
  $("compartir-aviso").hidden = !texto;
}

async function copiarEnlace() {
  try {
    await navigator.clipboard.writeText(enlacePublico(estado.actual));
    return true;
  } catch {
    return false;
  }
}

async function prepararCompartir() {
  const historia = estado.actual;
  const boton = $("compartir");
  boton.disabled = true;
  boton.querySelector("span").textContent = "Preparando…";
  try {
    if (!historia.compartida) {
      const respuesta = await api("/api/compartir", { method: "POST", body: JSON.stringify({ historia: historia.id }) });
      if (!respuesta.ok) throw new Error("No se ha podido crear el enlace");
      historia.compartida = (await respuesta.json()).enlace;
    }
    const imagen = await crearImagenStory(historia);
    if (story) URL.revokeObjectURL(story.url);
    story = { archivo: new File([imagen], "mascotadas-historia.jpg", { type: "image/jpeg" }), url: URL.createObjectURL(imagen) };
    $("vista-story").src = story.url;
    $("descargar-story").href = story.url;
    $("compartir-ya").hidden = !navigator.canShare?.({ files: [story.archivo] });
    avisoCompartir("");
    $("compartida-nota").hidden = false;
    $("ventana-compartir").showModal();
  } catch (error) {
    console.error(error);
    alert("No hemos podido preparar la imagen. Inténtelo otra vez.");
  } finally {
    boton.disabled = false;
    boton.querySelector("span").textContent = "Compartir en Stories";
  }
}

async function dejarDeCompartir() {
  const historia = estado.actual;
  const respuesta = await api("/api/compartir", { method: "DELETE", body: JSON.stringify({ historia: historia.id }) }).catch(() => null);
  if (!respuesta?.ok) return alert("No hemos podido dejar de compartirla. Inténtelo otra vez.");
  historia.compartida = null;
  $("compartida-nota").hidden = true;
  if ($("ventana-compartir").open) $("ventana-compartir").close();
}

/* ---------- Ventanas ---------- */

function pedirAcceso() {
  $("acceso-formulario").hidden = false;
  $("acceso-enviado").hidden = true;
  $("acceso-aviso").hidden = true;
  $("acceso").showModal();
  prepararGoogle();
}

/* ---------- Continuar con Google ---------- */

// Botón oficial de Google cargado desde nuestra web: así Google muestra «Mascotadas» y no la dirección de Supabase.
// El script solo se descarga al abrir la ventana de entrar, nunca al visitar la web.
let google = null;

function cargarScriptGoogle() {
  google ??= new Promise((listo, falla) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => listo(window.google);
    script.onerror = () => {
      google = null;
      falla(new Error("No se ha podido cargar Google"));
    };
    document.head.append(script);
  });
  return google;
}

async function huella(texto) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texto));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function prepararGoogle() {
  if (!estado.config?.googleCliente || estado.config.local) return;
  try {
    const gis = await cargarScriptGoogle();
    // El nonce une la respuesta de Google con esta visita: Supabase comprueba que coincide.
    const nonce = crypto.randomUUID();
    gis.accounts.id.initialize({
      client_id: estado.config.googleCliente,
      nonce: await huella(nonce),
      use_fedcm_for_button: true,
      callback: async ({ credential }) => {
        const { error } = await estado.cliente.auth.signInWithIdToken({ provider: "google", token: credential, nonce });
        if (error) {
          $("acceso-aviso").textContent = "No hemos podido entrar con Google. Inténtelo otra vez o entre con su email.";
          $("acceso-aviso").hidden = false;
        }
        // Si va bien, onAuthStateChange cierra la ventana y retoma lo que estaba haciendo.
      },
    });
    const caja = $("boton-google");
    caja.replaceChildren();
    caja.hidden = false;
    $("separador-acceso").hidden = false;
    gis.accounts.id.renderButton(caja, {
      type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "pill",
      logo_alignment: "center", locale: "es", width: Math.min(caja.clientWidth || 360, 400),
    });
  } catch (error) {
    console.error(error);
    $("boton-google").hidden = true;
    $("separador-acceso").hidden = true;
  }
}

const ESPERA_REENVIO = 60; // Segundos antes de poder pedir otro código.
let cuentaAtras = null;

function bloquearReenvio() {
  let quedan = ESPERA_REENVIO;
  const boton = $("reenviar-codigo");
  clearInterval(cuentaAtras);
  const pintar = () => {
    boton.disabled = quedan > 0;
    boton.textContent = quedan > 0 ? `Reenviar el código en ${quedan} s` : "Reenviar el código";
  };
  pintar();
  cuentaAtras = setInterval(() => {
    quedan--;
    pintar();
    if (quedan <= 0) clearInterval(cuentaAtras);
  }, 1000);
}

// El correo trae un código que se escribe aquí mismo: nadie sale de la web ni abre otro navegador.
async function enviarCodigo(email) {
  const { error } = await estado.cliente.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    return error.status === 429
      ? "Hemos enviado varios códigos seguidos. Espere unos minutos y vuelva a intentarlo."
      : "No hemos podido enviarlo. Inténtelo otra vez.";
  }
  return null;
}

function pintarPago() {
  const plan = $("muro").querySelector("input[name=plan]:checked")?.value;
  const mejora = Boolean(estado.cuenta?.plan);
  const dentroDe = (dias) => fecha(new Date(Date.now() + dias * 86400000));
  $("muro").querySelector(".resumen-pago").hidden = mejora;
  if (plan === "premium") {
    $("hoy-paga").textContent = euros(19.99);
    $("cobro-cuando").textContent = `Siguiente cobro, ${dentroDe(30)}`;
    $("cobro-cuanto").textContent = euros(19.99);
    $("pagar").textContent = mejora ? "Pasar a Premium" : "Elegir Premium";
  } else {
    $("hoy-paga").textContent = euros(0);
    $("cobro-cuando").textContent = `Primer cobro, ${dentroDe(3)}`;
    $("cobro-cuanto").textContent = euros(4.99);
    $("pagar").textContent = "Probar 3 días gratis";
  }
}

// Sin plan se elige entre los dos; con plan, solo queda pasar a Premium (se cobra hoy, descontando lo que quede).
function abrirMuro() {
  cerrarVentanas();
  const mejora = Boolean(estado.cuenta?.plan);
  $("muro-titulo").textContent = mejora ? "Pasar a Premium" : "Elija su plan";
  $("opcion-mensual").hidden = mejora;
  $("muro").querySelector(`input[value=${mejora ? "premium" : "prueba"}]`).checked = true;
  $("opcion-premium").querySelector(".texto-suave").textContent = mejora
    ? "1 historia al día · se cobra hoy, descontando lo que quede de su plan"
    : "1 historia al día · se cobra hoy";
  $("muro-error").hidden = true;
  pintarPago();
  $("muro").showModal();
}

function abrirAgotadas() {
  cerrarVentanas();
  const { plan } = estado.cuenta;
  const textos = {
    prueba: ["Ya ha usado sus 3 historias de prueba", "Cuando acabe la prueba tendrá 8 nuevas cada mes. O pase a Premium y tenga una cada día."],
    basico: ["Ya ha usado sus 8 historias de este mes", "Tendrá 8 nuevas cuando empiece su próximo mes. Mientras, puede releer todas las que ya tiene."],
    premium: ["Hoy ya ha estrenado su historia", "Mañana tendrá otra nueva. Mientras, puede releer todas las que ya tiene."],
  }[plan];
  $("agotadas-titulo").textContent = textos[0];
  $("agotadas-texto").textContent = textos[1];
  $("a-premium").hidden = plan === "premium";
  $("agotadas").showModal();
}

function abrirCuenta() {
  const { plan, quedan, email } = estado.cuenta ?? {};
  $("cuenta-plan").textContent = plan ? `${NOMBRES_PLAN[plan]}${plan === "premium" ? " · 19,99 €/mes" : plan === "basico" ? " · 4,99 €/mes" : ""}` : "Sin plan";
  $("cuenta-historias").textContent = !plan ? "—" : plan === "premium" ? (quedan ? "Hoy le queda 1" : "Hoy ya la ha usado") : `Le quedan ${quedan} de ${LIMITES[plan]}`;
  $("cuenta-email").textContent = email ?? "Modo local";
  $("cuenta-premium").hidden = !plan || plan === "premium";
  $("cuenta-elegir").hidden = Boolean(plan);
  $("gestionar").hidden = !plan || estado.config.local;
  $("salir").hidden = estado.config.local;
  $("cuenta-error").hidden = true;
  $("cuenta").showModal();
}

/* ---------- Eventos ---------- */

construirFormulario();
ponerMascota(null);
pintarIdeas();

document.addEventListener("click", (evento) => {
  const objetivo = evento.target.closest("[data-ir], [data-volver], [data-cerrar], [data-abrir]");
  if (!objetivo) return;
  if (objetivo.dataset.ir === "crear") abrirCrear(null);
  else if ("volver" in objetivo.dataset) volver();
  else if ("cerrar" in objetivo.dataset) objetivo.closest("dialog").close();
  else if (objetivo.dataset.abrir === "cuenta") abrirCuenta();
});

$("marca").addEventListener("click", (evento) => {
  evento.preventDefault();
  cerrarVentanas();
  inicio();
});

$("nueva-historia").addEventListener("click", () => abrirCrear(estado.mascota));
$("mas-especies").addEventListener("click", () => mostrarEspecies($("mas-especies").getAttribute("aria-expanded") !== "true"));
$("formulario").addEventListener("input", (evento) => {
  if (evento.target.name === "nombre" || evento.target.name === "mania") marcarError(evento.target.name, false);
  pintarResumen();
});
$("formulario").addEventListener("change", pintarResumen);
$("ideas").addEventListener("click", (evento) => {
  const idea = evento.target.closest(".idea");
  if (!idea) return;
  $("mania").value = idea.textContent;
  marcarError("mania", false);
  pintarResumen();
});
$("otras-ideas").addEventListener("click", pintarIdeas);

$("formulario").addEventListener("submit", (evento) => {
  evento.preventDefault();
  $("error").hidden = true;
  const datos = Object.fromEntries(new FormData(evento.target));
  datos.nombre = datos.nombre.trim();
  datos.mania = datos.mania.trim();
  marcarError("nombre", !datos.nombre);
  marcarError("mania", !datos.mania);
  if (!datos.nombre || !datos.mania) return $(datos.nombre ? "mania" : "nombre").focus();
  pedirHistoria(datos);
});

$("reintentar").addEventListener("click", () => estado.reintentar?.());

$("formulario-acceso").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const boton = evento.target.querySelector("button");
  if (boton.disabled) return;
  const email = $("email").value.trim();
  if (!$("email").checkValidity() || !email) {
    $("acceso-aviso").textContent = "Escriba un email válido.";
    $("acceso-aviso").hidden = false;
    return;
  }
  boton.disabled = true;
  const fallo = await enviarCodigo(email);
  boton.disabled = false;
  if (fallo) {
    $("acceso-aviso").textContent = fallo;
    $("acceso-aviso").hidden = false;
    return;
  }
  $("acceso-email").textContent = email;
  $("acceso-formulario").hidden = true;
  $("acceso-enviado").hidden = false;
  $("codigo").value = "";
  $("codigo-aviso").hidden = true;
  bloquearReenvio();
  $("codigo").focus();
});
$("formulario-codigo").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const codigo = $("codigo").value.replace(/\D/g, "");
  const boton = evento.target.querySelector("button");
  if (codigo.length < 6) {
    $("codigo-aviso").textContent = "Escriba las cifras del código que le hemos enviado.";
    $("codigo-aviso").hidden = false;
    return;
  }
  boton.disabled = true;
  const { error } = await estado.cliente.auth.verifyOtp({ email: $("acceso-email").textContent, token: codigo, type: "email" });
  boton.disabled = false;
  if (error) {
    $("codigo-aviso").textContent = "Ese código no es correcto o ha caducado. Revíselo o pida otro.";
    $("codigo-aviso").hidden = false;
    return;
  }
  // Al verificarse, la sesión avisa por onAuthStateChange y desde ahí se retoma lo que estaba haciendo.
});
$("codigo").addEventListener("input", () => {
  $("codigo-aviso").hidden = true;
  const cifras = $("codigo").value.replace(/\D/g, "");
  if ($("codigo").value !== cifras) $("codigo").value = cifras;
});
$("reenviar-codigo").addEventListener("click", async () => {
  const fallo = await enviarCodigo($("acceso-email").textContent);
  $("codigo-aviso").textContent = fallo ?? "Le hemos enviado un código nuevo.";
  $("codigo-aviso").hidden = false;
  if (!fallo) bloquearReenvio();
});
$("otro-email").addEventListener("click", () => {
  clearInterval(cuentaAtras);
  $("acceso-enviado").hidden = true;
  $("acceso-formulario").hidden = false;
  $("email").select();
});


$("muro").addEventListener("change", (evento) => {
  if (evento.target.name === "plan") pintarPago();
  if (evento.target.id === "empezar-ya") $("muro-error").hidden = true;
});
$("pagar").addEventListener("click", async () => {
  if (!$("empezar-ya").checked) {
    $("muro-error").textContent = "Marque la casilla para continuar.";
    $("muro-error").hidden = false;
    return;
  }
  const plan = $("muro").querySelector("input[name=plan]:checked").value;
  $("pagar").disabled = true;
  const respuesta = await api("/api/pago", { method: "POST", body: JSON.stringify({ plan, empezarYa: true }) }).catch(() => null);
  $("pagar").disabled = false;
  if (!respuesta?.ok) {
    $("muro-error").textContent = "No hemos podido abrir el pago. Inténtelo otra vez.";
    $("muro-error").hidden = false;
    return;
  }
  location.href = (await respuesta.json()).url;
});
$("a-premium").addEventListener("click", abrirMuro);

$("compartir").addEventListener("click", prepararCompartir);
// El menú de compartir del móvil necesita un toque reciente: por eso va en su propio botón, ya con la imagen hecha.
$("compartir-ya").addEventListener("click", async () => {
  const copiado = copiarEnlace();
  try {
    await navigator.share({ files: [story.archivo] });
    avisoCompartir((await copiado) ? "Enlace copiado: en Instagram, toque el sticker Enlace y péguelo." : "Recuerde añadir el enlace con el sticker Enlace.");
  } catch (error) {
    if (error.name !== "AbortError") avisoCompartir("No se ha podido abrir el menú de compartir. Descargue la imagen.");
  }
});
$("descargar-story").addEventListener("click", async () => {
  if (await copiarEnlace()) avisoCompartir("Imagen descargada y enlace copiado.");
});
$("copiar-enlace").addEventListener("click", async () => {
  avisoCompartir((await copiarEnlace()) ? "Enlace copiado." : enlacePublico(estado.actual));
});
for (const boton of document.querySelectorAll("[data-dejar-compartir]")) boton.addEventListener("click", dejarDeCompartir);

$("entrar").addEventListener("click", pedirAcceso);
$("mi-cuenta").addEventListener("click", abrirCuenta);
$("cuenta-premium").addEventListener("click", abrirMuro);
$("cuenta-elegir").addEventListener("click", abrirMuro);
$("salir").addEventListener("click", async () => {
  await estado.cliente.auth.signOut();
  location.href = "/";
});
$("gestionar").addEventListener("click", async () => {
  const respuesta = await api("/api/portal", { method: "POST" }).catch(() => null);
  if (respuesta?.ok) return void (location.href = (await respuesta.json()).url);
  $("cuenta-error").textContent = "No hemos podido abrir la gestión del pago. Inténtelo otra vez.";
  $("cuenta-error").hidden = false;
});
$("borrar").addEventListener("click", () => {
  const historias = estado.cuenta?.historias ?? [];
  const mascotas = misMascotas(historias).length;
  $("borrar-texto").innerHTML = `Se borrarán ${mascotas === 1 ? "su mascota" : `sus ${mascotas} mascotas`}, ${historias.length === 1 ? "su historia" : `sus ${historias.length} historias`} y su email, y se cancelará la suscripción. <strong>No se puede deshacer.</strong>`;
  $("confirmacion").value = "";
  $("borrar-error").hidden = true;
  $("cuenta").close();
  $("confirmar-borrado").showModal();
});
$("formulario-borrar").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  if ($("confirmacion").value.trim().toUpperCase() !== "BORRAR") {
    $("borrar-error").textContent = "Escriba BORRAR para confirmar.";
    $("borrar-error").hidden = false;
    return;
  }
  const respuesta = await api("/api/cuenta", { method: "DELETE" }).catch(() => null);
  if (!respuesta?.ok) {
    $("borrar-error").textContent = "No hemos podido borrarla. Escríbanos y lo hacemos nosotros.";
    $("borrar-error").hidden = false;
    return;
  }
  await estado.cliente?.auth.signOut();
  location.href = "/";
});

// Ejemplo de la portada: se escucha sin cuenta.
const ejemplo = new Audio("img/ejemplo.mp3");
ejemplo.preload = "none";
const pintarEjemplo = () => {
  const sonando = !ejemplo.paused;
  $("ejemplo-escuchar").querySelector("use").setAttribute("href", sonando ? "#i-pausa" : "#i-play");
  $("ejemplo-escuchar").querySelector("span").textContent = sonando ? "Pausar" : "Escuchar";
};
$("ejemplo-escuchar").addEventListener("click", () => (ejemplo.paused ? ejemplo.play() : ejemplo.pause()));
for (const evento of ["play", "pause", "ended"]) ejemplo.addEventListener(evento, pintarEjemplo);

$("anterior").addEventListener("click", () => { parar(); irAPagina(estado.pagina - 1, false); });
$("siguiente").addEventListener("click", () => { parar(); irAPagina(estado.pagina + 1, false); });

try {
  const guardada = localStorage.getItem(VOZ);
  if ([...$("voz").options].some((o) => o.value === guardada)) $("voz").value = guardada;
} catch {
  // Sin almacenamiento se usa la voz por defecto.
}
// Al cambiar de voz, la página vuelve a empezar con la nueva si se estaba escuchando.
$("voz").addEventListener("change", () => {
  try {
    localStorage.setItem(VOZ, $("voz").value);
  } catch {}
  const seguia = estado.leyendo;
  parar();
  if (!seguia) return;
  estado.leyendo = true;
  leerPagina();
});

// Vuelve a narrar la página actual desde su primer segundo.
$("reiniciar").addEventListener("click", () => {
  const cargando = estado.leyendo && !estado.audio; // Ya se está pidiendo el audio: empezará desde el principio igual.
  estado.leyendo = true;
  if (cargando) return;
  const audio = estado.audio;
  if (audio?.buffered.length && audio.buffered.start(0) === 0) {
    audio.currentTime = 0;
    audioEn("sonando");
    return void audio.play();
  }
  // Sin el principio en memoria se vuelve a pedir; si ya terminó de generarse, sale del almacén.
  estado.audio?.pause();
  estado.audio = null;
  leerPagina();
});
$("leer").addEventListener("click", () => (estado.leyendo ? pausar() : escuchar()));
$("reintentar-voz").addEventListener("click", () => {
  $("aviso-voz").hidden = true;
  escuchar();
});

/* ---------- Arranque ---------- */

async function iniciar() {
  // Si se vuelve de un enlace de acceso, la dirección trae la sesión: hay que saberlo antes de que Supabase la limpie.
  const vuelveDeEntrar = /access_token=|[?&]code=/.test(location.href);
  estado.config = await (await fetch("/api/estado")).json();
  $("narracion").hidden = !estado.config.voz;


  if (!estado.config.local) {
    estado.cliente = window.supabase.createClient(estado.config.supabaseUrl, estado.config.supabaseAnon);
    estado.sesion = (await estado.cliente.auth.getSession()).data.session;
    estado.cliente.auth.onAuthStateChange(async (evento, sesion) => {
      const acabaDeEntrar = evento === "SIGNED_IN" && !estado.sesion;
      estado.sesion = sesion;
      if (!acabaDeEntrar) return;
      cerrarVentanas();
      mostrar("panel");
      await refrescar();
      continuar();
    });
  }

  if (dentro()) mostrar("panel");
  await refrescar();

  const pago = new URLSearchParams(location.search).get("pago");
  if (pago) history.replaceState(null, "", "/");
  if (pago === "ok") {
    await esperarPlan();
    continuar();
  } else if (dentro()) {
    const borrador = leerBorrador();
    if (borrador && (estado.cuenta?.quedan || vuelveDeEntrar)) continuar();
  }
}

iniciar();
