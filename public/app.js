import { ilustrar, ponerFondo } from "./ilustracion.js";
import { empezarQuiz } from "./quiz.js";

const $ = (id) => document.getElementById(id);
const BORRADOR = "mascotadas.borrador";

const EJEMPLO = {
  lugar: "ciudad",
  momento: "atardecer",
  objetos: ["tesoro"],
  texto: "A las 8:03, en cuanto se cerró la puerta, Toby abrió un ojo. Oficialmente, dormía. En realidad, llevaba meses planeando el mayor robo de calcetines de la historia del barrio. Y hoy, por fin, conseguiría el par de rayas del armario de arriba.",
};

const fondos = new Map(); // Cada fondo se descarga una vez por visita.
const esperar = (ms) => new Promise((listo) => setTimeout(listo, ms));

// Un fondo recién pedido puede tardar unos minutos en pintarse: mientras no exista, se vuelve a preguntar.
function cargarFondo(historia, pagina) {
  const clave = `${historia}-${pagina}`;
  if (!fondos.has(clave)) {
    fondos.set(clave, (async () => {
      for (let intento = 0; intento < 72; intento++) {
        const r = await api(`/api/fondo?historia=${historia}&pagina=${pagina}`).catch(() => null);
        if (r?.ok) return URL.createObjectURL(await r.blob());
        if (r && r.status !== 404) break;
        await esperar(5000);
      }
      fondos.delete(clave);
      return null;
    })());
  }
  return fondos.get(clave);
}

async function pintarFondo(contenedor, historia, pagina) {
  if (!historia.paginas[pagina]?.imagen) return;
  const escena = contenedor.querySelector(".escena");
  const url = await cargarFondo(historia.id, pagina);
  if (url && escena.isConnected) ponerFondo(escena, url, historia.paginas[pagina].imagen === "escena"); // Si ya se ha pasado de página, no se toca la nueva.
}

const estado = { config: null, cliente: null, sesion: null, cuenta: null, actual: null, pagina: 0, leyendo: false, audio: null };

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

const dentro = () => estado.config.local || Boolean(estado.sesion);

function mostrar(vista) {
  for (const id of ["inicio", "cargando", "libro"]) $(id).hidden = id !== vista;
  window.scrollTo(0, 0);
}

function fallo(mensaje) {
  mostrar("inicio");
  $("error").textContent = mensaje;
  $("error").hidden = false;
  $("crear").scrollIntoView();
}

function pintarCuenta() {
  const { cuenta } = estado;
  const conSesion = dentro();
  $("entrar").hidden = conSesion;
  $("salir").hidden = !conSesion || estado.config.local;
  $("gestionar").hidden = !cuenta?.plan || estado.config.local;
  $("borrar").hidden = !conSesion;

  const historias = cuenta?.historias ?? [];
  $("biblioteca").hidden = historias.length === 0;
  pintarMascotas(historias);
  $("saldo").textContent = !cuenta?.plan
    ? ""
    : cuenta.plan === "premium"
      ? cuenta.quedan ? "Hoy le queda 1 historia nueva." : "Hoy ya ha estrenado su historia."
      : `Le quedan ${cuenta.quedan} historias nuevas.`;
  $("lista").replaceChildren(...historias.map((historia) => {
    const li = document.createElement("li");
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = historia.titulo;
    boton.addEventListener("click", () => abrir(historia));
    li.append(boton);
    return li;
  }));
}

const RASGOS = ["nombre", "especie", "personalidad", "mania", "color", "collar"];

// Las mascotas guardadas salen de sus historias: la más reciente de cada nombre y especie.
function misMascotas(historias) {
  const vistas = new Map();
  for (const { mascota } of historias) {
    const clave = `${mascota.nombre.toLowerCase()}|${mascota.especie}`;
    if (!vistas.has(clave)) vistas.set(clave, mascota);
  }
  return [...vistas.values()];
}

function nombreEspecie(especie) {
  const opcion = $("formulario").elements.especie.querySelector(`option[value="${especie}"]`);
  return opcion ? opcion.textContent.replace(/^(Un|Una) /, "") : especie;
}

