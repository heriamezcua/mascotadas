// Escenas de dibujo animado en SVG: no cuestan nada por historia y la mascota es siempre la misma.
// El movimiento va en estilos.css (clases .entra, .cola, .ola...), así que cada página arranca su animación al pintarse.

const TINTA = "#2a1f2d";
const T = `stroke="${TINTA}" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"`;
const T3 = `stroke="${TINTA}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`;

const CIELOS = {
  dia: ["#7fd3f7", "#dff6ff"],
  atardecer: ["#ff9a76", "#ffd99e"],
  noche: ["#1b1f4b", "#43408e"],
};

const SUELOS = {
  bosque: ["#5cc46a", "#2f7d4c"], mar: ["#ffd98a", "#c9a25a"], espacio: ["#b9b3d6", "#6e6894"],
  castillo: ["#8fd16a", "#4f8a3e"], montana: ["#9fd47a", "#5a8a4a"], ciudad: ["#a9a9b8", "#6a6a80"],
  selva: ["#4fbf6a", "#256b45"], habitacion: ["#c98a5a", "#8a5a3b"],
};

const retraso = (i) => `style="animation-delay:-${(i * 0.73) % 4}s"`;

function nube(x, y, escala, i) {
  return `<g transform="translate(${x} ${y}) scale(${escala})"><g class="derivar" ${retraso(i)}>
    <path d="M-60 20 Q-70 -6 -40 -10 Q-34 -40 -4 -34 Q14 -54 40 -36 Q70 -36 66 -6 Q84 4 70 20Z" fill="#fff" ${T}/>
    <path d="M-44 10 Q-20 16 10 12" fill="none" stroke="#d8ecf7" stroke-width="5" stroke-linecap="round"/>
  </g></g>`;
}

function cielo(momento, lugar) {
  if (momento === "noche") {
    let estrellas = "";
    for (let i = 0; i < 26; i++) {
      const x = (i * 131 + 40) % 780, y = (i * 67 + 20) % 230, r = 2 + (i % 3);
      estrellas += `<g transform="translate(${x} ${y})"><path class="titilar" ${retraso(i)} d="M0 -${r * 2} L${r * 0.6} -${r * 0.6} L${r * 2} 0 L${r * 0.6} ${r * 0.6} L0 ${r * 2} L-${r * 0.6} ${r * 0.6} L-${r * 2} 0 L-${r * 0.6} -${r * 0.6}Z" fill="#fff4c2"/></g>`;
    }
    if (lugar === "espacio") return estrellas;
    return `${estrellas}<g transform="translate(110 90)"><circle class="latir" r="62" fill="#fff4c2" opacity=".18"/>
      <circle r="40" fill="#fff1b8" ${T}/><circle cx="-12" cy="-8" r="8" fill="#ead98f"/><circle cx="12" cy="12" r="5" fill="#ead98f"/></g>`;
  }
  const sol = momento === "atardecer"
    ? `<g transform="translate(650 250)"><circle class="latir" r="84" fill="#ffb26b" opacity=".35"/><circle r="58" fill="#ff7b54" ${T}/></g>`
    : `<g transform="translate(670 90)"><g class="girar">${[0, 45, 90, 135, 180, 225, 270, 315]
        .map((a) => `<path transform="rotate(${a})" d="M0 -60 L0 -78" stroke="#ffb703" stroke-width="9" stroke-linecap="round"/>`)
        .join("")}</g><circle r="44" fill="#ffd23f" ${T}/><circle cx="-14" cy="-12" r="10" fill="#fff3a6"/></g>`;
  return `${sol}${nube(180, 90, 0.9, 1)}${nube(470, 60, 0.7, 2)}`;
}

function arbol(x, base, i, noche) {
  const copa = noche ? "#2e7b5a" : "#3fae5a", luz = noche ? "#3f8f6a" : "#6fd27f";
  return `<g transform="translate(${x} ${base})"><g class="balanceo" ${retraso(i)}>
    <path d="M-10 0 L-8 -90 L8 -90 L10 0Z" fill="#8a5a3b" ${T}/>
    <circle cx="-32" cy="-96" r="34" fill="${copa}" ${T}/><circle cx="32" cy="-96" r="34" fill="${copa}" ${T}/>
    <circle cy="-128" r="46" fill="${copa}" ${T}/><circle cx="-14" cy="-142" r="14" fill="${luz}"/>
  </g></g>`;
}

