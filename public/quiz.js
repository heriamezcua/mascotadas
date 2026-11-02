const $ = (id) => document.getElementById(id);

// Preguntas para entretener la espera. La primera opción de cada una es la correcta; se barajan al mostrarlas.
const PREGUNTAS = [
  ["¿Cuántas horas al día duerme un gato?", ["Entre 12 y 16 horas", "Unas 4 horas", "Unas 8 horas, como tú"],
    "Los gatos duermen muchísimo para guardar energía para cazar… aunque solo cacen calcetines."],
  ["¿Por dónde sudan los perros?", ["Por las almohadillas de las patas", "Por las orejas", "Por todo el cuerpo"],
    "Sudan un poquito por las patas. Para refrescarse, sobre todo jadean con la lengua fuera."],
  ["¿Qué les pasa a los dientes de los conejos?", ["No paran de crecer en toda su vida", "Se les caen cada año", "Solo tienen cuatro"],
    "Por eso necesitan masticar heno todo el día: así se les desgastan."],
  ["¿Cuánto mejor huele un perro que una persona?", ["Miles de veces mejor", "El doble", "Igual que nosotros"],
    "Su nariz es tan buena que puede encontrar a una persona perdida siguiendo su rastro."],
  ["¿Qué hace un conejo cuando está muy feliz?", ["Da un salto con giro en el aire", "Ladra bajito", "Se pone a dormir boca arriba"],
    "Ese salto loco se llama «binky» y es la forma conejil de decir «¡qué bien me lo paso!»."],
  ["¿Qué tienen los perros que es único, como nuestras huellas de los dedos?", ["Las arrugas de la nariz", "El color de la lengua", "La forma de la cola"],
    "No hay dos narices de perro con el mismo dibujo."],
  ["¿Cuándo ronronean los gatos?", ["Cuando están a gusto, pero también si están nerviosos", "Solo cuando tienen hambre", "Solo cuando duermen"],
    "El ronroneo también les sirve para calmarse cuando algo les preocupa."],
  ["¿Pueden los gatos notar el sabor dulce?", ["No, no lo notan", "Sí, les encanta", "Solo el chocolate"],
    "Su lengua no tiene sensores para el dulce. ¡Y el chocolate es malo para gatos y perros!"],
  ["¿Qué colores ven los perros?", ["Azules y amarillos, pero no el rojo", "Solo blanco y negro", "Los mismos que nosotros"],
    "Una pelota roja sobre la hierba verde es casi invisible para ellos. Mejor una azul."],
  ["¿Cuánto pueden ver a su alrededor los conejos sin girar la cabeza?", ["Casi todo, hasta por detrás", "Solo lo que tienen delante", "Solo hacia arriba"],
    "Con los ojos a los lados de la cabeza vigilan casi todo a la vez."],
  ["¿Qué alimento de casa es peligroso para los perros?", ["El chocolate", "La zanahoria", "El arroz cocido"],
    "El chocolate les sienta muy mal. La zanahoria, en cambio, les encanta como premio."],
  ["¿Por qué los gatos suelen caer de pie?", ["Giran el cuerpo en el aire muy rápido", "Porque tienen imanes en las patas", "Porque flotan un poco"],
    "Tienen un reflejo que les hace girarse en el aire. Aun así, ¡mejor que no se caigan!"],
  ["¿Para qué usan los conejos sus orejas largas?", ["Para oír y para refrescarse", "Solo para decorar", "Para nadar"],
    "Por sus orejas pasa mucha sangre que suelta el calor, como un ventilador."],
  ["¿Cuántos músculos mueve un gato en cada oreja?", ["Unos 30", "Solo 2", "Ninguno"],
    "Por eso giran las orejas como antenas hacia cualquier ruido."],
  ["¿Cuánto tiempo pasan los gatos lamiéndose para estar limpios?", ["Mucho: buena parte del día", "Nunca se lamen", "Un minuto a la semana"],
    "Pasan entre un tercio y la mitad del tiempo que están despiertos acicalándose."],
  ["¿Cómo nacen los cachorros de perro?", ["Con los ojos y las orejas cerrados", "Ya corriendo", "Ladrando muy fuerte"],
    "Abren los ojos más o menos a las dos semanas. Al principio se guían por el olor y el calor."],
  ["¿Para qué sirven los bigotes de un gato?", ["Para notar si caben por un hueco", "Para peinarse", "Para oler"],
    "Sus bigotes notan el aire y los objetos, y le ayudan a moverse en la oscuridad."],
  ["¿Pueden vomitar los conejos?", ["No, no pueden", "Sí, como los perros", "Solo los martes"],
    "Por eso hay que tener mucho cuidado con lo que comen: solo comida de conejo."],
  ["¿Cuántos dientes tiene un perro adulto?", ["42", "12", "100"],
    "Tienen 42 dientes. ¡Diez más que una persona adulta!"],
  ["¿Por qué mueven la cola los perros?", ["Para hablar con su cuerpo", "Para espantar moscas y ya", "Porque se les mueve sola"],
    "La cola les sirve para comunicarse: no siempre significa alegría, también nervios o curiosidad."],
  ["¿Cuánto duerme un cachorro de perro?", ["Muchísimo: casi todo el día", "Nada, nunca se cansa", "Solo una siesta"],
    "Los cachorros pueden dormir hasta 18 o 20 horas al día. ¡Crecer cansa mucho!"],
  ["¿Por qué amasan los gatos con las patas?", ["Porque están a gusto", "Porque hacen pan", "Porque tienen frío"],
    "De pequeños lo hacían al mamar. De mayores lo hacen cuando se sienten tranquilos y felices."],
  ["¿Cuántos dedos tiene un gato en cada pata delantera?", ["Cinco", "Dos", "Diez"],
    "Normalmente cinco delante y cuatro detrás: dieciocho dedos en total."],
  ["¿Qué hacen los conejos con unas cacas blanditas especiales que hacen?", ["Se las comen", "Las esconden", "Las regalan"],
    "Parece asqueroso, pero así aprovechan las vitaminas de la comida por segunda vez."],
  ["¿Dónde guarda la comida un hámster?", ["En los mofletes", "En las orejas", "Debajo de la cola"],
    "Tiene unas bolsas en los carrillos donde le cabe muchísima comida para llevarla a su escondite."],
  ["¿Cuándo está más activo un hámster?", ["Al anochecer y de noche", "Solo a mediodía", "Nunca, siempre duerme"],
    "Por eso a veces oyes su rueda girar a medianoche."],
  ["¿Qué vitamina tienen que comer las cobayas porque no la fabrican?", ["La vitamina C", "La vitamina Z", "Ninguna"],
    "Como nosotros, necesitan vitamina C de la comida: les encantan el pimiento y el perejil."],
  ["¿Qué hace una cobaya cuando está muy contenta?", ["Da saltitos como palomitas", "Ladra", "Se pone a cantar"],
    "Esos saltitos repentinos se llaman «popcorning», como las palomitas al explotar."],
  ["¿Cómo se bañan las chinchillas?", ["Revolcándose en arena especial", "En la bañera con espuma", "Bajo la lluvia"],
    "Su pelo es tan denso que el agua no se secaría bien. Por eso se limpian rodando en polvo."],
  ["¿Qué tiene de especial el pelo de la chinchilla?", ["Es de los más densos del mundo animal", "Es verde", "No tiene pelo"],
    "Es tan espeso y suave que de cada poro le salen muchísimos pelos."],
  ["¿Cuántas horas duerme un hurón?", ["Entre 14 y 18 horas", "Unas 2 horas", "No duerme nunca"],
    "Duermen muchísimo… y cuando despiertan, ¡son un torbellino!"],
  ["¿Qué hace un hurón cuando está feliz?", ["Salta de lado como bailando", "Se queda quieto", "Silba una canción"],
    "Esa danza loca, con saltos de lado y la espalda arqueada, es su forma de jugar."],
  ["¿Cuántas púas tiene un erizo?", ["Unas 5.000", "Unas 10", "Solo una muy grande"],
    "¡Miles! Y no son venenosas: son pelos duros que le protegen."],
  ["¿Qué hace un erizo cuando se asusta?", ["Se hace una bola", "Sale corriendo muy rápido", "Se esconde detrás de una hoja"],
    "Se enrolla en una bola de pinchos y así nadie se lo puede comer."],
  ["¿Por qué se revuelcan en el barro los cerdos?", ["Para refrescarse", "Porque son sucios", "Para pintarse"],
    "Casi no pueden sudar, así que el barro les ayuda a quitarse el calor y a protegerse del sol."],
  ["¿Son listos los cerdos?", ["Muy listos: aprenden trucos y su nombre", "No, nada", "Solo los lunes"],
    "Los cerdos son de los animales más inteligentes: aprenden a hacer trucos y a reconocer su nombre."],
  ["¿Pueden dormir de pie los caballos?", ["Sí, pueden echar una cabezadita de pie", "No, nunca", "Solo boca abajo"],
    "Sus patas se «bloquean» para no caerse. Aun así, para dormir profundo se tumban."],
  ["¿Pueden hablar los periquitos?", ["Algunos aprenden muchas palabras", "Nunca hacen ningún sonido", "Solo saben ladrar"],
    "Algunos periquitos han aprendido a decir cientos de palabras."],
  ["¿Cuántos años puede vivir un loro?", ["Algunos más de 50 años", "Un mes", "Dos semanas"],
    "Algunos loros viven tanto que pasan de abuelos a nietos."],
  ["¿Cómo tienen los dedos de las patas los loros?", ["Dos hacia delante y dos hacia atrás", "Todos hacia delante", "No tienen dedos"],
    "Así se agarran muy bien a las ramas y hasta cogen la comida como si fuera una mano."],
  ["¿Puede una tortuga salir de su caparazón?", ["No, es parte de su cuerpo", "Sí, para ducharse", "Solo de noche"],
    "El caparazón está unido a su columna y sus costillas: es como su casa y su esqueleto a la vez."],
  ["¿Tienen dientes las tortugas?", ["No, tienen una especie de pico", "Sí, cien", "Solo uno de oro"],
    "Cortan la comida con el borde duro de su boca, como un pico."],
  ["¿Duermen los peces?", ["Sí, descansan con los ojos abiertos", "No, nunca", "Solo en vacaciones"],
    "Los peces no tienen párpados, así que descansan con los ojos abiertos."],
  ["¿Es verdad que los peces de colores olvidan todo en 3 segundos?", ["No, recuerdan cosas durante meses", "Sí, totalmente", "Olvidan en 1 segundo"],
    "Es un mito: pueden aprender a qué hora les das de comer y acordarse mucho tiempo."],
  ["¿Con qué huelen las serpientes?", ["Con la lengua", "Con la cola", "Con las escamas"],
    "Sacan la lengua para atrapar olores del aire y llevarlos a un órgano especial de su boca."],
  ["¿Pueden cerrar los ojos las serpientes?", ["No, no tienen párpados", "Sí, y guiñan", "Solo para dormir la siesta"],
    "Tienen una escama transparente que les protege el ojo, como unas gafas."],
  ["¿Qué hacen las serpientes cuando les queda pequeña la piel?", ["Se la quitan entera", "Se compran otra", "Se la cosen"],
    "Mudan la piel de una sola pieza, ¡como quitarse un calcetín!"],
  ["¿Cuántas patas tiene una tarántula?", ["Ocho", "Seis", "Cuatro"],
    "Las arañas tienen ocho patas. Los insectos, como las hormigas, tienen seis."],
  ["¿Qué le pasa a una tarántula si pierde una pata?", ["Le puede volver a crecer", "Se queda así para siempre", "Le crecen dos"],
    "Al cambiar su piel dura, la pata puede ir creciendo otra vez."],
  ["¿Cuántos años puede vivir una tarántula hembra?", ["Más de 20 años", "Una semana", "Un día"],
    "Algunas tarántulas hembra viven más que muchos perros y gatos."],
];