function elegirMascota(mascota, chip) {
  const formulario = $("formulario");
  for (const campo of RASGOS) {
    const valor = mascota?.[campo] ?? formulario.elements[campo].querySelector?.("option")?.value ?? "";
    formulario.elements[campo].value = valor;
  }
  for (const otro of $("lista-mascotas").children) otro.setAttribute("aria-pressed", String(otro === chip));
}

function pintarMascotas(historias) {
  const mascotas = misMascotas(historias);
  $("mis-mascotas").hidden = mascotas.length === 0;
  const nueva = document.createElement("button");
  nueva.type = "button";
  nueva.textContent = "+ Nueva";
  nueva.addEventListener("click", () => elegirMascota(null, nueva));
  $("lista-mascotas").replaceChildren(...mascotas.map((mascota) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.setAttribute("aria-pressed", "false");
    chip.textContent = `${mascota.nombre} · ${nombreEspecie(mascota.especie)}`;
    chip.addEventListener("click", () => elegirMascota(mascota, chip));
    return chip;
  }), nueva);
}

async function refrescar() {
  if (!dentro()) {
    estado.cuenta = null;
  } else {
    const respuesta = await api("/api/yo");
    estado.cuenta = respuesta.ok ? await respuesta.json() : null;
  }
  pintarCuenta();
}

function pintarPagina() {
  const { actual, pagina } = estado;
  const datos = actual.paginas[pagina];
  const texto = document.createElement("p");
  texto.textContent = datos.texto;
  $("pagina").innerHTML = ilustrar(datos, actual.mascota);
  $("pagina").append(texto);
  pintarFondo($("pagina"), actual, pagina);
  if (actual.paginas[pagina + 1]?.imagen) cargarFondo(actual.id, pagina + 1);
  $("contador").textContent = `${pagina + 1} de ${actual.paginas.length}`;
  $("anterior").disabled = pagina === 0;
  $("siguiente").disabled = pagina === actual.paginas.length - 1;
}

function abrir(historia) {
  parar();
  estado.actual = historia;
  estado.pagina = 0;
  $("titulo-libro").textContent = historia.titulo;
  $("aviso-muestra").hidden = historia.modo !== "muestra";
  pintarPagina();
  mostrar("libro");
}

function irA(pagina) {
  estado.pagina = pagina;
  pintarPagina();
}

function parar() {
  estado.leyendo = false;
  estado.audio?.pause();
  estado.audio = null;
  $("leer").textContent = "▶ Escuchar";
}

// Pausar conserva el audio de la página, así "Continuar" sigue en el mismo segundo.
function pausar() {
  estado.leyendo = false;
  estado.audio?.pause();
  $("leer").textContent = "▶ Continuar";
}

async function leerPagina() {
  const respuesta = await api("/api/voz", {
    method: "POST",
    body: JSON.stringify({ historia: estado.actual.id, pagina: estado.pagina, voz: $("voz").value }),
  });
  if (!estado.leyendo) return;
  if (!respuesta.ok) {
    parar();
    $("leer").textContent = "No se ha podido leer. Reintentar";
    return;
  }
  const audio = new Audio(URL.createObjectURL(await respuesta.blob()));
  if (!estado.leyendo) return;
  estado.audio = audio;
  audio.onended = () => {
    if (!estado.leyendo) return;
    if (estado.pagina < estado.actual.paginas.length - 1) {
      irA(estado.pagina + 1);
      leerPagina();
    } else {
      parar();
    }
  };
  await audio.play();
}

function abrirMuro() {
  const plan = estado.cuenta?.plan ?? null;
  const premium = plan === "premium";
  $("muro-titulo").textContent = plan ? "Ya ha usado sus historias" : "Elige su plan";
  $("muro-texto").textContent = premium
    ? "Mañana tendrá otra historia nueva. Hoy puede volver a escuchar las que ya tiene."
    : plan
      ? "Con Premium tendría 1 historia nueva cada día. El cambio de plan se cobra hoy."
      : "Historias ilustradas y narradas. Volver a escucharlas no cuenta como historia nueva.";
  $("plan-basico").hidden = Boolean(plan);
  $("plan-premium").hidden = premium;
  $("bloque-aceptar").hidden = premium;
  $("muro-error").hidden = true;
  $("muro").showModal();
}