const FONDOS = {
  bosque: (noche) => `<path d="M0 330 Q150 250 320 310 Q480 240 640 300 Q720 270 800 290 V400 H0Z" fill="${noche ? "#2c5e4c" : "#7ccf7d"}" ${T}/>
    ${arbol(80, 372, 1, noche)}${arbol(200, 380, 2, noche)}${arbol(610, 376, 3, noche)}${arbol(730, 370, 4, noche)}`,

  mar: () => `<rect y="250" width="800" height="150" fill="#2fa3d6"/>
    <g class="ola"><path d="M0 268 ${Array.from({ length: 16 }, (_, i) => `Q${i * 100 + 25} 252 ${i * 100 + 50} 268 T${i * 100 + 100} 268`).join(" ")} V330 H0Z" fill="#59c3ec" ${T3}/></g>
    <g class="ola lenta"><path d="M0 300 ${Array.from({ length: 16 }, (_, i) => `Q${i * 100 + 25} 286 ${i * 100 + 50} 300 T${i * 100 + 100} 300`).join(" ")} V360 H0Z" fill="#1f86b8" ${T3}/></g>`,

  espacio: () => `<g transform="translate(140 150)"><circle r="58" fill="#ff8fab" ${T}/><path d="M-40 -20 Q0 -6 44 -24" fill="none" stroke="#ff6f91" stroke-width="8"/>
      <ellipse rx="96" ry="18" fill="none" stroke="#ffd166" stroke-width="9" transform="rotate(-14)"/></g>
    <circle cx="560" cy="80" r="20" fill="#7bdff2" ${T}/>
    <g class="cruzar"><path d="M0 0 L-70 -24" stroke="#fff4c2" stroke-width="6" stroke-linecap="round" opacity=".7"/><circle r="9" fill="#fff4c2" ${T3}/></g>`,

  castillo: (noche) => `<g transform="translate(560 380)">
      <path d="M0 0 V-150 H24 V-170 H48 V-150 H72 V-170 H96 V-150 H120 V-170 H144 V-150 H168 V0Z" fill="${noche ? "#8a85b8" : "#d8d2f0"}" ${T}/>
      <path d="M-30 0 V-210 L0 -250 L30 -210 V0Z" fill="${noche ? "#9a95c8" : "#e6e0fb"}" ${T}/>
      <path d="M70 0 V-60 Q84 -82 98 -60 V0Z" fill="#6b4a3a" ${T}/>
      <path d="M0 -250 V-292" stroke="${TINTA}" stroke-width="5"/>
      <g transform="translate(0 -292)"><path class="ondear" d="M0 0 H44 L34 12 L44 24 H0Z" fill="#ff5d5d" ${T3}/></g>
      <rect x="-12" y="-176" width="24" height="30" rx="12" fill="${noche ? "#ffd166" : "#5a5080"}" ${T3}/></g>`,

  montana: (noche) => `<path d="M-40 380 L210 120 L440 380Z" fill="${noche ? "#4b4a86" : "#8c8fc4"}" ${T}/>
    <path d="M150 182 L210 120 L268 182 L238 172 L214 194 L190 170Z" fill="#fff" ${T3}/>
    <path d="M330 380 L590 90 L860 380Z" fill="${noche ? "#3c3b70" : "#7275b0"}" ${T}/>
    <path d="M520 168 L590 90 L656 168 L622 156 L596 182 L568 154Z" fill="#fff" ${T3}/>`,

  ciudad: (noche) => [[20, 190], [140, 140], [270, 220], [520, 170], [650, 210]].map(([x, h], i) => {
    const ventanas = [];
    for (let fila = 0; fila < Math.floor(h / 50); fila++) {
      for (let col = 0; col < 2; col++) {
        ventanas.push(`<rect class="${noche ? "luz" : ""}" ${retraso(i * 3 + fila + col)} x="${x + 20 + col * 44}" y="${400 - h + 24 + fila * 48}" width="26" height="30" rx="4" fill="${noche ? "#ffd166" : "#bfe6ff"}" ${T3}/>`);
      }
    }
    return `<rect x="${x}" y="${400 - h}" width="110" height="${h}" rx="6" fill="${["#ff8fab", "#7bdff2", "#b39ddb", "#ffb26b", "#90e0a8"][i]}" ${T}/>${ventanas.join("")}`;
  }).join(""),

  selva: (noche) => {
    const verde = noche ? "#2a7a55" : "#2fbf71";
    const hoja = (x, y, giro, i) => `<g transform="translate(${x} ${y}) rotate(${giro})"><g class="balanceo" ${retraso(i)}>
      <path d="M0 0 Q60 -70 150 -20 Q70 -10 0 0Z" fill="${verde}" ${T}/><path d="M6 -2 Q70 -36 140 -20" fill="none" stroke="${TINTA}" stroke-width="3"/></g></g>`;
    return `<path d="M0 320 Q200 260 400 300 Q600 250 800 300 V400 H0Z" fill="${noche ? "#1f5a40" : "#5ccf86"}" ${T}/>
      ${hoja(-20, 120, 10, 1)}${hoja(-10, 250, -20, 2)}${hoja(820, 140, 170, 3)}${hoja(810, 260, 200, 4)}
      <path d="M260 0 Q250 80 270 150" fill="none" stroke="#3f8f4a" stroke-width="8" stroke-linecap="round"/>
      <path d="M560 0 Q575 60 556 110" fill="none" stroke="#3f8f4a" stroke-width="8" stroke-linecap="round"/>`;
  },

  habitacion: (noche, momento, id) => {
    const [arriba, abajo] = CIELOS[momento] || CIELOS.dia;
    return `<rect width="800" height="380" fill="${noche ? "#3b3570" : "#ffe1b3"}"/>
      <path d="M0 360 H800" stroke="${TINTA}" stroke-width="5"/>
      <defs><linearGradient id="${id}v" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient></defs>
      <rect x="520" y="60" width="200" height="170" rx="10" fill="url(#${id}v)" ${T}/>
      ${noche ? `<circle class="titilar" cx="660" cy="110" r="5" fill="#fff4c2"/><circle class="titilar" ${retraso(2)} cx="570" cy="100" r="4" fill="#fff4c2"/>` : `<g transform="translate(600 130) scale(.5)"><g class="derivar"><path d="M-60 20 Q-70 -6 -40 -10 Q-34 -40 -4 -34 Q14 -54 40 -36 Q70 -36 66 -6 Q84 4 70 20Z" fill="#fff" ${T}/></g></g>`}
      <path d="M620 60 V230 M520 145 H720" stroke="${TINTA}" stroke-width="5"/>
      <path d="M500 50 Q520 140 506 240 H540 Q530 140 548 50Z" fill="#ff7a8a" ${T}/>
      <path d="M740 50 Q720 140 734 240 H700 Q710 140 692 50Z" fill="#ff7a8a" ${T}/>
      <path d="M30 360 V280 Q30 250 60 250 H240 Q270 250 270 280 V360Z" fill="#5b8def" ${T}/>
      <path d="M50 300 H250 V360 H50Z" fill="#7aa5ff" ${T}/>
      <g transform="translate(410 360)"><path d="M-6 0 V-140" stroke="${TINTA}" stroke-width="6"/>
        <path d="M-34 -140 L-22 -186 H22 L34 -140Z" fill="#ffd166" ${T}/>
        ${noche ? `<circle class="latir" cy="-150" r="60" fill="#ffd166" opacity=".25"/>` : ""}</g>`;
  },
};