const barajar = (lista) => lista.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

const LETRAS = ["A", "B", "C"];
const ICONOS = {
  bien: '<svg viewBox="0 0 24 24" role="img" aria-label="Correcta"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  mal: '<svg viewBox="0 0 24 24" role="img" aria-label="Su respuesta, incorrecta"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>',
};

const RECORD = "mascotadas.record";

let cola = [];
let racha = 0; // Aciertos seguidos en esta espera: un fallo la devuelve a cero.
let respondidas = 0;
let record = leerRecord();
let recordAlEmpezar = record; // Se celebra una sola vez: al superar el récord que había al empezar la espera.
let alGuardarRecord = null; // La app lo guarda también en la cuenta, para verlo en cualquier dispositivo.

// El récord se guarda en este navegador y, con sesión, en la cuenta.
function leerRecord() {
  try {
    return Number(localStorage.getItem(RECORD)) || 0;
  } catch {
    return 0;
  }
}

function guardarRecord() {
  try {
    localStorage.setItem(RECORD, String(record));
  } catch {
    // Sin almacenamiento, el récord dura solo esta visita.
  }
  alGuardarRecord?.(record);
}

function pintarPuntos() {
  $("quiz-puntos").textContent = `${racha} ${racha === 1 ? "seguido" : "seguidos"}`;
  $("quiz-record").textContent = record;
  $("quiz-cabecera").textContent = `QUIZ · PREGUNTA ${respondidas + ($("quiz-respuesta").hidden ? 1 : 0)}`;
}

