// Dibuja cada página en SVG: no cuesta nada por historia y el protagonista es siempre el mismo.
const CIELOS = {
  dia: ["#8fd3f0", "#e6f6e8"],
  atardecer: ["#f2855e", "#fbd38a"],
  noche: ["#141a44", "#3a3a7c"],
};

const SUELOS = {
  bosque: "#2f6b4a", mar: "#1f6f9c", espacio: "#23204f", castillo: "#7a8a55",
  montana: "#6c6a8c", ciudad: "#4a4e69", selva: "#1f7a50", habitacion: "#b98b62",
};

function estrellas(n) {
  let s = "";
  for (let i = 0; i < n; i++) {
    const x = (i * 137) % 800, y = (i * 71) % 240, r = 1 + (i % 3);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff6d5" opacity="${0.5 + (i % 5) / 10}"/>`;
  }
  return s;
}

const FONDOS = {
  bosque: (o) => [60, 190, 620, 730].map((x, i) => `<rect x="${x + 22}" y="${230 + i * 6}" width="22" height="130" fill="#4a3628"/><path d="M${x - 45} ${270 + i * 6} L${x + 33} ${100 + i * 14} L${x + 111} ${270 + i * 6}Z" fill="${o ? "#1d4a3e" : "#2f7d56"}"/>`).join(""),
  mar: () => `<path d="M0 340 Q100 310 200 340 T400 340 T600 340 T800 340 V500 H0Z" fill="#2a86b8"/><path d="M0 380 Q100 355 200 380 T400 380 T600 380 T800 380 V500 H0Z" fill="#1c6a96"/>`,
  espacio: () => `<circle cx="640" cy="130" r="52" fill="#d98e73"/><ellipse cx="640" cy="130" rx="84" ry="16" fill="none" stroke="#f2cfa0" stroke-width="6"/><circle cx="120" cy="330" r="150" fill="#39356e"/>`,
  castillo: () => `<path d="M480 360 V170 h34 v-30 h26 v30 h34 v-30 h26 v30 h34 V360Z M560 360 v-70 a30 30 0 0 1 60 0 v70Z" fill="#8d86a8" fill-rule="evenodd"/>`,
  montana: (o) => `<path d="M-40 370 L230 110 L420 370Z" fill="${o ? "#3c3a6e" : "#7f7da3"}"/><path d="M280 370 L560 70 L860 370Z" fill="${o ? "#2f2d5c" : "#6a6890"}"/><path d="M516 118 L560 70 L606 118 L575 110 L556 128 L536 110Z" fill="#f4f1ff"/>`,
  ciudad: (o) => [[40, 170], [150, 120], [270, 200], [520, 140], [640, 180]].map(([x, h]) => `<rect x="${x}" y="${360 - h}" width="96" height="${h}" fill="#3a3e5c"/><rect x="${x + 18}" y="${380 - h}" width="16" height="20" fill="${o ? "#f7d774" : "#a8b0cc"}"/><rect x="${x + 58}" y="${410 - h}" width="16" height="20" fill="${o ? "#f7d774" : "#a8b0cc"}"/>`).join(""),
  selva: () => [90, 300, 690].map((x) => `<rect x="${x}" y="180" width="20" height="190" fill="#5b4330"/><ellipse cx="${x - 50}" cy="190" rx="70" ry="20" fill="#2a9a68" transform="rotate(-18 ${x} 190)"/><ellipse cx="${x + 70}" cy="190" rx="70" ry="20" fill="#1f8058" transform="rotate(18 ${x} 190)"/>`).join(""),
  habitacion: (o) => `<rect width="800" height="370" fill="${o ? "#2e2c5c" : "#f4dfc0"}"/><rect x="520" y="60" width="190" height="170" rx="10" fill="${o ? "#141a44" : "#a9def5"}" stroke="#8a6444" stroke-width="10"/><path d="M615 60 V230 M520 145 H710" stroke="#8a6444" stroke-width="6"/>${o ? `<circle cx="660" cy="110" r="5" fill="#fff6d5"/><circle cx="570" cy="100" r="3" fill="#fff6d5"/><circle cx="590" cy="190" r="3" fill="#fff6d5"/>` : ""}<rect x="60" y="270" width="290" height="90" rx="14" fill="#c9604f"/><rect x="60" y="240" width="90" height="50" rx="14" fill="#f4f0e6"/>`,
};