const OBJETOS = {
  cohete: `<g transform="translate(640 150) rotate(18)"><g class="flotar">
    <path class="llama" d="M-14 58 Q0 110 14 58Z" fill="#ffb703" ${T3}/>
    <path d="M0 -70 C36 -30 36 40 24 60 H-24 C-36 40 -36 -30 0 -70Z" fill="#f1f1f7" ${T}/>
    <circle cy="-12" r="15" fill="#7bdff2" ${T3}/><path d="M-24 34 L-48 72 L-20 60Z M24 34 L48 72 L20 60Z" fill="#ff5d5d" ${T3}/></g></g>`,

  barco: `<g transform="translate(610 312)"><g class="mecer">
    <path d="M-86 0 H86 L60 46 H-60Z" fill="#b5653f" ${T}/><path d="M0 0 V-110" stroke="${TINTA}" stroke-width="6"/>
    <path d="M6 -104 L74 -16 H6Z" fill="#fff" ${T}/><path d="M-6 -90 L-62 -16 H-6Z" fill="#ffd166" ${T}/></g></g>`,

  tesoro: `<g transform="translate(620 360)"><path d="M-54 0 V-46 H54 V0Z" fill="#b5653f" ${T}/>
    <path d="M-54 -46 Q0 -96 54 -46Z" fill="#d07a4a" ${T}/><rect x="-12" y="-58" width="24" height="26" rx="4" fill="#ffd166" ${T3}/>
    ${[[-40, -90], [36, -100], [0, -120]].map(([x, y], i) => `<path class="brillo" ${retraso(i)} transform="translate(${x} ${y})" d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="#fff4a6"/>`).join("")}</g>`,

  farol: `<g transform="translate(620 300)"><circle class="latir" r="70" fill="#ffd166" opacity=".28"/>
    <path d="M0 -60 V-44" stroke="${TINTA}" stroke-width="5"/><path d="M-22 -44 H22 L18 30 H-18Z" fill="#ffe08a" ${T}/>
    <path d="M-28 30 H28 V40 H-28Z M-26 -44 H26 L18 -54 H-18Z" fill="#6b4a3a" ${T3}/></g>`,

  mariposas: [[560, 170, "#ff7ab6"], [660, 220, "#ffd166"], [600, 110, "#7bdff2"]].map(([x, y, color], i) => `
    <g transform="translate(${x} ${y})"><g class="revolotear" ${retraso(i)}>
      <g class="aletear"><ellipse cx="-11" rx="12" ry="16" fill="${color}" ${T3}/><ellipse cx="11" rx="12" ry="16" fill="${color}" ${T3}/></g>
      <rect x="-2" y="-12" width="4" height="24" rx="2" fill="${TINTA}"/></g></g>`).join(""),

  nube: `<g transform="translate(600 150) scale(.8)"><g class="flotar"><path d="M-60 20 Q-70 -6 -40 -10 Q-34 -40 -4 -34 Q14 -54 40 -36 Q70 -36 66 -6 Q84 4 70 20Z" fill="#fff" ${T}/>
    <circle cx="-14" cy="0" r="4" fill="${TINTA}"/><circle cx="14" cy="0" r="4" fill="${TINTA}"/><path d="M-8 10 Q0 16 8 10" fill="none" ${T3}/></g></g>`,
};

