// Chemix-inspired apparatus palette: soft mint glass, green outlines, and
// clean high-contrast silhouettes that remain legible on the canvas and in
// the apparatus library.
const stroke = '#4f765f';
const accent = '#71b99f';
const muted = '#e3f0ea';

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

const genericEquipmentContents = {
  flask: `<path fill="${muted}" d="M48 17h24v30l18 42a8 8 0 0 1-7 11H37a8 8 0 0 1-7-11l18-42z"/><path d="M48 17h24M43 39h34M37 78h46"/><path stroke="${accent}" stroke-width="8" d="M40 74h40"/>`,
  bottle: `<path fill="${muted}" d="M43 27h34v12l8 8v44a8 8 0 0 1-8 8H43a8 8 0 0 1-8-8V47l8-8z"/><path d="M43 27h34M43 39h34M35 69h50"/><path stroke="${accent}" stroke-width="8" d="M40 67h40"/>`,
  funnel: `<path fill="${muted}" d="M20 25h80L68 59v35H52V59z"/><path d="M20 25h80M52 59h16M52 94h16"/><path stroke="${accent}" stroke-width="8" d="M53 62h14"/>`,
  tube: `<path fill="${muted}" d="M46 18h28v61a14 14 0 0 1-28 0z"/><path d="M46 18h28M46 63h28"/><path stroke="${accent}" stroke-width="8" d="M50 61h20"/>`,
  dish: `<path fill="${muted}" d="M22 61q38 30 76 0-4 35-38 35T22 61z"/><ellipse cx="60" cy="61" rx="38" ry="13"/><path stroke="${accent}" stroke-width="7" d="M34 61h52"/>`,
  rack: `<path fill="${muted}" d="M20 36h80v54H20z"/><path d="M20 53h80M32 36v54M48 36v54M64 36v54M80 36v54"/><path fill="${accent}" d="M27 53h10v27H27zM43 53h10v27H43zM59 53h10v27H59zM75 53h10v27H75z"/>`,
  uTube: `<path d="M35 20v55a25 25 0 0 0 50 0V20"/><path fill="${muted}" d="M35 49h16v26a9 9 0 0 0 18 0V49h16v26a25 25 0 0 1-50 0z"/><path stroke="${accent}" stroke-width="7" d="M43 68a17 17 0 0 0 34 0"/>`,
  condenser: `<path fill="${muted}" d="M34 22h52v74H34z"/><path d="M34 22h52M34 96h52M48 22v74M72 22v74M25 36h9M86 36h9M25 82h9M86 82h9"/><path stroke="${accent}" stroke-width="7" d="M50 31h20v56H50z"/>`,
  support: `<path fill="${muted}" d="M24 94h72l-7 10H31z"/><path d="M48 94V18M42 18h12M34 34h55M34 34v15M89 34v15"/><circle cx="57" cy="52" r="8" fill="${accent}"/>`,
  clamp: `<circle cx="61" cy="55" r="17" fill="${muted}"/><circle cx="61" cy="55" r="8" fill="#fff"/><path d="M45 55H22M78 55l22-19M78 55l22 19"/><path stroke="${accent}" stroke-width="7" d="M22 55h18"/>`,
  burner: `<path fill="${muted}" d="M35 48h50v43a9 9 0 0 1-9 9H44a9 9 0 0 1-9-9z"/><path d="M44 48h32M50 35h20v13H50zM60 35V24"/><path fill="${accent}" d="M60 24c-9-9 6-12 0-22 15 10 7 19 0 22z"/>`,
  mesh: `<path fill="${muted}" d="M23 42h74l-8 12H31z"/><path d="M31 54 23 98M89 54l8 44M39 42l-8 12M52 42l-8 12M65 42l-8 12M78 42l-8 12M91 42l-8 12"/><path stroke="${accent}" stroke-width="5" d="M34 47h52"/>`,
  stopper: `<path fill="${muted}" d="M37 46h46l-6 49H43z"/><path d="M37 46h46M43 95h34"/><path stroke="${accent}" stroke-width="8" d="M43 57h34"/>`,
  rod: `<path stroke="${accent}" stroke-width="8" d="m35 92 50-65"/><path d="m31 96 8-8M85 27l7-8"/>`,
  hose: `<path stroke="${accent}" stroke-width="8" d="M24 84C38 22 82 100 98 34"/><circle cx="24" cy="84" r="6" fill="${muted}"/><circle cx="98" cy="34" r="6" fill="${muted}"/>`,
  jar: `<path fill="${muted}" d="M36 31h48v61a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z"/><path d="M36 31h48M44 20h32v11H44zM36 66h48"/><path stroke="${accent}" stroke-width="8" d="M41 64h38"/>`,
  balance: `<path fill="${muted}" d="M35 78h50v20H35z"/><path d="M60 78V25M42 35h36M30 52h24M66 52h24"/><path stroke="${accent}" stroke-width="7" d="M27 56h30M63 56h30"/><path d="M22 56 12 75h30zM58 56 48 75h30z"/>`,
};

const makeEquipment = (id, name, category, description, kind) => ({
  id,
  name,
  category,
  description,
  equipmentType: kind,
  svg: equipmentSvg(genericEquipmentContents[kind] ?? genericEquipmentContents.tube),
});

