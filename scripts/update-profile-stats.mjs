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
const colors = { bg: '#080A12', white: '#E8ECF8', blue: '#6578FF', cyan: '#50E5FF', muted: '#858BA2', line: '#20263A', soft: '#111522' };
const font = 'Courier New, Consolas, monospace';
const write = (name, content) => writeFile(new URL(`../assets/${name}`, import.meta.url), content, 'utf8');
const svg = (width, height, label, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(label)}"><rect width="${width}" height="${height}" rx="18" fill="${colors.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="17" fill="none" stroke="${colors.line}"/>${body}</svg>`;
const title = (text, x = 28, y = 34) => `<text x="${x}" y="${y}" font-family="${font}" font-size="12" font-weight="700" letter-spacing="1.5" fill="${colors.muted}">${escapeXml(text.toUpperCase())}</text>`;
const projectCard = (name, eyebrow, detail, mark, number) => svg(520, 150, `${name} · ${eyebrow}`, `<path d="M18 1H502Q519 1 519 18V132Q519 149 502 149H18Q1 149 1 132V18Q1 1 18 1Z" fill="none" stroke="#343844"/><path d="M1 18V1H18" fill="none" stroke="${colors.white}" stroke-width="2"/><text x="24" y="29" font-family="${font}" font-size="10" letter-spacing="1.5" fill="${colors.white}">PROYECTO / ${number}</text><text x="496" y="29" text-anchor="end" font-family="${font}" font-size="10" fill="#A7ABB5">[ ${escapeXml(eyebrow)} ]</text><path d="M24 43H496" stroke="#343844"/><text x="24" y="84" font-family="${font}" font-size="28" font-weight="700" letter-spacing="1" fill="${colors.white}">${escapeXml(name)}</text><text x="24" y="113" font-family="${font}" font-size="13" fill="#A7ABB5">${escapeXml(detail)}</text><rect x="451" y="65" width="45" height="45" rx="4" fill="#111318" stroke="#343844"/><text x="473" y="95" text-anchor="middle" font-family="${font}" font-size="22" fill="${colors.white}">${escapeXml(mark)}</text><text x="496" y="135" text-anchor="end" font-family="${font}" font-size="9" fill="#A7ABB5">GC / ${number}</text>`);

await write('header.svg', svg(1200, 270, 'Joaquín González Calderón · Analista en Sistemas y Desarrollador Full Stack', `<defs><linearGradient id="signal" x1="0" x2="1" y1="1" y2="0"><stop stop-color="${colors.blue}"/><stop offset="1" stop-color="${colors.cyan}"/></linearGradient></defs><path d="M24 0V270" stroke="${colors.line}"/><text x="42" y="42" font-family="${font}" font-size="11" letter-spacing="1.3" fill="${colors.cyan}">JG / SISTEMAS &amp; SOFTWARE</text><text x="1158" y="42" text-anchor="end" font-family="${font}" font-size="10" fill="${colors.muted}">BUENOS AIRES · AR</text><path d="M42 59H1158" stroke="${colors.line}"/><text x="42" y="127" font-family="${font}" font-size="42" font-weight="700" letter-spacing="-1.3" fill="${colors.white}">Joaquín González Calderón</text><text x="45" y="163" font-family="${font}" font-size="15" fill="${colors.muted}">ANALISTA EN SISTEMAS <tspan fill="${colors.blue}">/</tspan> DESARROLLADOR FULL STACK</text><path d="M45 198H560" stroke="${colors.line}"/><text x="45" y="226" font-family="${font}" font-size="11" letter-spacing="1.2" fill="${colors.muted}">CREANDO PRODUCTOS DIGITALES</text><text x="1158" y="226" text-anchor="end" font-family="${font}" font-size="11" fill="${colors.cyan}">PERFIL_001</text><circle cx="920" cy="142" r="91" fill="${colors.soft}" stroke="${colors.line}"/><circle cx="920" cy="142" r="70" fill="none" stroke="url(#signal)" stroke-width="1.5"/><circle cx="920" cy="142" r="49" fill="none" stroke="${colors.line}" stroke-width="1" stroke-dasharray="2 6"/><path d="M920 43V76M920 208V241M821 142H854M986 142H1019M850 72L873 95M967 189L990 212M850 212L873 189M967 95L990 72" stroke="${colors.line}"/><path d="M888 155L910 126L929 142L955 109" fill="none" stroke="url(#signal)" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"/><rect x="953" y="106" width="6" height="6" fill="${colors.cyan}"/><path d="M1144 250H1158V264" fill="none" stroke="${colors.blue}" stroke-width="2"/>`));
await write('streak.svg', projectCard('STREAK', 'HÁBITOS / ENTRENAMIENTO', 'Hábitos · entrenamiento · progreso', 'S', '01'));
await write('stugo.svg', projectCard('STUGO', 'VIDA UNIVERSITARIA', 'Servicios · vivienda · viajes compartidos', 'U', '02'));
await write('enjambre.svg', projectCard('ENJAMBRE', 'DRONES / EMERGENCIAS', 'Reconocimiento para postemergencias', 'E', '03'));
await write('may.svg', projectCard('MAY', 'EDICIÓN AUDIOVISUAL', 'Edición modular de video y audio', 'M', '04'));

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
let statsBody = `${title('GITHUB / RESUMEN PÚBLICO')}`;
metrics.forEach(([label, value], index) => {
  const x = 28 + index * 151;
  statsBody += `<path d="M${x} 55V67" stroke="${colors.cyan}"/><text x="${x}" y="103" font-family="${font}" font-size="30" font-weight="700" fill="${colors.white}">${Number(value).toLocaleString('es-AR')}</text><text x="${x}" y="129" font-family="${font}" font-size="11" fill="${colors.muted}">${escapeXml(label.toUpperCase())}</text>`;
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
let activityBody = title('ACTIVIDAD PÚBLICA / ÚLTIMOS 30 DÍAS');
activityBody += `<path d="M${plot.left} ${plot.top + plot.height}H${plot.left + plot.width}" stroke="${colors.line}"/><polyline points="${points}" fill="none" stroke="${colors.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
if (days.every((day) => day.count === 0)) {
  activityBody += `<text x="490" y="116" text-anchor="middle" font-family="${font}" font-size="14" fill="${colors.muted}">Sin eventos públicos de push durante este período</text>`;
}
activityBody += `<text x="${plot.left}" y="190" font-family="${font}" font-size="11" fill="${colors.muted}">${days[0].key}</text><text x="${plot.left + plot.width}" y="190" text-anchor="end" font-family="${font}" font-size="11" fill="${colors.muted}">${days.at(-1).key}</text>`;
await write('activity.svg', svg(980, 210, 'Actividad pública de los últimos 30 días', activityBody));