function ojo(x, y, iris = TINTA) {
  return `<ellipse cx="${x}" cy="${y}" rx="9" ry="11" fill="#fff" ${T3}/><ellipse cx="${x + 2}" cy="${y + 2}" rx="5" ry="6" fill="${iris}"/><circle cx="${x + 4}" cy="${y - 2}" r="2.2" fill="#fff"/>`;
}

function cola(trazo, color) {
  return `<path d="${trazo}" fill="none" stroke="${TINTA}" stroke-width="20" stroke-linecap="round"/><path d="${trazo}" fill="none" stroke="${color}" stroke-width="11" stroke-linecap="round"/>`;
}

const CUERPOS = {
  perro: (c, o, collar) => `
    <g transform="translate(-46 -58)"><g class="cola">${cola("M0 0 Q-24 -18 -30 -48", c)}</g></g>
    <rect x="-42" y="-34" width="20" height="34" rx="9" fill="${o}" ${T}/><rect x="14" y="-34" width="20" height="34" rx="9" fill="${o}" ${T}/>
    <ellipse cy="-52" rx="54" ry="36" fill="${c}" ${T}/><ellipse cx="4" cy="-38" rx="28" ry="14" fill="#fff" opacity=".35"/>
    <rect x="-24" y="-32" width="20" height="32" rx="9" fill="${c}" ${T}/><rect x="30" y="-32" width="20" height="32" rx="9" fill="${c}" ${T}/>
    <g transform="translate(48 -88)"><g class="cabeza">
      <path d="M-30 -16 Q-50 12 -34 38 Q-18 24 -14 -12Z" fill="${o}" ${T}/>
      <circle r="38" fill="${c}" ${T}/>
      <path d="M-22 30 Q4 46 30 34" fill="none" stroke="${collar}" stroke-width="9" stroke-linecap="round"/><circle cx="4" cy="44" r="6" fill="#ffd166" ${T3}/>
      <ellipse cx="22" cy="12" rx="24" ry="17" fill="#fff4e6" ${T}/>
      <path class="lengua" d="M20 24 Q22 42 32 36 Q32 28 30 24Z" fill="#ff7a8a" ${T3}/>
      <path d="M30 20 Q24 28 14 22" fill="none" ${T3}/><ellipse cx="38" cy="4" rx="9" ry="7" fill="${TINTA}"/>
      <g class="ojos">${ojo(-6, -8)}${ojo(16, -10)}</g>
      <ellipse cx="2" cy="14" rx="7" ry="4" fill="#ff8a8a" opacity=".55"/>
      <path d="M6 -30 Q28 -42 32 -8 Q20 -12 10 -22Z" fill="${o}" ${T}/>
    </g></g>`,

  gato: (c, o, collar) => `
    <g transform="translate(-40 -52)"><g class="cola">${cola("M0 0 Q-34 -8 -30 -50 Q-26 -80 -4 -84", c)}</g></g>
    <rect x="-36" y="-30" width="18" height="30" rx="8" fill="${o}" ${T}/><rect x="12" y="-30" width="18" height="30" rx="8" fill="${o}" ${T}/>
    <ellipse cy="-48" rx="48" ry="32" fill="${c}" ${T}/>
    <path d="M-20 -76 Q-14 -60 -22 -46 M0 -80 Q6 -62 -2 -48 M20 -76 Q26 -60 18 -46" fill="none" stroke="${o}" stroke-width="6" stroke-linecap="round"/>
    <rect x="-20" y="-28" width="18" height="28" rx="8" fill="${c}" ${T}/><rect x="26" y="-28" width="18" height="28" rx="8" fill="${c}" ${T}/>
    <g transform="translate(44 -84)"><g class="cabeza">
      <path d="M-30 -14 L-32 -60 L-4 -32Z" fill="${c}" ${T}/><path d="M-26 -22 L-27 -48 L-11 -32Z" fill="#ffb3c1"/>
      <path d="M6 -32 L28 -60 L32 -12Z" fill="${c}" ${T}/><path d="M12 -32 L26 -50 L28 -22Z" fill="#ffb3c1"/>
      <ellipse rx="38" ry="34" fill="${c}" ${T}/>
      <path d="M-24 26 Q2 40 28 28" fill="none" stroke="${collar}" stroke-width="8" stroke-linecap="round"/><circle cx="2" cy="38" r="5" fill="#ffd166" ${T3}/>
      <g class="ojos">${ojo(-10, -4, "#5aa02c")}${ojo(14, -6, "#5aa02c")}</g>
      <path d="M2 8 L10 8 L6 13Z" fill="#ff8fab" ${T3}/><path d="M6 13 Q2 20 -4 16 M6 13 Q10 20 16 16" fill="none" ${T3}/>
      <path d="M18 10 H44 M18 16 L42 22 M-8 10 H-30 M-8 16 L-28 22" stroke="${TINTA}" stroke-width="2" stroke-linecap="round"/>
      <ellipse cx="-16" cy="12" rx="6" ry="4" fill="#ff8a8a" opacity=".5"/>
    </g></g>`,

  conejo: (c, o, collar) => `
    <g transform="translate(-44 -52)"><g class="cola"><circle r="15" fill="#fff" ${T}/></g></g>
    <ellipse cx="-24" cy="-12" rx="22" ry="12" fill="${o}" ${T}/>
    <ellipse cy="-46" rx="44" ry="38" fill="${c}" ${T}/><ellipse cx="6" cy="-34" rx="22" ry="14" fill="#fff" opacity=".4"/>
    <ellipse cx="26" cy="-6" rx="16" ry="9" fill="${c}" ${T}/>
    <g transform="translate(40 -88)"><g class="cabeza">
      <g class="orejas"><ellipse cx="-12" cy="-58" rx="12" ry="34" fill="${c}" ${T} transform="rotate(-12 -12 -30)"/><ellipse cx="-12" cy="-58" rx="6" ry="24" fill="#ffb3c1" transform="rotate(-12 -12 -30)"/>
        <ellipse cx="14" cy="-60" rx="12" ry="34" fill="${o}" ${T} transform="rotate(10 14 -30)"/><ellipse cx="14" cy="-60" rx="6" ry="24" fill="#ffb3c1" transform="rotate(10 14 -30)"/></g>
      <circle r="34" fill="${c}" ${T}/>
      <path d="M-22 24 Q2 38 26 26" fill="none" stroke="${collar}" stroke-width="8" stroke-linecap="round"/><circle cx="2" cy="35" r="5" fill="#ffd166" ${T3}/>
      <g class="ojos">${ojo(-10, -6)}${ojo(14, -8)}</g>
      <ellipse cx="6" cy="8" rx="6" ry="4" fill="#ff8fab" ${T3}/>
      <path d="M0 14 H12 V22 H0Z" fill="#fff" ${T3}/><path d="M6 14 V22" stroke="${TINTA}" stroke-width="2"/>
      <ellipse cx="-16" cy="12" rx="6" ry="4" fill="#ff8a8a" opacity=".5"/>
    </g></g>`,
};

