import { writeFile } from 'node:fs/promises';

const username = 'JoaquinGonzalezCalderon';
const token = process.env.GITHUB_TOKEN;
const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'profile-readme-stats',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${path}`);
  return response.json();
}

async function ownedRepositories() {
  const all = [];
  for (let page = 1; ; page += 1) {
    const current = await github(`/users/${username}/repos?type=owner&per_page=100&page=${page}`);
    all.push(...current);
    if (current.length < 100) return all;
  }
}

// Paleta tomada del banner: fondo, tinta blanca de los puntos y el cuadrado azul.
const themes = {
  dark: { bg: '#0B0F14', ink: '#F0EFEE', muted: '#7C838F', line: '#1E242D', faint: '#161B22' },
  light: { bg: '#FFFFFF', ink: '#0B0F14', muted: '#656D76', line: '#D0D7DE', faint: '#EAEEF2' },
};
const accent = '#0B97FC';
const dark = themes.dark;
const font = 'ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace';

const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const write = (name, content) => writeFile(new URL(`../assets/${name}`, import.meta.url), content, 'utf8');
const round = (n) => Math.round(n * 10) / 10;
const text = (x, y, content, { size = 16, fill = dark.ink, weight, spacing, anchor } = {}) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}"${weight ? ` font-weight="${weight}"` : ''}${spacing ? ` letter-spacing="${spacing}"` : ''}${anchor ? ` text-anchor="${anchor}"` : ''} fill="${fill}">${escapeXml(content)}</text>`;
const svg = (width, height, label, body, background) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}">${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}${body}</svg>`;

// Marco como el del banner: borde tenue, esquinas blancas y el cuadrado azul arriba a la derecha.
const frame = (width, height, ink = dark.ink, line = dark.line) => {
  const c = 18;
  const i = 0.5;
  const r = width - 0.5;
  const b = height - 0.5;
  return `<rect x="${i}" y="${i}" width="${width - 1}" height="${height - 1}" fill="none" stroke="${line}"/>` +
    `<path d="M${i} ${c}V${i}H${c}M${r - c} ${b}H${r}V${b - c}M${i} ${b - c}V${b}H${c}" fill="none" stroke="${ink}" stroke-width="2"/>` +
    `<rect x="${width - 14}" y="6" width="8" height="8" fill="${accent}"/>`;
};