function pedirAcceso() {
  $("acceso-aviso").hidden = true;
  $("acceso").showModal();
}

const ESPERA_MAXIMA = 150000; // Si los fondos se atascan, la historia se abre igual y terminan de llegar dentro.

// La historia se abre cuando las 3 primeras páginas tienen su fondo; el resto se sigue pintando mientras se lee.
async function esperarFondos(historia) {
  const primeras = historia.paginas.slice(0, 3).flatMap((pagina, i) => (pagina.imagen ? [cargarFondo(historia.id, i)] : []));
  let listas = 0;
  const contar = () => ($("progreso").textContent = `Pintando sus escenarios: ${listas} de ${primeras.length}…`);
  contar();
  const todas = Promise.all(primeras.map((fondo) => fondo.then(() => { listas++; contar(); })));
  await Promise.race([todas, esperar(ESPERA_MAXIMA)]);
}

async function crear(mascota) {
  mostrar("cargando");
  $("progreso").textContent = `Escribiendo la historia de ${mascota.nombre}…`;
  $("abrir-lista").hidden = true;
  empezarQuiz();
  try {
    const respuesta = await api("/api/historia", { method: "POST", body: JSON.stringify(mascota) });
    const datos = await respuesta.json();
    if (respuesta.status === 402) {
      mostrar("inicio");
      return abrirMuro();
    }
    if (!respuesta.ok) throw new Error(datos.error);
    guardarBorrador(null);
    await Promise.all([refrescar(), esperarFondos(datos)]);
    // No se abre sola: así nadie se queda a medias de una pregunta del quiz.
    $("progreso").textContent = "¡Ya está!";
    $("abrir-lista").onclick = () => abrir(datos);
    $("abrir-lista").hidden = false;
    $("abrir-lista").focus();
  } catch (error) {
    fallo(error.message || "No hemos podido escribir la historia. Inténtalo otra vez.");
  }
}

function pedirHistoria(mascota) {
  if (!dentro()) {
    guardarBorrador(mascota);
    return pedirAcceso();
  }
  if (!estado.cuenta?.quedan) {
    guardarBorrador(mascota);
    return abrirMuro();
  }
  crear(mascota);
}

// Tras entrar o pagar, retoma la historia que estaba pidiendo.
function continuar() {
  const borrador = leerBorrador();
  if (!borrador) return;
  const formulario = $("formulario");
  for (const [campo, valor] of Object.entries(borrador)) {
    if (formulario.elements[campo]) formulario.elements[campo].value = valor;
  }
  pedirHistoria(borrador);
}

// Stripe avisa al servidor por su cuenta: el plan puede tardar unos segundos en llegar.
async function esperarPlan() {
  for (let intento = 0; intento < 15 && !estado.cuenta?.plan; intento++) {
    await new Promise((listo) => setTimeout(listo, 1000));
    await refrescar();
  }
}

$("formulario").addEventListener("submit", (evento) => {
  evento.preventDefault();
  $("error").hidden = true;
  pedirHistoria(Object.fromEntries(new FormData(evento.target)));
});

$("formulario-acceso").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const boton = evento.target.querySelector("button");
  if (boton.disabled) return;
  boton.disabled = true;
  const email = new FormData(evento.target).get("email");
  const { error } = await estado.cliente.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin } });
  boton.disabled = false;
  $("acceso-aviso").textContent = !error
    ? "Te lo hemos enviado. Mira tu correo, y también la carpeta de spam."
    : error.status === 429
      ? "Hemos enviado varios enlaces seguidos. Mira tu correo, también en spam, o vuelve a intentarlo en unos minutos."
      : "No hemos podido enviarlo. Inténtalo otra vez.";
  $("acceso-aviso").hidden = false;
});