function siguiente() {
  if (cola.length === 0) cola = barajar(PREGUNTAS);
  const [pregunta, opciones, dato] = cola.pop();
  $("quiz-pregunta").textContent = pregunta;
  $("quiz-respuesta").hidden = true;
  const correcta = opciones[0];
  const barajadas = barajar(opciones);
  $("quiz-opciones").replaceChildren(...barajadas.map((opcion, i) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "opcion";
    boton.dataset.correcta = String(opcion === correcta);
    const letra = document.createElement("span");
    letra.className = "letra d";
    letra.setAttribute("aria-hidden", "true");
    letra.textContent = LETRAS[i];
    const texto = document.createElement("span");
    texto.className = "opcion-texto";
    texto.textContent = opcion;
    boton.append(letra, texto);
    boton.addEventListener("click", () => responder(boton, LETRAS[barajadas.indexOf(correcta)], dato));
    return boton;
  }));
  pintarPuntos();
}

function responder(boton, letraCorrecta, dato) {
  const bien = boton.dataset.correcta === "true";
  respondidas++;
  racha = bien ? racha + 1 : 0;
  if (racha > record) {
    record = racha;
    guardarRecord();
  }
  const nuevoRecord = bien && recordAlEmpezar > 0 && racha === recordAlEmpezar + 1;
  $("quiz-racha-caja").classList.toggle("record-nuevo", bien && recordAlEmpezar > 0 && racha > recordAlEmpezar);
  for (const otro of $("quiz-opciones").children) {
    otro.disabled = true;
    if (otro.dataset.correcta === "true") {
      otro.classList.add("bien");
      otro.insertAdjacentHTML("beforeend", ICONOS.bien);
    }
  }
  if (!bien) {
    boton.classList.add("mal");
    boton.insertAdjacentHTML("beforeend", ICONOS.mal);
  }
  $("quiz-veredicto").textContent = nuevoRecord
    ? `¡Correcto! ¡Nuevo récord: ${racha} seguidos! Siga, a ver hasta dónde llega.`
    : bien ? "¡Correcto!" : `¡Casi! Era la ${letraCorrecta}.`;
  $("quiz-dato").textContent = dato;
  $("quiz-respuesta").hidden = false;
  pintarPuntos();
  $("quiz-siguiente").focus();
}

// recordCuenta: el récord guardado en la cuenta; se queda el mayor entre ese y el de este navegador.
export function empezarQuiz({ recordCuenta = 0, guardar = null } = {}) {
  racha = 0;
  respondidas = 0;
  alGuardarRecord = guardar;
  record = Math.max(leerRecord(), Number(recordCuenta) || 0);
  if (guardar && record > (Number(recordCuenta) || 0)) guardar(record); // Sube a la cuenta un récord conseguido antes de entrar.
  recordAlEmpezar = record;
  $("quiz-racha-caja").classList.remove("record-nuevo");
  siguiente();
}

$("quiz-siguiente").addEventListener("click", siguiente);
