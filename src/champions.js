function lighten(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;

  const adjust = (channel) => Math.min(255, Math.max(0, Math.round(channel + (255 - channel) * percent)));

  return `#${((1 << 24) + (adjust(r) << 16) + (adjust(g) << 8) + adjust(b)).toString(16).slice(1)}`;
}

function hslToHex(h, s, l) {
  const hue = h / 360;
  const saturation = s / 100;
  const lightness = l / 100;

  const hue2rgb = (p, q, t) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };

  let r;
  let g;
  let b;

  if (saturation === 0) {
    r = g = b = lightness;
  } else {
    const q = lightness < 0.5 ? lightness * (1 + saturation) : lightness + saturation - lightness * saturation;
    const p = 2 * lightness - q;
    r = hue2rgb(p, q, hue + 1 / 3);
    g = hue2rgb(p, q, hue);
    b = hue2rgb(p, q, hue - 1 / 3);
  }

  const toHex = (x) => {
    const hex = Math.round(x * 255).toString(16).padStart(2, '0');
    return hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function stringToColor(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  const saturation = 55 + (Math.abs(hash) % 25);
  const lightness = 45 + (Math.abs(hash >> 3) % 10);
  return hslToHex(hue, saturation, lightness);
}

function createChampionIcon(name, primaryColor) {
  const light = lighten(primaryColor, 0.25);
  const initials = name
    .split(/\s+|&/)
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

const championData = [
  ['aatrox', 'Aatrox', ['Top'], ['Fighter']],
  ['ahri', 'Ahri', ['Mid'], ['Mage']],
  ['akali', 'Akali', ['Mid', 'Top'], ['Assassin']],
  ['akshan', 'Akshan', ['Mid', 'Top'], ['Marksman']],
  ['alistar', 'Alistar', ['Support'], ['Tank']],
  ['amumu', 'Amumu', ['Jungle', 'Support'], ['Tank']],
  ['anivia', 'Anivia', ['Mid'], ['Mage']],
  ['annie', 'Annie', ['Mid', 'Support'], ['Mage']],
  ['aphelios', 'Aphelios', ['Bot'], ['Marksman']],
  ['ashe', 'Ashe', ['Bot', 'Support'], ['Marksman']],
  ['aurelion-sol', 'Aurelion Sol', ['Mid'], ['Mage']],
  ['azir', 'Azir', ['Mid'], ['Mage']],
  ['bard', 'Bard', ['Support'], ['Support']],
  ['belveth', "Bel'Veth", ['Jungle'], ['Fighter']],
  ['blitzcrank', 'Blitzcrank', ['Support'], ['Tank']],
  ['brand', 'Brand', ['Support', 'Mid'], ['Mage']],
  ['braum', 'Braum', ['Support'], ['Support']],
  ['briar', 'Briar', ['Jungle'], ['Fighter']],
  ['caitlyn', 'Caitlyn', ['Bot'], ['Marksman']],
  ['camille', 'Camille', ['Top'], ['Fighter']],
  ['cassiopeia', 'Cassiopeia', ['Mid', 'Bot'], ['Mage']],
  ['chogath', "Cho'Gath", ['Top', 'Mid'], ['Tank']],
  ['corki', 'Corki', ['Mid'], ['Marksman']],
  ['darius', 'Darius', ['Top'], ['Fighter']],
  ['diana', 'Diana', ['Jungle', 'Mid'], ['Fighter']],
  ['dr-mundo', 'Dr. Mundo', ['Top', 'Jungle'], ['Tank']],
  ['draven', 'Draven', ['Bot'], ['Marksman']],
  ['ekko', 'Ekko', ['Mid', 'Jungle'], ['Assassin']],
  ['elise', 'Elise', ['Jungle'], ['Mage']],
  ['evelynn', 'Evelynn', ['Jungle'], ['Assassin']],
  ['ezreal', 'Ezreal', ['Bot', 'Mid'], ['Marksman']],
  ['fiddlesticks', 'Fiddlesticks', ['Jungle', 'Support'], ['Mage']],
  ['fiora', 'Fiora', ['Top'], ['Fighter']],
  ['fizz', 'Fizz', ['Mid'], ['Assassin']],
  ['galio', 'Galio', ['Mid', 'Support'], ['Tank']],
  ['gangplank', 'Gangplank', ['Top', 'Mid'], ['Fighter']],
  ['garen', 'Garen', ['Top'], ['Fighter']],
  ['gnar', 'Gnar', ['Top'], ['Fighter']],
  ['gragas', 'Gragas', ['Jungle', 'Top', 'Mid'], ['Tank']],
  ['graves', 'Graves', ['Jungle', 'Top'], ['Marksman']],
  ['gwen', 'Gwen', ['Top'], ['Fighter']],
  ['hecarim', 'Hecarim', ['Jungle'], ['Fighter']],
  ['heimerdinger', 'Heimerdinger', ['Mid', 'Support'], ['Mage']],
  ['hwei', 'Hwei', ['Mid', 'Support'], ['Mage']],
  ['illaoi', 'Illaoi', ['Top'], ['Fighter']],
  ['irelia', 'Irelia', ['Top', 'Mid'], ['Fighter']],
  ['ivern', 'Ivern', ['Jungle'], ['Support']],
  ['janna', 'Janna', ['Support'], ['Support']],
  ['jarvan-iv', 'Jarvan IV', ['Jungle'], ['Tank']],
  ['jax', 'Jax', ['Top', 'Jungle'], ['Fighter']],
  ['jayce', 'Jayce', ['Top', 'Mid'], ['Fighter']],
  ['jhin', 'Jhin', ['Bot'], ['Marksman']],
  ['jinx', 'Jinx', ['Bot'], ['Marksman']],
  ['ksante', "K'Sante", ['Top'], ['Tank']],
  ['kaisa', "Kai'Sa", ['Bot', 'Mid'], ['Marksman']],
  ['kalista', 'Kalista', ['Bot'], ['Marksman']],
  ['karma', 'Karma', ['Support', 'Mid'], ['Support']],
  ['karthus', 'Karthus', ['Jungle', 'Mid'], ['Mage']],
  ['kassadin', 'Kassadin', ['Mid'], ['Assassin']],
  ['katarina', 'Katarina', ['Mid'], ['Assassin']],
  ['kayle', 'Kayle', ['Top', 'Mid'], ['Fighter']],
  ['kayn', 'Kayn', ['Jungle'], ['Fighter']],
  ['kennen', 'Kennen', ['Top', 'Mid'], ['Mage']],
  ['khazix', "Kha'Zix", ['Jungle'], ['Assassin']],
  ['kindred', 'Kindred', ['Jungle'], ['Marksman']],
  ['kled', 'Kled', ['Top'], ['Fighter']],
  ['kogmaw', "Kog'Maw", ['Bot'], ['Marksman']],
  ['leblanc', 'LeBlanc', ['Mid'], ['Assassin']],
  ['lee-sin', 'Lee Sin', ['Jungle'], ['Fighter']],
  ['leona', 'Leona', ['Support'], ['Tank']],
  ['lillia', 'Lillia', ['Jungle', 'Top'], ['Fighter']],
  ['lissandra', 'Lissandra', ['Mid'], ['Mage']],
  ['lucian', 'Lucian', ['Bot', 'Mid'], ['Marksman']],
  ['lulu', 'Lulu', ['Support'], ['Support']],
  ['lux', 'Lux', ['Mid', 'Support'], ['Mage']],
  ['malphite', 'Malphite', ['Top', 'Support'], ['Tank']],
  ['malzahar', 'Malzahar', ['Mid'], ['Mage']],
  ['maokai', 'Maokai', ['Jungle', 'Support', 'Top'], ['Tank']],
  ['master-yi', 'Master Yi', ['Jungle'], ['Assassin']],
  ['milio', 'Milio', ['Support'], ['Support']],
  ['miss-fortune', 'Miss Fortune', ['Bot', 'Support'], ['Marksman']],
  ['mordekaiser', 'Mordekaiser', ['Top'], ['Fighter']],
  ['morgana', 'Morgana', ['Support', 'Mid'], ['Mage']],
  ['naafiri', 'Naafiri', ['Mid'], ['Assassin']],
  ['nami', 'Nami', ['Support'], ['Support']],
  ['nasus', 'Nasus', ['Top'], ['Fighter']],
  ['nautilus', 'Nautilus', ['Support'], ['Tank']],
  ['neeko', 'Neeko', ['Mid', 'Support'], ['Mage']],
  ['nidalee', 'Nidalee', ['Jungle', 'Mid'], ['Assassin']],
  ['nilah', 'Nilah', ['Bot'], ['Fighter']],
  ['nocturne', 'Nocturne', ['Jungle', 'Mid'], ['Assassin']],
  ['nunu', 'Nunu & Willump', ['Jungle', 'Support'], ['Tank']],
  ['olaf', 'Olaf', ['Jungle', 'Top'], ['Fighter']],
  ['orianna', 'Orianna', ['Mid'], ['Mage']],
  ['ornn', 'Ornn', ['Top'], ['Tank']],
  ['pantheon', 'Pantheon', ['Support', 'Mid', 'Top'], ['Fighter']],
  ['poppy', 'Poppy', ['Jungle', 'Top', 'Support'], ['Tank']],
  ['pyke', 'Pyke', ['Support', 'Mid'], ['Assassin']],
  ['qiyana', 'Qiyana', ['Mid', 'Jungle'], ['Assassin']],
  ['quinn', 'Quinn', ['Top', 'Bot'], ['Marksman']],
  ['rakan', 'Rakan', ['Support'], ['Support']],
  ['rammus', 'Rammus', ['Jungle'], ['Tank']],
  ['reksai', "Rek'Sai", ['Jungle'], ['Fighter']],
  ['rell', 'Rell', ['Support'], ['Tank']],
  ['renata-glasc', 'Renata Glasc', ['Support'], ['Support']],
  ['renekton', 'Renekton', ['Top'], ['Fighter']],
  ['rengar', 'Rengar', ['Jungle', 'Top'], ['Assassin']],
  ['riven', 'Riven', ['Top'], ['Fighter']],
  ['rumble', 'Rumble', ['Top', 'Mid'], ['Fighter']],
  ['ryze', 'Ryze', ['Mid', 'Top'], ['Mage']],
  ['samira', 'Samira', ['Bot'], ['Marksman']],
  ['sejuani', 'Sejuani', ['Jungle'], ['Tank']],
  ['senna', 'Senna', ['Support', 'Bot'], ['Marksman']],
  ['seraphine', 'Seraphine', ['Support', 'Mid'], ['Mage']],
  ['sett', 'Sett', ['Top', 'Support'], ['Fighter']],
  ['shaco', 'Shaco', ['Jungle', 'Support'], ['Assassin']],
  ['shen', 'Shen', ['Top', 'Support'], ['Tank']],
  ['shyvana', 'Shyvana', ['Jungle', 'Top'], ['Fighter']],
  ['singed', 'Singed', ['Top'], ['Tank']],
  ['sion', 'Sion', ['Top'], ['Tank']],
  ['sivir', 'Sivir', ['Bot'], ['Marksman']],
  ['skarner', 'Skarner', ['Jungle'], ['Tank']],
  ['smolder', 'Smolder', ['Bot'], ['Marksman']],
  ['sona', 'Sona', ['Support'], ['Support']],
  ['soraka', 'Soraka', ['Support'], ['Support']],
  ['swain', 'Swain', ['Support', 'Mid'], ['Mage']],
  ['sylas', 'Sylas', ['Mid', 'Top'], ['Mage']],
  ['syndra', 'Syndra', ['Mid'], ['Mage']],
  ['tahm-kench', 'Tahm Kench', ['Support', 'Top'], ['Tank']],
  ['taliyah', 'Taliyah', ['Mid', 'Jungle'], ['Mage']],
  ['talon', 'Talon', ['Mid', 'Jungle'], ['Assassin']],
  ['taric', 'Taric', ['Support'], ['Support']],
  ['teemo', 'Teemo', ['Top'], ['Marksman']],
  ['thresh', 'Thresh', ['Support'], ['Support']],
  ['tristana', 'Tristana', ['Bot', 'Mid'], ['Marksman']],
  ['trundle', 'Trundle', ['Jungle', 'Top'], ['Fighter']],
  ['tryndamere', 'Tryndamere', ['Top', 'Mid'], ['Fighter']],
  ['twisted-fate', 'Twisted Fate', ['Mid'], ['Mage']],
  ['twitch', 'Twitch', ['Bot', 'Jungle'], ['Marksman']],
  ['udyr', 'Udyr', ['Jungle', 'Top'], ['Fighter']],
  ['urgot', 'Urgot', ['Top'], ['Marksman']],
  ['varus', 'Varus', ['Bot', 'Mid'], ['Marksman']],
  ['vayne', 'Vayne', ['Bot', 'Top'], ['Marksman']],
  ['veigar', 'Veigar', ['Mid', 'Bot'], ['Mage']],
  ['velkoz', "Vel'Koz", ['Mid', 'Support'], ['Mage']],
  ['vex', 'Vex', ['Mid'], ['Mage']],
  ['vi', 'Vi', ['Jungle'], ['Fighter']],
  ['viego', 'Viego', ['Jungle'], ['Assassin']],
  ['viktor', 'Viktor', ['Mid'], ['Mage']],
  ['vladimir', 'Vladimir', ['Mid', 'Top'], ['Mage']],
  ['volibear', 'Volibear', ['Top', 'Jungle'], ['Fighter']],
  ['warwick', 'Warwick', ['Jungle', 'Top'], ['Fighter']],
  ['wukong', 'Wukong', ['Jungle', 'Top'], ['Fighter']],
  ['xayah', 'Xayah', ['Bot'], ['Marksman']],
  ['xerath', 'Xerath', ['Mid', 'Support'], ['Mage']],
  ['xin-zhao', 'Xin Zhao', ['Jungle'], ['Fighter']],
  ['yasuo', 'Yasuo', ['Mid', 'Top'], ['Fighter']],
  ['yone', 'Yone', ['Mid', 'Top'], ['Fighter']],
  ['yorick', 'Yorick', ['Top'], ['Fighter']],
  ['yuumi', 'Yuumi', ['Support'], ['Support']],
  ['zac', 'Zac', ['Jungle'], ['Tank']],
  ['zed', 'Zed', ['Mid'], ['Assassin']],
  ['zeri', 'Zeri', ['Bot'], ['Marksman']],
  ['ziggs', 'Ziggs', ['Mid', 'Bot'], ['Mage']],
  ['zilean', 'Zilean', ['Support', 'Mid'], ['Support']],
  ['zoe', 'Zoe', ['Mid'], ['Mage']],
  ['zyra', 'Zyra', ['Support', 'Mid'], ['Mage']]
];

export const champions = championData.map(([id, name, positions, classes]) => {
  const color = stringToColor(id);
  const roleText = positions.length ? positions.join('/') : classes.join('/');
  return {
    id,
    name,
    positions,
    classes,
    role: roleText,
    color,
    image: createChampionIcon(name, color)
  };
});

