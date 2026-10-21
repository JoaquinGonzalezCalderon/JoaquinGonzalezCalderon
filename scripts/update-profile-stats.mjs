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

const escapeXml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
const colors = { bg: '#0D1117', white: '#F8FAFC', blue: '#3B82F6', muted: '#94A3B8', line: '#263244', soft: '#151B23' };
const font = 'Arial, Helvetica, sans-serif';
const write = (name, content) => writeFile(new URL(`../assets/${name}`, import.meta.url), content, 'utf8');
const svg = (width, height, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}"><rect width="${width}" height="${height}" rx="18" fill="${colors.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="${colors.line}"/>${body}</svg>`;
const title = (text, x = 28, y = 34) => `<text x="${x}" y="${y}" font-family="${font}" font-size="12" font-weight="700" letter-spacing="1.5" fill="${colors.muted}">${escapeXml(text.toUpperCase())}</text>`;
const projectCard = (name, eyebrow, detail, mark) => svg(520, 150, `${name} · ${eyebrow}`, `<rect x="0" y="0" width="5" height="150" rx="2" fill="${colors.blue}"/><circle cx="454" cy="75" r="35" fill="${colors.soft}"/><text x="454" y="84" text-anchor="middle" font-family="${font}" font-size="24" font-weight="700" fill="${colors.blue}">${escapeXml(mark)}</text>${title(eyebrow, 28, 37)}<text x="28" y="78" font-family="${font}" font-size="27" font-weight="700" fill="${colors.white}">${escapeXml(name)}</text><text x="28" y="108" font-family="${font}" font-size="14" fill="${colors.muted}">${escapeXml(detail)}</text>`);

await write('header.svg', svg(1200, 260, 'Joaquín González Calderón · Analista en Sistemas y Desarrollador Full Stack', `<rect x="0" y="0" width="8" height="260" fill="${colors.blue}"/><circle cx="1040" cy="130" r="118" fill="#111A27"/><circle cx="1040" cy="130" r="82" fill="none" stroke="#1C2D45" stroke-width="1"/><path d="M952 176L1024 104L1060 140L1134 66" fill="none" stroke="${colors.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="1134" cy="66" r="5" fill="${colors.white}"/><text x="64" y="82" font-family="${font}" font-size="13" font-weight="700" letter-spacing="2.5" fill="${colors.blue}">SISTEMAS · PRODUCTO · DESARROLLO</text><text x="64" y="143" font-family="${font}" font-size="42" font-weight="700" fill="${colors.white}">Joaquín González Calderón</text><text x="64" y="181" font-family="${font}" font-size="19" fill="${colors.muted}">Analista en Sistemas  /  Desarrollador Full Stack</text><path d="M64 215H306" stroke="${colors.line}" stroke-width="1"/><circle cx="64" cy="215" r="3" fill="${colors.blue}"/>`));
await write('streak.svg', projectCard('STREAK', 'HÁBITOS Y PROGRESO', 'Hábitos · entrenamiento · seguimiento personal', 'S'));
await write('stugo.svg', projectCard('STUGO', 'VIDA UNIVERSITARIA', 'Servicios, vivienda y viajes compartidos', 'U'));
await write('enjambre.svg', projectCard('ENJAMBRE', 'DRONES Y RESPUESTA', 'Reconocimiento para postemergencias', 'E'));
await write('may.svg', projectCard('MAY', 'CREACIÓN MULTIMEDIA', 'Edición modular de video y audio', 'M'));

const [user, repositories, events] = await Promise.all([
  github(`/users/${username}`),
  ownedRepositories(),
  github(`/users/${username}/events/public?per_page=100`),
]);

let stars = 0;
const languageBytes = new Map();
for (const repo of repositories) {
  stars += repo.stargazers_count ?? 0;
  const languages = await github(`/repos/${username}/${encodeURIComponent(repo.name)}/languages`);
  for (const [name, bytes] of Object.entries(languages)) languageBytes.set(name, (languageBytes.get(name) ?? 0) + bytes);
}

const metrics = [
  ['Repos públicos', user.public_repos ?? 0],
  ['Seguidores', user.followers ?? 0],
  ['Estrellas', stars],
];
let statsBody = `${title('GitHub · resumen')}`;
metrics.forEach(([label, value], index) => {
  const x = 28 + index * 151;
  statsBody += `<text x="${x}" y="103" font-family="${font}" font-size="30" font-weight="700" fill="${colors.white}">${Number(value).toLocaleString('es-AR')}</text><text x="${x}" y="129" font-family="${font}" font-size="12" fill="${colors.muted}">${escapeXml(label)}</text>`;
});
await write('stats.svg', svg(480, 160, 'Resumen público de GitHub', statsBody));

const topLanguages = [...languageBytes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
const totalBytes = [...languageBytes.values()].reduce((sum, bytes) => sum + bytes, 0);
const palette = ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#BFDBFE'];
let langsBody = title('Lenguajes principales');
if (totalBytes === 0) {
  langsBody += `<text x="28" y="91" font-family="${font}" font-size="13" fill="${colors.muted}">Sin datos públicos disponibles.</text>`;
} else {
  let offset = 28;
  const barWidth = 424;
  topLanguages.forEach(([, bytes], index) => {
    const width = barWidth * bytes / totalBytes;
    langsBody += `<rect x="${offset}" y="55" width="${Math.max(width, 1)}" height="8" fill="${palette[index]}"/>`;
    offset += width;
  });
  topLanguages.forEach(([name, bytes], index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 28 + column * 215;
    const y = 94 + row * 25;
    langsBody += `<circle cx="${x + 4}" cy="${y - 4}" r="4" fill="${palette[index]}"/><text x="${x + 14}" y="${y}" font-family="${font}" font-size="12" fill="${colors.white}">${escapeXml(name)}</text><text x="${x + 185}" y="${y}" text-anchor="end" font-family="${font}" font-size="12" fill="${colors.muted}">${Math.round(bytes / totalBytes * 100)}%</text>`;
  });
}
await write('languages.svg', svg(480, 160, 'Lenguajes más utilizados en repositorios públicos', langsBody));

const now = new Date();
const days = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (29 - index)));
  return { key: date.toISOString().slice(0, 10), count: 0 };
});
const byDay = new Map(days.map((day) => [day.key, day]));
for (const event of events) {
  if (event.type !== 'PushEvent') continue;
  const day = byDay.get(event.created_at.slice(0, 10));
  if (day) day.count += event.payload?.size ?? event.payload?.commits?.length ?? 0;
}
const maxCount = Math.max(1, ...days.map((day) => day.count));
const plot = { left: 48, top: 68, width: 884, height: 94 };
const points = days.map((day, index) => `${plot.left + index * plot.width / (days.length - 1)},${plot.top + plot.height - day.count / maxCount * plot.height}`).join(' ');
let activityBody = title('Actividad pública · últimos 30 días');
activityBody += `<path d="M${plot.left} ${plot.top + plot.height}H${plot.left + plot.width}" stroke="${colors.line}"/><polyline points="${points}" fill="none" stroke="${colors.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
if (days.every((day) => day.count === 0)) {
  activityBody += `<text x="490" y="116" text-anchor="middle" font-family="${font}" font-size="14" fill="${colors.muted}">Sin eventos públicos de push durante este período</text>`;
}
activityBody += `<text x="${plot.left}" y="190" font-family="${font}" font-size="11" fill="${colors.muted}">${days[0].key}</text><text x="${plot.left + plot.width}" y="190" text-anchor="end" font-family="${font}" font-size="11" fill="${colors.muted}">${days.at(-1).key}</text>`;
await write('activity.svg', svg(980, 210, 'Actividad pública de los últimos 30 días', activityBody));