for (const boton of document.querySelectorAll("[data-plan]")) {
  boton.addEventListener("click", async () => {
    if (!$("empezar-ya").checked) {
      $("muro-error").textContent = "Marca la casilla para continuar.";
      $("muro-error").hidden = false;
      return;
    }
    boton.disabled = true;
    const respuesta = await api("/api/pago", {
      method: "POST",
      body: JSON.stringify({ plan: boton.dataset.plan, empezarYa: true }),
    });
    boton.disabled = false;
    if (!respuesta.ok) {
      $("muro-error").textContent = "No hemos podido abrir el pago. Inténtalo otra vez.";
      $("muro-error").hidden = false;
      return;
    }
    location.href = (await respuesta.json()).url;
  });
}

$("entrar").addEventListener("click", pedirAcceso);
$("cerrar-acceso").addEventListener("click", () => $("acceso").close());
$("cerrar-muro").addEventListener("click", () => $("muro").close());
$("salir").addEventListener("click", async () => {
  await estado.cliente.auth.signOut();
  location.href = "/";
});
$("gestionar").addEventListener("click", async () => {
  const respuesta = await api("/api/portal", { method: "POST" });
  if (respuesta.ok) location.href = (await respuesta.json()).url;
});
$("borrar").addEventListener("click", async () => {
  if (!confirm("Se cancelará tu suscripción y se borrarán tu cuenta y todos sus historias. No se puede deshacer.")) return;
  const respuesta = await api("/api/cuenta", { method: "DELETE" });
  if (!respuesta.ok) return alert("No hemos podido borrarla. Escríbenos y lo hacemos nosotros.");
  await estado.cliente?.auth.signOut();
  location.href = "/";
});
$("anterior").addEventListener("click", () => { parar(); irA(estado.pagina - 1); });
$("siguiente").addEventListener("click", () => { parar(); irA(estado.pagina + 1); });
$("volver").addEventListener("click", () => { parar(); mostrar("inicio"); });
// Vuelve a narrar la página actual desde su primer segundo.
const VOZ = "mascotadas.voz";
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
  $("leer").textContent = "⏸ Pausar";
  leerPagina();
});

$("reiniciar").addEventListener("click", () => {
  const cargando = estado.leyendo && !estado.audio; // Ya se está pidiendo el audio: empezará desde el principio igual.
  estado.leyendo = true;
  $("leer").textContent = "⏸ Pausar";
  if (!estado.audio) return cargando || leerPagina();
  estado.audio.currentTime = 0;
  estado.audio.play();
});
$("leer").addEventListener("click", () => {
  if (estado.leyendo) return pausar();
  estado.leyendo = true;
  $("leer").textContent = "⏸ Pausar";
  if (estado.audio) estado.audio.play();
  else leerPagina();
});

async function iniciar() {
  $("ejemplo").innerHTML = ilustrar(EJEMPLO, { especie: "perro", color: "#c98a4f", collar: "#d9503f" });
  const texto = document.createElement("p");
  texto.textContent = EJEMPLO.texto;
  $("ejemplo").append(texto);

  estado.config = await (await fetch("/api/estado")).json();
  $("leer").hidden = !estado.config.voz;
  $("reiniciar").hidden = !estado.config.voz;
  $("voz").hidden = !estado.config.voz;

  if (!estado.config.local) {
    estado.cliente = window.supabase.createClient(estado.config.supabaseUrl, estado.config.supabaseAnon);
    estado.sesion = (await estado.cliente.auth.getSession()).data.session;
    estado.cliente.auth.onAuthStateChange(async (evento, sesion) => {
      const acabaDeEntrar = evento === "SIGNED_IN" && !estado.sesion;
      estado.sesion = sesion;
      if (!acabaDeEntrar) return;
      await refrescar();
      continuar();
    });
  }

  await refrescar();

  const pago = new URLSearchParams(location.search).get("pago");
  if (pago) history.replaceState(null, "", "/");
  if (pago === "ok") {
    await esperarPlan();
    continuar();
  } else if (dentro()) {
    const borrador = leerBorrador();
    if (borrador && estado.cuenta?.quedan) continuar();
  }
}

iniciar();
