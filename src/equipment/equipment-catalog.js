const stroke = '#283934';
const accent = '#83b8a6';
const muted = '#d9e6e0';

const equipmentSvg = (content) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <g fill="none" stroke="${stroke}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      ${content}
    </g>
  </svg>
`;

export const equipmentCategories = [
  { id: 'all', label: '全部' },
  { id: 'glassware', label: '玻璃器材' },
  { id: 'support', label: '支架' },
  { id: 'heating', label: '加熱' },
  { id: 'accessories', label: '配件' },
];

export const equipmentCategoryIcons = {
  all: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M6 6h8v8H6zM18 6h8v8h-8zM6 18h8v8H6zM18 18h8v8h-8z"/>
    </svg>
  `,
  glassware: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M11 4h10M13 4v9l-6 12a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3l-6-12V4M9 22h14"/>
    </svg>
  `,
  support: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M8 26h17M12 26V5M9 5h6M8 10h15M20 10v6M15 15a3 3 0 1 0 0 6"/>
    </svg>
  `,
  heating: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 15h14v10a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3zM12 15h8M14 11h4v4M16 11V7"/>
      <path d="M16 7c-4-3 2-5 0-7 6 4 2 7 0 7z"/>
    </svg>
  `,
  accessories: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m7 25 14-18M5 26l4-4M21 7l3-3M21 21h6M24 18v6M7 8h7M10.5 4.5v7"/>
    </svg>
  `,
};

export const equipmentCatalog = [
  {
    id: 'beaker',
    name: '燒杯',
    category: 'glassware',
    description: '一般液體容器',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M31 25h58l-5 67a7 7 0 0 1-7 6H43a7 7 0 0 1-7-6z"/>
      <path d="M31 25h58M36 70h49"/>
      <path stroke="${accent}" stroke-width="8" d="M38 67h45"/>
      <path d="M47 39h17M47 48h10"/>
    `),
  },
  {
    id: 'erlenmeyer-flask',
    name: '錐形瓶',
    category: 'glassware',
    description: '錐形反應瓶',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M48 18h24v28l20 48a7 7 0 0 1-6 10H34a7 7 0 0 1-6-10l20-48z"/>
      <path d="M48 18h24M45 38h30M37 76h46"/>
      <path stroke="${accent}" stroke-width="8" d="M40 72h40"/>
    `),
  },
  {
    id: 'round-bottom-flask',
    name: '圓底燒瓶',
    category: 'glassware',
    description: '圓底反應瓶',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M50 17h20v31c0 5 21 16 21 33a31 31 0 1 1-62 0c0-17 21-28 21-33z"/>
      <path d="M50 17h20M46 42h28"/>
      <path stroke="${accent}" stroke-width="8" d="M39 78c7 6 35 6 42 0"/>
    `),
  },
  {
    id: 'test-tube',
    name: '試管',
    category: 'glassware',
    description: '小型反應容器',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M45 18h30v61a15 15 0 0 1-30 0z"/>
      <path d="M45 18h30M45 64h30"/>
      <path stroke="${accent}" stroke-width="8" d="M49 62h22"/>
    `),
  },
  {
    id: 'funnel',
    name: '漏斗',
    category: 'glassware',
    description: '液體轉移用',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M22 24h76L68 57v38H52V57z"/>
      <path d="M22 24h76M52 57h16M52 95h16"/>
      <path stroke="${accent}" stroke-width="8" d="M53 60h14"/>
    `),
  },
  {
    id: 'graduated-cylinder',
    name: '量筒',
    category: 'glassware',
    description: '量測液體體積',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M43 16h34v77a5 5 0 0 1-5 5H48a5 5 0 0 1-5-5z"/>
      <path d="M43 16h34M49 32h10M49 43h10M49 54h10M49 65h10"/>
      <path stroke="${accent}" stroke-width="8" d="M47 77h26"/>
      <path d="M36 98h48"/>
    `),
  },
  {
    id: 'retort-stand',
    name: '鐵架台',
    category: 'support',
    description: '固定支撐器材',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M23 94h74l-7 10H30z"/>
      <path d="M46 94V17M40 17h12M35 31h40M35 31v14M75 31v14M27 104h66"/>
      <circle cx="54" cy="48" r="7" fill="${accent}"/>
    `),
  },
  {
    id: 'iron-ring',
    name: '鐵環',
    category: 'support',
    description: '環形支撐配件',
    svg: equipmentSvg(`
      <circle cx="59" cy="53" r="27" fill="${muted}"/>
      <circle cx="59" cy="53" r="16" fill="#fff"/>
      <path d="M59 80v22M46 102h26"/>
      <path stroke="${accent}" stroke-width="7" d="M42 53h34"/>
    `),
  },
  {
    id: 'tripod',
    name: '三腳架',
    category: 'support',
    description: '加熱支撐架',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M28 35h64l-8 13H36z"/>
      <path d="M36 48 23 101M84 48l13 53M60 48v53M22 101h10M88 101h10M55 101h10"/>
      <path stroke="${accent}" stroke-width="7" d="M36 41h48"/>
    `),
  },
  {
    id: 'alcohol-lamp',
    name: '酒精燈',
    category: 'heating',
    description: '低溫加熱器材',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M37 46h46v43a9 9 0 0 1-9 9H46a9 9 0 0 1-9-9z"/>
      <path d="M45 46h30M50 35h20v11H50zM60 35V25"/>
      <path fill="${accent}" d="M60 25c-8-8 5-12 0-20 14 9 6 18 0 20z"/>
      <path d="M37 76h46"/>
    `),
  },
  {
    id: 'thermometer',
    name: '溫度計',
    category: 'accessories',
    description: '量測溫度',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M54 23a8 8 0 0 1 16 0v47a18 18 0 1 1-16 0z"/>
      <path stroke="${accent}" stroke-width="8" d="M62 49v29"/>
      <circle cx="62" cy="88" r="10" fill="${accent}"/>
      <path d="M75 35h9M75 47h9M75 59h9"/>
    `),
  },
  {
    id: 'stirring-rod',
    name: '攪拌棒',
    category: 'accessories',
    description: '攪拌液體用',
    svg: equipmentSvg(`
      <path stroke="${accent}" stroke-width="8" d="m35 91 48-62"/>
      <path d="m31 95 8-8M83 29l7-8"/>
      <circle cx="34" cy="92" r="5" fill="${muted}"/>
    `),
  },
  {
    id: 'rubber-stopper',
    name: '橡皮塞',
    category: 'accessories',
    description: '容器密封配件',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M36 49h48l-7 48H43z"/>
      <path d="M36 49h48M43 97h34"/>
      <path stroke="${accent}" stroke-width="8" d="M43 58h34"/>
    `),
  },
];

export const getEquipmentById = (id) => equipmentCatalog.find((item) => item.id === id);
