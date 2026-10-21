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

function escapeXml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

const colors = { bg: '#0D1117', white: '#F8FAFC', blue: '#3B82F6', muted: '#94A3B8', line: '#263244' };
const font = 'Arial, Helvetica, sans-serif';
const cardStart = (width, height, title) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}"><rect width="100%" height="100%" rx="16" fill="${colors.bg}"/><rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="15" fill="none" stroke="${colors.line}"/><text x="24" y="34" font-family="${font}" font-size="13" font-weight="700" letter-spacing="1.4" fill="${colors.blue}">${escapeXml(title.toUpperCase())}</text>`;
const write = async (name, contents) => await import('node:fs/promises').then(({ writeFile }) => writeFile(new URL(`../assets/${name}`, import.meta.url), contents, 'utf8'));

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
  ['Repositorios públicos', user.public_repos ?? 0],
  ['Seguidores', user.followers ?? 0],
  ['Estrellas recibidas', stars],
];
let stats = cardStart(980, 170, 'Resumen público');
metrics.forEach(([label, value], index) => {
  const x = 28 + index * 318;
  stats += `<text x="${x}" y="94" font-family="${font}" font-size="34" font-weight="700" fill="${colors.white}">${Number(value).toLocaleString('es-AR')}</text><text x="${x}" y="124" font-family="${font}" font-size="14" fill="${colors.muted}">${escapeXml(label)}</text>`;
});
stats += '</svg>';
await write('stats.svg', stats);

const topLanguages = [...languageBytes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
const totalBytes = topLanguages.reduce((sum, [, bytes]) => sum + bytes, 0);
let langs = cardStart(980, 170, 'Lenguajes más utilizados');
if (!topLanguages.length) {
  langs += `<text x="24" y="91" font-family="${font}" font-size="15" fill="${colors.muted}">Sin datos de lenguajes en repositorios públicos propios.</text>`;
} else {
  const barWidth = 820;
  let offset = 24;
  const palette = ['#3B82F6', '#60A5FA', '#93C5FD', '#2563EB', '#1D4ED8', '#BFDBFE'];
  topLanguages.forEach(([name, bytes], index) => {
    const width = barWidth * bytes / totalBytes;
    langs += `<rect x="${offset}" y="58" width="${Math.max(width, 1)}" height="12" fill="${palette[index]}"/>`;
    const columnX = 24 + (index % 3) * 310;
    const columnY = 105 + Math.floor(index / 3) * 35;
    langs += `<circle cx="${columnX + 5}" cy="${columnY - 5}" r="5" fill="${palette[index]}"/><text x="${columnX + 18}" y="${columnY}" font-family="${font}" font-size="13" fill="${colors.white}">${escapeXml(name)} · ${Math.round(bytes / totalBytes * 100)}%</text>`;
    offset += width;
  });
}
langs += '</svg>';
await write('languages.svg', langs);

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
const plot = { left: 50, top: 60, width: 890, height: 115 };
const points = days.map((day, index) => `${plot.left + index * plot.width / (days.length - 1)},${plot.top + plot.height - day.count / maxCount * plot.height}`).join(' ');
let activity = cardStart(980, 230, 'Actividad pública · últimos 30 días');
activity += `<path d="M${plot.left} ${plot.top + plot.height}H${plot.left + plot.width}" stroke="${colors.line}"/><polyline points="${points}" fill="none" stroke="${colors.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><text x="${plot.left}" y="205" font-family="${font}" font-size="11" fill="${colors.muted}">${days[0].key}</text><text x="${plot.left + plot.width - 72}" y="205" font-family="${font}" font-size="11" fill="${colors.muted}">${days.at(-1).key}</text><text x="24" y="215" font-family="${font}" font-size="11" fill="${colors.muted}">Commits en eventos públicos PushEvent</text></svg>`;
await write('activity.svg', activity);
