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
];

const barajar = (lista) => lista.map((x) => [Math.random(), x]).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

let cola = [];
let aciertos = 0;
let respondidas = 0;

function pintarPuntos() {
  $("quiz-puntos").textContent = `${aciertos} de ${respondidas} aciertos`;
}

function siguiente() {
  if (cola.length === 0) cola = barajar(PREGUNTAS);
  const [pregunta, opciones, dato] = cola.pop();
  $("quiz-pregunta").textContent = pregunta;
  $("quiz-dato").hidden = true;
  $("quiz-siguiente").hidden = true;
  $("quiz-opciones").replaceChildren(...barajar(opciones).map((opcion) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.textContent = opcion;
    boton.addEventListener("click", () => responder(boton, opcion === opciones[0], opciones[0], dato));
    return boton;
  }));
}

function responder(boton, bien, correcta, dato) {
  respondidas++;
  if (bien) aciertos++;
  for (const otro of $("quiz-opciones").children) {
    otro.disabled = true;
    if (otro.textContent === correcta) otro.classList.add("bien");
  }
  if (!bien) boton.classList.add("mal");
  $("quiz-dato").textContent = `${bien ? "¡Correcto! " : "¡Casi! "}${dato}`;
  $("quiz-dato").hidden = false;
  $("quiz-siguiente").hidden = false;
  $("quiz-siguiente").focus();
  pintarPuntos();
}

export function empezarQuiz() {
  aciertos = 0;
  respondidas = 0;
  pintarPuntos();
  siguiente();
}

$("quiz-siguiente").addEventListener("click", siguiente);
