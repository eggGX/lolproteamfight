function lighten(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const adjust = (channel) => Math.min(255, Math.max(0, Math.round(channel + (255 - channel) * percent)));

  return `#${((1 << 24) + (adjust(r) << 16) + (adjust(g) << 8) + adjust(b)).toString(16).slice(1)}`;
}

function createChampionIcon(name, primaryColor) {
  const light = lighten(primaryColor, 0.25);
  const initials = name
    .split(/\s+/)
    .map((part) => part[0] || '')
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'>
    <defs>
      <linearGradient id='grad' x1='0%' y1='0%' x2='100%' y2='100%'>
        <stop offset='0%' stop-color='${light}'/>
        <stop offset='100%' stop-color='${primaryColor}'/>
      </linearGradient>
      <filter id='shadow' x='-50%' y='-50%' width='200%' height='200%'>
        <feDropShadow dx='0' dy='4' stdDeviation='6' flood-color='rgba(15,23,42,0.45)' />
      </filter>
    </defs>
    <rect width='100%' height='100%' rx='24' fill='url(#grad)' />
    <circle cx='60' cy='40' r='18' fill='rgba(15,23,42,0.22)' />
    <circle cx='90' cy='80' r='12' fill='rgba(255,255,255,0.18)' />
    <text x='50%' y='66%' text-anchor='middle' fill='#f8fafc' font-size='44' font-family='"Noto Sans JP", sans-serif' filter='url(#shadow)'>${initials}</text>
  </svg>`;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const rawChampions = [
  { id: 'ahri', name: 'Ahri', role: 'Mid', color: '#f472b6' },
  { id: 'garen', name: 'Garen', role: 'Top', color: '#60a5fa' },
  { id: 'lee-sin', name: 'Lee Sin', role: 'Jungle', color: '#f97316' },
  { id: 'jinx', name: 'Jinx', role: 'ADC', color: '#a855f7' },
  { id: 'thresh', name: 'Thresh', role: 'Support', color: '#22d3ee' },
  { id: 'riven', name: 'Riven', role: 'Top', color: '#34d399' },
  { id: 'yasuo', name: 'Yasuo', role: 'Mid', color: '#fbbf24' },
  { id: 'leona', name: 'Leona', role: 'Support', color: '#f59e0b' },
  { id: 'vayne', name: 'Vayne', role: 'ADC', color: '#ef4444' },
  { id: 'orianna', name: 'Orianna', role: 'Mid', color: '#38bdf8' },
  { id: 'shen', name: 'Shen', role: 'Top', color: '#3b82f6' },
  { id: 'sejuani', name: 'Sejuani', role: 'Jungle', color: '#22d3ee' }
];

export const champions = rawChampions.map((champion) => ({
  ...champion,
  image: createChampionIcon(champion.name, champion.color)
}));