function oscurecer(hex) {
  const n = parseInt(hex.slice(1), 16);
  const canal = (d) => Math.round(((n >> d) & 255) * 0.72).toString(16).padStart(2, "0");
  return `#${canal(16)}${canal(8)}${canal(0)}`;
}

function protagonista({ especie, color, collar }) {
  const c = /^#[0-9a-f]{6}$/i.test(color) ? color : "#c98a4f";
  const cuerpo = (CUERPOS[especie] || CUERPOS.perro)(c, oscurecer(c), collar || "#d9503f");
  return `<g transform="translate(330 404)">
    <ellipse class="sombra" cy="0" rx="100" ry="14" fill="${TINTA}" opacity=".2"/>
    <g class="entra"><g class="bota"><g transform="scale(1.65)">${cuerpo}</g></g></g></g>`;
}

function suelo(lugar) {
  const [claro, oscuro] = SUELOS[lugar] || SUELOS.bosque;
  if (lugar === "habitacion") {
    return `<rect y="360" width="800" height="140" fill="${claro}"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M0 ${380 + i * 26} H800" stroke="${oscuro}" stroke-width="3"/>`).join("")}
      <ellipse cx="360" cy="430" rx="230" ry="38" fill="#7bdff2" ${T}/><ellipse cx="360" cy="430" rx="170" ry="24" fill="none" stroke="#fff" stroke-width="5"/>`;
  }
  return `<path d="M0 384 Q200 360 400 378 T800 372 V500 H0Z" fill="${claro}" ${T}/>
    <path d="M0 440 Q220 424 420 438 T800 432 V500 H0Z" fill="${oscuro}" opacity=".35"/>`;
}

export function ilustrar(pagina, mascota) {
  const lugar = FONDOS[pagina.lugar] ? pagina.lugar : "bosque";
  const momento = lugar === "espacio" ? "noche" : pagina.momento; // En el espacio siempre es de noche.
  const [arriba, abajo] = CIELOS[momento] || CIELOS.dia;
  const noche = momento === "noche";
  const id = `c${Math.random().toString(36).slice(2, 8)}`;
  const objetos = (pagina.objetos || []).slice(0, 2).map((o) => OBJETOS[o] || "").join("");
  return `<svg class="escena" viewBox="0 0 800 500" role="img" aria-label="Ilustración animada de la historia" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient></defs>
    <g class="capa-fondo">
      <rect width="800" height="500" fill="url(#${id})"/>
      ${lugar === "habitacion" ? "" : cielo(momento, lugar)}
      ${FONDOS[lugar](noche, momento, id)}
      ${suelo(lugar)}
      ${objetos}
    </g>
    ${protagonista(mascota)}
  </svg>`;
}

// Cambia el escenario dibujado por la imagen pintada por IA, con un movimiento lento de cámara.
// Si la imagen ya trae a la mascota pintada dentro (conMascota), se quita la dibujada.
export function ponerFondo(svg, url, conMascota) {
  const capa = svg?.querySelector(".capa-fondo");
  if (!capa) return;
  capa.innerHTML = `<image class="fondo-ia" href="${url}" x="-24" y="-14" width="848" height="530" preserveAspectRatio="xMidYMid slice"/>`;
  if (conMascota) for (const resto of [...svg.children]) if (resto !== capa && resto.tagName !== "defs") resto.remove();
}