const OBJETOS = {
  cohete: `<g transform="translate(610 150) rotate(20)"><path d="M0 -70 C34 -30 34 40 24 60 H-24 C-34 40 -34 -30 0 -70Z" fill="#f4f0e6"/><circle cy="-10" r="14" fill="#6cc4e8"/><path d="M-24 40 L-46 76 L-20 62Z M24 40 L46 76 L20 62Z" fill="#d9503f"/><path d="M-14 62 L0 104 L14 62Z" fill="#f7b23b"/></g>`,
  barco: `<g transform="translate(580 300)"><path d="M-80 0 H80 L54 44 H-54Z" fill="#8a4b32"/><path d="M0 0 V-100 L66 -14Z" fill="#f4f0e6"/><path d="M-6 -6 V-84 L-58 -14Z" fill="#f2b84b"/></g>`,
  tesoro: `<g transform="translate(600 320)"><rect x="-52" y="-30" width="104" height="60" rx="6" fill="#8a4b32"/><path d="M-52 -30 Q0 -74 52 -30Z" fill="#a4603f"/><rect x="-10" y="-38" width="20" height="26" fill="#f2c94c"/></g>`,
  farol: `<g transform="translate(590 280)"><circle r="62" fill="#f7d774" opacity=".28"/><rect x="-16" y="-24" width="32" height="48" rx="6" fill="#f7d774" stroke="#6b4a2e" stroke-width="5"/><path d="M-12 -24 Q0 -46 12 -24" fill="none" stroke="#6b4a2e" stroke-width="5"/></g>`,
  mariposas: [[520, 150], [640, 210], [570, 90]].map(([x, y], i) => `<g transform="translate(${x} ${y})"><ellipse cx="-9" rx="10" ry="14" fill="${i % 2 ? "#e77fa6" : "#f2b84b"}"/><ellipse cx="9" rx="10" ry="14" fill="${i % 2 ? "#e77fa6" : "#f2b84b"}"/><rect x="-1.5" y="-10" width="3" height="20" fill="#3a2a22"/></g>`).join(""),
  nube: `<g transform="translate(560 120)" fill="#f7f4ff" opacity=".9"><circle r="36"/><circle cx="44" cy="10" r="28"/><circle cx="-44" cy="12" r="26"/><rect x="-60" y="10" width="120" height="28" rx="14"/></g>`,
};

// Cada especie se dibuja con el color de la mascota, para que sea siempre la misma en toda la historia.
const CUERPOS = {
  perro: (c, o) => `<ellipse cy="-26" rx="34" ry="24" fill="${c}"/><circle cx="30" cy="-52" r="22" fill="${c}"/><ellipse cx="44" cy="-46" rx="9" ry="16" fill="${o}"/><circle cx="34" cy="-56" r="3" fill="#222"/><circle cx="50" cy="-50" r="3" fill="#222"/>`,
  gato: (c, o) => `<ellipse cy="-24" rx="30" ry="22" fill="${c}"/><circle cx="28" cy="-50" r="20" fill="${c}"/><path d="M12 -64 L16 -82 L28 -68Z M32 -68 L44 -82 L46 -62Z" fill="${c}"/><circle cx="34" cy="-52" r="3" fill="#ffd34d"/><path d="M-28 -24 Q-52 -30 -44 -56" fill="none" stroke="${o}" stroke-width="7" stroke-linecap="round"/>`,
  conejo: (c, o) => `<ellipse cy="-24" rx="26" ry="24" fill="${c}"/><circle cx="20" cy="-50" r="18" fill="${c}"/><ellipse cx="14" cy="-84" rx="7" ry="20" fill="${c}"/><ellipse cx="30" cy="-82" rx="7" ry="20" fill="${o}"/><circle cx="26" cy="-52" r="3" fill="#222"/><circle cx="-24" cy="-22" r="9" fill="${o}"/>`,
};

function sombra(hex) {
  const n = parseInt(hex.slice(1), 16);
  const canal = (d) => Math.round(((n >> d) & 255) * 0.72).toString(16).padStart(2, "0");
  return `#${canal(16)}${canal(8)}${canal(0)}`;
}

function protagonista({ especie, color, collar }) {
  const c = color || "#c98a4f";
  const cuerpo = (CUERPOS[especie] || CUERPOS.perro)(c, sombra(c));
  return `<g transform="translate(300 372) scale(2)">${cuerpo}<path d="M14 -34 Q28 -26 42 -34" fill="none" stroke="${collar || "#d9503f"}" stroke-width="5" stroke-linecap="round"/></g>`;
}

export function ilustrar(pagina, mascota) {
  const [arriba, abajo] = CIELOS[pagina.momento] || CIELOS.dia;
  const noche = pagina.momento === "noche";
  const id = `c${Math.random().toString(36).slice(2, 8)}`;
  const objetos = (pagina.objetos || []).slice(0, 2).map((o) => OBJETOS[o] || "").join("");
  return `<svg viewBox="0 0 800 500" role="img" aria-label="Ilustración de la historia" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${arriba}"/><stop offset="1" stop-color="${abajo}"/></linearGradient></defs>
    <rect width="800" height="500" fill="url(#${id})"/>
    ${noche ? estrellas(36) + '<circle cx="120" cy="90" r="38" fill="#fbeeb8"/>' : ""}
    ${(FONDOS[pagina.lugar] || FONDOS.bosque)(noche)}
    <rect y="360" width="800" height="140" fill="${SUELOS[pagina.lugar] || SUELOS.bosque}"/>
    ${objetos}
    ${protagonista(mascota)}
  </svg>`;
}