const extraEquipment = [
  {
    id: 'flat-bottom-flask',
    name: '平底燒瓶',
    category: 'glassware',
    description: '平底反應瓶',
    equipmentType: 'flat-bottom-flask',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M48 16h24v31l17 39v10H31V86l17-39z"/>
      <path d="M48 16h24M45 33h30M31 96h58"/>
      <path stroke="${accent}" stroke-width="8" d="M37 76h46"/>
    `),
  },
  {
    id: 'volumetric-flask',
    name: '容量瓶',
    category: 'glassware',
    description: '精確定容容器',
    equipmentType: 'volumetric-flask',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M51 16h18v30c0 6 21 16 25 32 4 18-10 30-34 30S26 96 30 78c4-16 25-26 25-32V16z"/>
      <path d="M51 16h18M48 27h24M38 70h44"/>
      <path stroke="${accent}" stroke-width="8" d="M38 76c4 15 17 23 22 23s18-8 22-23"/>
    `),
  },
  {
    id: 'filter-flask',
    name: '抽濾瓶',
    category: 'glassware',
    description: '減壓過濾容器，側管可接軟管',
    equipmentType: 'filter-flask',
    svg: equipmentSvg(`
      <path fill="${muted}" d="M47 16h26v30l17 40v10H30V86l17-40z"/>
      <path fill="${muted}" d="M78 58h31v14H78z"/>
      <path d="M47 16h26M44 33h32M30 96h60M78 58h31M78 72h31M103 58v14"/>
      <path stroke="${accent}" stroke-width="8" d="M37 76h43"/>
    `),
  },
  makeEquipment('test-tube-rack', '試管架', 'glassware', '試管收納架', 'rack'),
  makeEquipment('u-tube', 'U 型管', 'glassware', '連通與氣體實驗用管', 'uTube'),
  makeEquipment('condenser', '冷凝管', 'glassware', '蒸餾冷凝器材', 'condenser'),
  makeEquipment('long-neck-funnel', '長頸漏斗', 'glassware', '液體導入漏斗', 'funnel'),
  makeEquipment('dropping-funnel', '滴液漏斗', 'glassware', '控制滴加速度', 'funnel'),
  makeEquipment('separatory-funnel', '分液漏斗', 'glassware', '液液分離器材', 'funnel'),
  makeEquipment('dropper', '滴管', 'glassware', '少量液體轉移', 'tube'),
  makeEquipment('pipette', '移液管', 'glassware', '精確移取液體', 'tube'),
  makeEquipment('volumetric-pipette', '容量吸管', 'glassware', '定量移液器材', 'tube'),
  makeEquipment('reagent-bottle', '試劑瓶', 'glassware', '液體試劑儲存', 'bottle'),
  makeEquipment('wide-mouth-bottle', '廣口瓶', 'glassware', '固體試劑儲存', 'bottle'),
  makeEquipment('wash-bottle', '洗瓶', 'glassware', '蒸餾水沖洗器材', 'bottle'),
  makeEquipment('petri-dish', '培養皿', 'glassware', '培養與觀察樣品', 'dish'),
  makeEquipment('evaporating-dish', '蒸發皿', 'glassware', '蒸發濃縮液體', 'dish'),
  makeEquipment('watch-glass', '時計皿', 'glassware', '覆蓋與少量蒸發', 'dish'),
  makeEquipment('surface-dish', '表面皿', 'glassware', '樣品承載器皿', 'dish'),
  makeEquipment('crystallizing-dish', '結晶皿', 'glassware', '溶液結晶器皿', 'dish'),
  makeEquipment('universal-clamp', '萬用夾', 'support', '多用途固定夾', 'clamp'),
  makeEquipment('flask-clamp', '燒瓶夾', 'support', '固定燒瓶', 'clamp'),
  makeEquipment('test-tube-holder', '試管夾', 'support', '夾持試管', 'clamp'),
  makeEquipment('crucible-tongs', '坩堝鉗', 'support', '夾取高溫坩堝', 'clamp'),
  makeEquipment('bunsen-burner', '本生燈', 'heating', '高溫氣體加熱器材', 'burner'),
  makeEquipment('asbestos-mesh', '石棉網', 'heating', '均勻分散熱量', 'mesh'),
  makeEquipment('wooden-stopper', '木塞', 'accessories', '容器密封配件', 'stopper'),
  makeEquipment('glass-tubing', '玻璃導管', 'accessories', '硬質導氣管', 'rod'),
  makeEquipment('rubber-tubing', '橡膠軟管', 'accessories', '柔性連接管', 'hose'),
  makeEquipment('water-tank', '水箱', 'accessories', '水流實驗容器', 'bottle'),
  makeEquipment('aspirator', '水流抽氣器', 'accessories', '水流產生真空', 'funnel'),
  makeEquipment('water-delivery-tube', '導水管', 'accessories', '水下導管', 'hose'),
  makeEquipment('gas-delivery-tube', '導氣管', 'accessories', '氣體導管', 'hose'),
  makeEquipment('gas-jar', '集氣瓶', 'accessories', '收集氣體', 'jar'),
  makeEquipment('pneumatic-trough', '集氣槽', 'accessories', '排水集氣槽', 'bottle'),
  makeEquipment('test-tube-brush', '試管刷', 'accessories', '清潔試管', 'rod'),
  makeEquipment('spatula', '藥匙', 'accessories', '取用固體藥品', 'rod'),
  makeEquipment('tweezers', '鑷子', 'accessories', '夾取細小樣品', 'clamp'),
  makeEquipment('electronic-balance', '電子天平', 'accessories', '量測樣品質量', 'balance'),
];

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
  ...extraEquipment,
];

export const getEquipmentById = (id) => equipmentCatalog.find((item) => item.id === id);