// Semitono: grilla de puntos cuyo radio depende de una función de intensidad,
// con partículas sueltas que se dispersan como los brazos del banner.
function seeded(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function halftone({ x, y, width, height, step = 7, seed = 1, fill = dark.ink, intensity }) {
  const random = seeded(seed);
  let dots = '';
  for (let row = 0, py = y; py <= y + height; row += 1, py += step * 0.866) {
    for (let px = x + (row % 2 ? step / 2 : 0); px <= x + width; px += step) {
      const u = (px - x) / width;
      const v = (py - y) / height;
      const value = Math.max(0, Math.min(1, intensity(u, v, random)));
      const fade = Math.min(1, u * 3.2);
      let radius = value * fade * step * 0.52;
      if (fade < 1 && random() > fade + 0.15) radius = 0;
      if (radius < 0.45) {
        if (value > 0.08 && random() < value * 0.18) radius = 0.6 + random() * 0.6;
        else continue;
      }
      dots += `<circle cx="${round(px + (random() - 0.5) * 1.4)}" cy="${round(py + (random() - 0.5) * 1.4)}" r="${round(radius)}"/>`;
    }
  }
  return `<g fill="${fill}">${dots}</g>`;
}

const smooth = (edge0, edge1, value) => {
  const t = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

const motifs = {
  // Barras que crecen: constancia día a día.
  streak: (u, v) => {
    const bars = 7;
    const index = Math.floor(u * bars);
    const local = u * bars - index;
    if (local > 0.72) return 0;
    const top = 1 - (index + 1) / bars * 0.92;
    return smooth(top - 0.02, top + 0.08, v) * (0.45 + 0.55 * (index + 1) / bars) * (1 - v * 0.35);
  },
  // Señal de ubicación: anillos que se expanden desde un punto.
  stugo: (u, v) => {
    const d = Math.hypot((u - 0.55) * 1.15, v - 0.5);
    if (d < 0.07) return 1;
    const ring = Math.pow(Math.max(0, Math.cos(d * 34)), 3);
    return ring * Math.max(0, 1 - d * 1.45);
  },
  // Enjambre: nubes de drones dispersas.
  enjambre: (() => {
    const random = seeded(42);
    const swarm = Array.from({ length: 16 }, (_, i) => ({ u: 0.15 + random() * 0.8, v: 0.12 + random() * 0.76, s: 0.04 + random() * 0.07, w: i < 4 ? 1 : 0.55 + random() * 0.4 }));
    return (u, v) => Math.max(...swarm.map((p) => p.w * Math.exp(-((u - p.u) ** 2 + (v - p.v) ** 2) / (2 * p.s * p.s))));
  })(),
  // Forma de onda de audio.
  may: (u, v) => {
    const columns = 26;
    const local = u * columns - Math.floor(u * columns);
    if (local > 0.6) return 0;
    const c = Math.floor(u * columns) / columns;
    const amplitude = 0.08 + 0.38 * Math.abs(Math.sin(c * Math.PI * 2.3) * Math.sin(c * Math.PI * 7.1 + 0.6));
    return smooth(amplitude + 0.02, amplitude - 0.03, Math.abs(v - 0.5)) * (0.55 + 0.45 * (1 - Math.abs(v - 0.5) * 2));
  },
  // Esfera iluminada desde arriba a la izquierda, como en grabado.
  sphere: (u, v) => {
    const dx = (u - 0.6) / 0.38;
    const dy = (v - 0.5) / 0.46;
    const d = Math.hypot(dx, dy);
    if (d > 1) return 0;
    const z = Math.sqrt(1 - d * d);
    return Math.max(0, (dx * -0.45 + dy * -0.55 + z * 0.7)) * 1.05;
  },
};

// ---------- Tarjetas estáticas ----------

const sectionHeader = (number, label, theme) => {
  const t = themes[theme];
  const width = 1200;
  const labelWidth = (number.length + label.length + 3) * 22 * 0.6 + label.length * 3;
  return svg(width, 72, `${number} / ${label}`,
    text(0, 44, `${number}`, { size: 22, fill: t.muted, spacing: 3 }) +
    text(48, 44, '/', { size: 22, fill: t.line }) +
    text(78, 44, label.toUpperCase(), { size: 22, fill: t.ink, weight: 700, spacing: 3 }) +
    `<path d="M${Math.round(labelWidth + 70)} 37H${width - 22}" stroke="${t.line}"/>` +
    `<rect x="${width - 10}" y="33" width="8" height="8" fill="${accent}"/>`);
};

const sections = [
  ['01', 'Sobre mí', 'section-about'],
  ['02', 'Proyectos', 'section-projects'],
  ['03', 'Stack', 'section-stack'],
  ['04', 'Actividad', 'section-activity'],
];
for (const [number, label, file] of sections) {
  for (const theme of ['dark', 'light']) await write(`${file}-${theme}.svg`, sectionHeader(number, label, theme));
}

for (const theme of ['dark', 'light']) {
  const t = themes[theme];
  await write(`intro-${theme}.svg`, svg(1200, 300, 'Joaquín González Calderón · Analista en Sistemas y Desarrollador Full Stack',
    text(0, 70, 'HOLA, SOY', { size: 18, fill: t.muted, spacing: 6 }) +
    text(0, 140, 'Joaquín González Calderón', { size: 52, fill: t.ink, weight: 700, spacing: -1 }) +
    `<path d="M2 178H70" stroke="${t.ink}" stroke-width="2"/><rect x="80" y="174" width="8" height="8" fill="${accent}"/>` +
    text(0, 226, 'ANALISTA EN SISTEMAS', { size: 20, fill: t.ink, spacing: 3 }) +
    text(0, 258, 'DESARROLLADOR FULL STACK', { size: 20, fill: t.muted, spacing: 3 }) +
    halftone({ x: 880, y: 20, width: 320, height: 260, step: 8, seed: 7, fill: t.ink, intensity: motifs.sphere })));

  const groups = [
    ['FRONTEND', ['TypeScript', 'JavaScript', 'React', 'Next.js', 'Tailwind CSS']],
    ['BACKEND / DATOS', ['Python', 'PostgreSQL']],
    ['HERRAMIENTAS', ['Git', 'Docker', 'Figma']],
  ];
  let stackBody = '';
  groups.forEach(([group, items], row) => {
    const y = row * 72;
    stackBody += text(0, y + 41, group, { size: 15, fill: t.muted, spacing: 2 });
    let x = 250;
    for (const item of items) {
      const w = Math.round(item.length * 18 * 0.6 + 40);
      stackBody += `<rect x="${x + 0.5}" y="${y + 12.5}" width="${w}" height="44" fill="none" stroke="${t.line}"/>` +
        `<rect x="${x + 0.5}" y="${y + 12.5}" width="4" height="44" fill="${t.ink}"/>` +
        text(x + 22, y + 40, item, { size: 18, fill: t.ink });
      x += w + 14;
    }
  });
  await write(`stack-${theme}.svg`, svg(1200, 216, 'TypeScript, JavaScript, React, Next.js, Tailwind CSS, Python, PostgreSQL, Git, Docker y Figma', stackBody));

  await write(`footer-${theme}.svg`, svg(1200, 90, 'Joaquín González Calderón',
    `<path d="M0 20H1200" stroke="${t.line}"/>` +
    text(0, 66, 'GC', { size: 18, fill: t.ink, weight: 700, spacing: 3 }) +
    text(600, 66, 'CONSTRUYENDO PRODUCTOS DIGITALES, PUNTO POR PUNTO.', { size: 15, fill: t.muted, spacing: 2, anchor: 'middle' }) +
    `<rect x="1192" y="56" width="8" height="8" fill="${accent}"/>`));
}

const projects = [
  { file: 'streak', name: 'STREAK', tag: 'HÁBITOS / ENTRENAMIENTO', detail: 'Hábitos y entrenamiento', status: 'EN VIVO', live: true, seed: 11 },
  { file: 'stugo', name: 'STUGO', tag: 'VIDA UNIVERSITARIA', detail: 'App para universitarios', status: 'REPO PRIVADO', seed: 12 },
  { file: 'enjambre', name: 'ENJAMBRE', tag: 'DRONES / EMERGENCIAS', detail: 'Drones postemergencias', status: 'EN DESARROLLO', seed: 13 },
  { file: 'may', name: 'MAY', tag: 'EDICIÓN AUDIOVISUAL', detail: 'Editor de video y audio', status: 'EN DESARROLLO', seed: 14 },
];
for (const [index, project] of projects.entries()) {
  const number = String(index + 1).padStart(2, '0');
  await write(`${project.file}.svg`, svg(600, 340, `${project.name} · ${project.detail}`,
    halftone({ x: 250, y: 46, width: 320, height: 250, step: 7, seed: project.seed, intensity: motifs[project.file] }) +
    frame(600, 340) +
    text(32, 52, `PROYECTO / ${number}`, { size: 15, fill: dark.muted, spacing: 2 }) +
    text(32, 224, project.name, { size: 46, fill: dark.ink, weight: 700, spacing: 1 }) +
    text(32, 258, project.detail, { size: 18, fill: dark.muted }) +
    `<path d="M32 280H120" stroke="${dark.line}"/>` +
    (project.live ? `<rect x="32" y="298" width="8" height="8" fill="${accent}"/>` : `<rect x="32.5" y="298.5" width="7" height="7" fill="none" stroke="${dark.muted}"/>`) +
    text(50, 307, project.status, { size: 13, fill: project.live ? dark.ink : dark.muted, spacing: 2 }), dark.bg));
}

// ---------- Estadísticas (necesitan la API de GitHub) ----------

const [user, repositories, events] = await Promise.all([
  github(`/users/${username}`),
  ownedRepositories(),
  github(`/users/${username}/events/public?per_page=100`),
]);

let stars = 0;
const languageBytes = new Map();
for (const repo of repositories) {
  stars += repo.stargazers_count ?? 0;
  if (repo.fork) continue;
  const languages = await github(`/repos/${username}/${encodeURIComponent(repo.name)}/languages`);
  for (const [name, bytes] of Object.entries(languages)) languageBytes.set(name, (languageBytes.get(name) ?? 0) + bytes);
}

const metrics = [
  ['REPOS', user.public_repos ?? 0],
  ['SEGUIDORES', user.followers ?? 0],
  ['ESTRELLAS', stars],
];
let statsBody = frame(590, 220) + text(32, 52, 'GITHUB / RESUMEN', { size: 15, fill: dark.muted, spacing: 2 });
metrics.forEach(([label, value], index) => {
  const x = 32 + index * 185;
  if (index > 0) statsBody += `<path d="M${x - 24} 96V178" stroke="${dark.line}"/>`;
  statsBody += text(x, 150, Number(value).toLocaleString('es-AR'), { size: 52, fill: dark.ink, weight: 700 }) +
    text(x, 182, label, { size: 14, fill: dark.muted, spacing: 2 });
});
await write('stats.svg', svg(590, 220, 'Resumen público de GitHub', statsBody, dark.bg));

const topLanguages = [...languageBytes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
const totalBytes = [...languageBytes.values()].reduce((sum, bytes) => sum + bytes, 0);
const shades = [dark.ink, '#A9AEB6', '#6B727D', '#3D444E'];
let langsBody = frame(590, 220) + text(32, 52, 'LENGUAJES', { size: 15, fill: dark.muted, spacing: 2 });
if (totalBytes === 0) {
  langsBody += text(32, 130, 'Sin datos públicos disponibles.', { size: 16, fill: dark.muted });
} else {
  // Barra hecha de puntos, como el resto del perfil.
  const dotCount = 52;
  let filled = 0;
  const counts = topLanguages.map(([, bytes]) => Math.max(1, Math.round(bytes / totalBytes * dotCount)));
  let dots = '';
  counts.forEach((count, index) => {
    for (let i = 0; i < count && filled < dotCount; i += 1, filled += 1) dots += `<circle cx="${38 + filled * 10.2}" cy="84" r="3.6" fill="${shades[index]}"/>`;
  });
  for (; filled < dotCount; filled += 1) dots += `<circle cx="${38 + filled * 10.2}" cy="84" r="3.6" fill="${dark.line}"/>`;
  langsBody += dots;
  topLanguages.forEach(([name, bytes], index) => {
    const x = 32 + (index % 2) * 275;
    const y = 138 + Math.floor(index / 2) * 40;
    langsBody += `<circle cx="${x + 5}" cy="${y - 5}" r="5" fill="${shades[index]}"/>` +
      text(x + 20, y, name, { size: 17, fill: dark.ink }) +
      text(x + 245, y, `${Math.max(1, Math.round(bytes / totalBytes * 100))}%`, { size: 17, fill: dark.muted, anchor: 'end' });
  });
}
await write('languages.svg', svg(590, 220, 'Lenguajes más utilizados en repositorios públicos', langsBody, dark.bg));

const now = new Date();
const days = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (29 - index)));
  return { key: date.toISOString().slice(0, 10), count: 0 };
});
const byDay = new Map(days.map((day) => [day.key, day]));
for (const event of events) {
  if (event.type !== 'PushEvent') continue;
  const day = byDay.get(event.created_at.slice(0, 10));
  if (day) day.count += event.payload?.size ?? event.payload?.commits?.length ?? 1;
}
// Matriz de puntos: cada columna es un día, cada fila un nivel de actividad.
const maxCount = Math.max(1, ...days.map((day) => day.count));
const levels = 8;
const grid = { left: 40, bottom: 222, colStep: 37.6, rowStep: 17 };
let activityBody = frame(1200, 290) + text(32, 52, 'ACTIVIDAD PÚBLICA / ÚLTIMOS 30 DÍAS', { size: 15, fill: dark.muted, spacing: 2 });
const total = days.reduce((sum, day) => sum + day.count, 0);
activityBody += text(1168, 52, `${total} COMMITS`, { size: 15, fill: dark.ink, spacing: 2, anchor: 'end' });
days.forEach((day, column) => {
  const lit = day.count === 0 ? 0 : Math.max(1, Math.round(day.count / maxCount * levels));
  const isToday = column === days.length - 1;
  for (let row = 0; row < levels; row += 1) {
    const on = row < lit;
    const fill = on ? (isToday ? accent : dark.ink) : dark.line;
    activityBody += `<circle cx="${round(grid.left + 14 + column * grid.colStep)}" cy="${grid.bottom - row * grid.rowStep}" r="${on ? 5.5 : 3}" fill="${fill}"/>`;
  }
});
if (total === 0) {
  activityBody += `<rect x="330" y="128" width="540" height="44" fill="${dark.bg}"/>` +
    text(600, 156, 'Sin pushes públicos en este período', { size: 17, fill: dark.muted, anchor: 'middle' });
}
activityBody += text(grid.left + 8, 264, days[0].key, { size: 14, fill: dark.muted }) +
  text(1160, 264, 'HOY', { size: 14, fill: dark.muted, anchor: 'end', spacing: 2 });
await write('activity.svg', svg(1200, 290, 'Actividad pública de los últimos 30 días', activityBody, dark.bg));
