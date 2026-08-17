import { getEquipmentGeometry } from './equipment-geometry.js';

// Chemix-inspired apparatus palette: dark line art and translucent glass.
// Liquid color is kept for the editor's optional liquid-layer controls only;
// catalog apparatus start empty and never render a filled liquid by default.
const stroke = '#3f5149';
const detail = '#71817a';
const accent = '#78b6a3';
const liquid = '#b7dfe7';
const muted = '#f4faf8';
const heat = '#f0a565';
const hose = '#8b654d';

const equipmentSvg = (content) => `
  <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">
    <g fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      ${content.replace(new RegExp(`<(?:path|circle|ellipse|rect)\\b[^>]*\\sfill="${liquid}"[^>]*/>`, 'g'), '')}
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
  flask: `<path fill="${muted}" fill-opacity=".55" d="M48 17h24v30l18 42a9 9 0 0 1-8 13H38a9 9 0 0 1-8-13l18-42z"/><path d="M48 17h24"/><path fill="${liquid}" fill-opacity=".72" stroke="none" d="M36 74h48l4 14a8 8 0 0 1-8 10H40a8 8 0 0 1-8-10z"/>`,
  bottle: `<path fill="${muted}" fill-opacity=".55" d="M43 24h34v15l8 8v43a9 9 0 0 1-9 9H44a9 9 0 0 1-9-9V47l8-8z"/><path d="M43 24h34M43 39h34"/><path fill="${liquid}" fill-opacity=".72" stroke="none" d="M36 68h48v20a7 7 0 0 1-7 7H43a7 7 0 0 1-7-7z"/>`,
  funnel: `<path fill="${muted}" fill-opacity=".45" d="M20 24h80L68 58v37H52V58z"/><path d="M20 24h80M52 58h16M52 95h16"/><path fill="${liquid}" stroke="none" d="M53 60h14v8H53z"/>`,
  longFunnel: `<path fill="${muted}" fill-opacity=".45" d="M20 22h80L68 55v48H52V55z"/><path d="M20 22h80M52 55h16M52 103h16M41 31h38"/>`,
  droppingFunnel: `<path fill="${muted}" fill-opacity=".45" d="M32 22h56l-8 29v28H40V51z"/><path d="M32 22h56M40 51h40M52 79v24h16V79"/><circle cx="60" cy="91" r="3" fill="${accent}"/>`,
  separatoryFunnel: `<path fill="${muted}" fill-opacity=".45" d="M43 20h34v17c0 8 15 13 15 29a32 32 0 1 1-64 0c0-16 15-21 15-29z"/><path d="M43 20h34M40 37h40M52 95h16M52 95v10h16V95"/><path fill="${liquid}" fill-opacity=".7" stroke="none" d="M36 70h48c-3 13-13 20-24 20S39 83 36 70z"/>`,
  tube: `<path fill="${muted}" fill-opacity=".5" d="M46 18h28v61a14 14 0 0 1-28 0z"/><path d="M46 18h28"/><path fill="${liquid}" fill-opacity=".75" stroke="none" d="M48 62h24v16a12 12 0 0 1-24 0z"/>`,
  dropper: `<path fill="${muted}" fill-opacity=".4" d="M51 23h18v57a9 9 0 0 1-18 0z"/><path d="M51 23h18M54 18h12M54 18v5M66 18v5"/><path fill="${accent}" stroke="none" d="M52 13q8-7 16 0l-2 7H54z"/>`,
  pipette: `<path fill="${muted}" fill-opacity=".4" d="M55 18h10v68l-5 13-5-13z"/><path d="M55 18h10M57 18v-5h6v5M55 30h10M57 84h6"/>`,
  volumetricPipette: `<path fill="${muted}" fill-opacity=".4" d="M56 17h8v37c0 7 8 10 8 18v22H48V72c0-8 8-11 8-18z"/><path d="M56 17h8M53 51h14M56 17v-5h8v5"/>`,
  dish: `<path fill="${muted}" fill-opacity=".5" d="M22 61q38 26 76 0-5 34-38 34T22 61z"/><ellipse cx="60" cy="61" rx="38" ry="13"/><path fill="${liquid}" fill-opacity=".7" stroke="none" d="M34 61q26 9 52 0v5q-26 11-52 0z"/>`,
  petriDish: `<ellipse cx="60" cy="57" rx="38" ry="13" fill="${muted}" fill-opacity=".5"/><path d="M22 57q38 25 76 0M22 57v9q38 26 76 0v-9"/><path fill="${liquid}" fill-opacity=".65" stroke="none" d="M26 64q34 20 68 0v5q-34 20-68 0z"/>`,
  evaporatingDish: `<path fill="${muted}" fill-opacity=".5" d="M22 59q38 30 76 0-5 33-38 33T22 59z"/><ellipse cx="60" cy="59" rx="38" ry="13"/><path fill="${liquid}" fill-opacity=".7" stroke="none" d="M35 59q25 9 50 0v5q-25 10-50 0z"/>`,
  watchGlass: `<path fill="${muted}" fill-opacity=".45" d="M19 62q41-22 82 0-41 20-82 0z"/><path d="M19 62q41-22 82 0M25 66q35 16 70 0"/>`,
  surfaceDish: `<path fill="${muted}" fill-opacity=".45" d="M18 55q42-18 84 0-42 18-84 0z"/><path d="M18 55q42-18 84 0M25 59q35 14 70 0"/><path fill="${liquid}" fill-opacity=".65" stroke="none" d="M28 55q32-11 64 0-32 11-64 0z"/>`,
  crystallizingDish: `<path fill="${muted}" fill-opacity=".45" d="M22 45h76l-8 38a7 7 0 0 1-7 6H37a7 7 0 0 1-7-6z"/><path d="M22 45h76"/><path fill="${liquid}" fill-opacity=".65" stroke="none" d="M30 75h60l-2 9a6 6 0 0 1-6 5H38a6 6 0 0 1-6-5z"/>`,
  rack: `<path fill="${muted}" fill-opacity=".38" d="M20 38h80v51H20z"/><path d="M20 53h80M29 38v51M45 38v51M61 38v51M77 38v51M93 38v51M20 89h80"/><path fill="${liquid}" fill-opacity=".65" stroke="none" d="M29 53h10v27H29zM45 53h10v27H45zM61 53h10v27H61zM77 53h10v27H77z"/>`,
  uTube: `<path d="M35 20v54a25 25 0 0 0 50 0V20M35 20h12M73 20h12"/><path fill="${liquid}" fill-opacity=".72" stroke="none" d="M43 52h8v22a9 9 0 0 0 18 0V52h8v22a17 17 0 0 1-34 0z"/>`,
  condenser: `<path fill="${muted}" fill-opacity=".42" stroke="none" d="M43 18h34v84H43z"/><path d="M43 18h34M43 102h34M48 18v84M72 18v84M55 10v100M65 10v100M43 38H29v-9M77 82h14v9"/>`,
  support: `<path fill="${muted}" fill-opacity=".55" d="M24 94h72l-7 10H31z"/><path d="M48 94V18M42 18h12M34 34h55M34 34v15M89 34v15"/><circle cx="57" cy="52" r="7" fill="${accent}"/>`,
  universalClamp: `<path d="M22 55h27M71 55h27M72 55l20-19M72 55l20 19"/><path fill="${muted}" d="M49 43h22v24H49z"/><circle cx="60" cy="55" r="8" fill="#fff"/><path d="M49 43q-8 12 0 24M71 43q8 12 0 24"/>`,
  clamp: `<path d="M21 55h25M75 55l22-20M75 55l22 20"/><path fill="${muted}" d="M46 42h29v26H46z"/><circle cx="60" cy="55" r="9" fill="#fff"/><path d="M46 42q-8 13 0 26M75 42q8 13 0 26"/>`,
  testTubeHolder: `<path d="M22 55h32M65 55l28-18M65 55l28 18"/><path fill="${muted}" d="M51 45h18v20H51z"/><path d="M51 45q-7 10 0 20M69 45q7 10 0 20"/>`,
  crucibleTongs: `<path d="m26 93 35-38 34 38M61 55V31M50 31h22M57 25h8"/><circle cx="61" cy="55" r="8" fill="${muted}"/>`,
  burner: `<path fill="${muted}" fill-opacity=".55" d="M35 48h50v43a9 9 0 0 1-9 9H44a9 9 0 0 1-9-9z"/><path d="M44 48h32M50 35h20v13H50zM60 35V24"/><path fill="${heat}" stroke="none" d="M60 24c-9-9 5-12 0-22 14 10 7 19 0 22z"/>`,
  mesh: `<path fill="${muted}" fill-opacity=".45" d="M23 42h74l-8 12H31z"/><path d="M31 54 23 98M89 54l8 44M39 42l-8 12M52 42l-8 12M65 42l-8 12M78 42l-8 12M91 42l-8 12M31 50h58"/>`,
  stopper: `<path fill="${muted}" fill-opacity=".6" d="M37 46h46l-6 49H43z"/><path d="M37 46h46M43 95h34M42 57h36M45 68h30M46 79h28"/>`,
  woodenStopper: `<path fill="#e7c89c" fill-opacity=".7" d="M37 46h46l-6 49H43z"/><path d="M37 46h46M43 95h34M43 58l34 7M42 70l34 7M41 82l34 7"/>`,
  rod: `<path stroke="${detail}" stroke-width="4" d="m35 92 50-65"/><path stroke="${stroke}" d="m31 96 8-8M85 27l7-7"/>`,
  glassTube: `<path stroke="${detail}" stroke-width="4" d="m31 94 56-70"/><path d="m27 98 8-8M87 24l7-7"/>`,
  hose: `<path stroke="${hose}" stroke-width="5" d="M24 84C38 22 82 100 98 34"/><circle cx="24" cy="84" r="6" fill="${muted}"/><circle cx="98" cy="34" r="6" fill="${muted}"/>`,
  waterHose: `<path stroke="#6e9ca5" stroke-width="5" d="M24 84C38 22 82 100 98 34"/><circle cx="24" cy="84" r="6" fill="${muted}"/><circle cx="98" cy="34" r="6" fill="${muted}"/>`,
  gasHose: `<path stroke="${hose}" stroke-width="5" d="M24 84C38 22 82 100 98 34" stroke-dasharray="7 4"/><circle cx="24" cy="84" r="6" fill="${muted}"/><circle cx="98" cy="34" r="6" fill="${muted}"/>`,
  wideMouthBottle: `<path fill="${muted}" fill-opacity=".5" stroke="none" d="M35 35h50v57a8 8 0 0 1-8 8H43a8 8 0 0 1-8-8z"/><path d="M35 35h50M40 23h40v12H40M35 92a8 8 0 0 0 8 8h34a8 8 0 0 0 8-8V35"/>`,
  washBottle: `<path fill="${muted}" fill-opacity=".5" stroke="none" d="M36 39h48v53a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8z"/><path d="M36 39h48v53a8 8 0 0 1-8 8H44a8 8 0 0 1-8-8zM45 28h30v11H45M55 28V17h18q10 0 16 9l8 12M63 39v43"/>`,
  waterTank: `<path fill="${muted}" fill-opacity=".45" stroke="none" d="M23 36h74l-8 61H31z"/><path d="M18 36h84M23 36l8 61h58l8-61M31 88h58"/>`,
  gasJar: `<path fill="${muted}" fill-opacity=".5" stroke="none" d="M37 24h46v68a8 8 0 0 1-8 8H45a8 8 0 0 1-8-8z"/><path d="M34 24h52M37 24v68a8 8 0 0 0 8 8h30a8 8 0 0 0 8-8V24"/>`,
  aspirator: `<path fill="${muted}" fill-opacity=".45" stroke="none" d="M52 18h16v30l11 10v13H68v31H52V71H41V58l11-10z"/><path d="M52 18h16v30l11 10h20M79 71H68v31H52V71H41V58l11-10V18M45 58h30M45 71h30"/>`,
  pneumaticTrough: `<path fill="${muted}" fill-opacity=".5" d="M21 45h78l-8 47H29z"/><path d="M21 45h78M37 45v28M52 45v28M67 45v28M82 45v28"/><path fill="${liquid}" fill-opacity=".7" stroke="none" d="M29 73h62l-2 12H31z"/>`,
  brush: `<path stroke="${detail}" stroke-width="4" d="M29 93 84 25"/><path d="M24 98 36 86M78 24l13-9M72 35l13 8M67 44l13 8M62 53l13 8"/>`,
  spatula: `<path stroke="${detail}" stroke-width="4" d="m30 94 48-63"/><path fill="${muted}" d="m75 26 13-7 5 4-7 13z"/><path d="m31 97 7-8"/>`,
  tweezers: `<path d="M29 24 60 82 91 24M60 82v20"/><path fill="${muted}" d="M54 22h12v8H54z"/>`,
  balance: `<path fill="${muted}" fill-opacity=".5" d="M35 78h50v20H35z"/><path d="M60 78V25M42 35h36M30 52h24M66 52h24M22 56 12 75h30zM58 56 48 75h30z"/><path stroke="${detail}" d="M27 56h30M63 56h30"/>`,
};

const makeEquipment = (id, name, category, description, kind, visualKind = kind) => ({
  id,
  name,
  category,
  description,
  equipmentType: kind,
  ...getEquipmentGeometry(id),
  svg: equipmentSvg(genericEquipmentContents[visualKind] ?? genericEquipmentContents.tube),
});

const extraEquipment = [
  {
    id: 'flat-bottom-flask',
    name: '平底燒瓶',
    category: 'glassware',
    description: '平底反應瓶',
    equipmentType: 'flat-bottom-flask',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" stroke="none" d="M48 16h24v31l17 39v10H31V86l17-39z"/>
      <path d="M48 16c4 2 5 4 5 8v23L31 86v3a7 7 0 0 0 7 7h44a7 7 0 0 0 7-7v-3L67 47V24c0-4 1-6 5-8"/>
      <path stroke="${detail}" stroke-width="1.5" d="M68 53h7M71 63h7M74 73h7"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M34 75h52l3 12q1 9-8 9H39q-9 0-8-9z"/>
    `),
  },
  {
    id: 'volumetric-flask',
    name: '容量瓶',
    category: 'glassware',
    description: '精確定容容器',
    equipmentType: 'volumetric-flask',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" stroke="none" d="M51 16h18v30c0 6 21 16 25 32 4 18-10 30-34 30S26 96 30 78c4-16 25-26 25-32V16z"/>
      <path d="M51 16c4 2 5 4 5 8v22c0 6-21 16-25 32-4 18 10 30 29 30s33-12 29-30c-4-16-25-26-25-32V24c0-4 1-6 5-8"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M36 72q4 20 24 26 20-6 24-26 4 7 4 13 0 17-28 17T32 85q0-6 4-13z"/>
    `),
  },
  {
    id: 'filter-flask',
    name: '抽濾瓶',
    category: 'glassware',
    description: '減壓過濾容器，側管可接軟管',
    equipmentType: 'filter-flask',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" stroke="none" d="M47 16h26v30l17 40v10H30V86l17-40z"/>
      <path d="M47 16c4 2 5 4 5 8v22L30 86v3a7 7 0 0 0 7 7h46a7 7 0 0 0 7-7v-3L73 46V24c0-4 1-6 5-8"/>
      <path d="M73 31h28M73 39h28"/>
      <path stroke="${detail}" stroke-width="1.5" d="M68 53h8M71 63h8M75 73h7"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M34 75h47l3 12q1 9-8 9H39q-9 0-8-9z"/>
    `),
  },
  makeEquipment('test-tube-rack', '試管架', 'glassware', '試管收納架', 'rack'),
  makeEquipment('u-tube', 'U 型管', 'glassware', '連通與氣體實驗用管', 'uTube'),
  makeEquipment('condenser', '冷凝管', 'glassware', '蒸餾冷凝器材', 'condenser'),
  makeEquipment('long-neck-funnel', '長頸漏斗', 'glassware', '液體導入漏斗', 'funnel', 'longFunnel'),
  makeEquipment('dropping-funnel', '滴液漏斗', 'glassware', '控制滴加速度', 'funnel', 'droppingFunnel'),
  makeEquipment('separatory-funnel', '分液漏斗', 'glassware', '液液分離器材', 'funnel', 'separatoryFunnel'),
  makeEquipment('dropper', '滴管', 'glassware', '少量液體轉移', 'tube', 'dropper'),
  makeEquipment('pipette', '移液管', 'glassware', '精確移取液體', 'tube', 'pipette'),
  makeEquipment('volumetric-pipette', '容量吸管', 'glassware', '定量移液器材', 'tube', 'volumetricPipette'),
  makeEquipment('reagent-bottle', '試劑瓶', 'glassware', '液體試劑儲存', 'bottle'),
  makeEquipment('wide-mouth-bottle', '廣口瓶', 'glassware', '固體試劑儲存', 'bottle', 'wideMouthBottle'),
  makeEquipment('wash-bottle', '洗瓶', 'glassware', '蒸餾水沖洗器材', 'bottle', 'washBottle'),
  makeEquipment('petri-dish', '培養皿', 'glassware', '培養與觀察樣品', 'dish', 'petriDish'),
  makeEquipment('evaporating-dish', '蒸發皿', 'glassware', '蒸發濃縮液體', 'dish', 'evaporatingDish'),
  makeEquipment('watch-glass', '時計皿', 'glassware', '覆蓋與少量蒸發', 'dish', 'watchGlass'),
  makeEquipment('surface-dish', '表面皿', 'glassware', '樣品承載器皿', 'dish', 'surfaceDish'),
  makeEquipment('crystallizing-dish', '結晶皿', 'glassware', '溶液結晶器皿', 'dish', 'crystallizingDish'),
  makeEquipment('universal-clamp', '萬用夾', 'support', '多用途固定夾', 'clamp', 'universalClamp'),
  makeEquipment('flask-clamp', '燒瓶夾', 'support', '固定燒瓶', 'clamp', 'clamp'),
  makeEquipment('test-tube-holder', '試管夾', 'support', '夾持試管', 'clamp', 'testTubeHolder'),
  makeEquipment('crucible-tongs', '坩堝鉗', 'support', '夾取高溫坩堝', 'clamp', 'crucibleTongs'),
  makeEquipment('bunsen-burner', '本生燈', 'heating', '高溫氣體加熱器材', 'burner'),
  makeEquipment('asbestos-mesh', '石棉網', 'heating', '均勻分散熱量', 'mesh'),
  makeEquipment('wooden-stopper', '木塞', 'accessories', '容器密封配件', 'stopper', 'woodenStopper'),
  makeEquipment('glass-tubing', '玻璃導管', 'accessories', '硬質導氣管', 'rod', 'glassTube'),
  makeEquipment('rubber-tubing', '橡膠軟管', 'accessories', '柔性連接管', 'hose', 'hose'),
  makeEquipment('water-tank', '水箱', 'accessories', '水流實驗容器', 'bottle', 'waterTank'),
  makeEquipment('aspirator', '水流抽氣器', 'accessories', '水流產生真空', 'funnel', 'aspirator'),
  makeEquipment('water-delivery-tube', '導水管', 'accessories', '水下導管', 'hose', 'waterHose'),
  makeEquipment('gas-delivery-tube', '導氣管', 'accessories', '氣體導管', 'hose', 'gasHose'),
  makeEquipment('gas-jar', '集氣瓶', 'accessories', '收集氣體', 'jar', 'gasJar'),
  makeEquipment('pneumatic-trough', '集氣槽', 'accessories', '排水集氣槽', 'bottle', 'pneumaticTrough'),
  makeEquipment('test-tube-brush', '試管刷', 'accessories', '清潔試管', 'rod', 'brush'),
  makeEquipment('spatula', '藥匙', 'accessories', '取用固體藥品', 'rod', 'spatula'),
  makeEquipment('tweezers', '鑷子', 'accessories', '夾取細小樣品', 'clamp', 'tweezers'),
  makeEquipment('electronic-balance', '電子天平', 'accessories', '量測樣品質量', 'balance'),
];

export const equipmentCatalog = [
  {
    id: 'beaker',
    name: '燒杯',
    category: 'glassware',
    description: '一般液體容器',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" stroke="none" d="M31 25h58l-5 67a7 7 0 0 1-7 6H43a7 7 0 0 1-7-6z"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M36 68h49l-2 21a7 7 0 0 1-7 7H44a7 7 0 0 1-7-7z"/>
      <path d="M31 25h58l-5 67a7 7 0 0 1-7 6H43a7 7 0 0 1-7-6z"/>
      <path stroke="${detail}" stroke-width="1.5" d="M75 39h9M76 48h8M77 57h7"/>
    `),
  },
  {
    id: 'erlenmeyer-flask',
    name: '錐形瓶',
    category: 'glassware',
    description: '錐形反應瓶',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" stroke="none" d="M48 18h24v28l20 48a7 7 0 0 1-6 10H34a7 7 0 0 1-6-10l20-48z"/>
      <path d="M48 18c4 2 5 4 5 8v22L28 94a7 7 0 0 0 6 10h52a7 7 0 0 0 6-10L67 48V26c0-4 1-6 5-8"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M36 74h48l7 17a7 7 0 0 1-7 9H36a7 7 0 0 1-7-9z"/>
      <path stroke="${detail}" stroke-width="1.5" d="M67 52h7M70 62h8M74 72h8"/>
    `),
  },
  {
    id: 'round-bottom-flask',
    name: '圓底燒瓶',
    category: 'glassware',
    description: '圓底反應瓶',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" stroke="none" d="M50 17h20v31c0 5 21 16 21 33a31 31 0 1 1-62 0c0-17 21-28 21-33z"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M33 78q27 10 54 0 3 3 3 7a28 28 0 1 1-60 0q0-4 3-7z"/>
      <path d="M50 17c3 1 4 4 4 7v24c0 5-21 16-21 33a27 27 0 1 0 54 0c0-17-21-28-21-33V24c0-3 1-6 4-7"/>
      <path stroke="${detail}" stroke-width="1.5" d="M74 53h7M77 63h7M79 73h7"/>
    `),
  },
  {
    id: 'test-tube',
    name: '試管',
    category: 'glassware',
    description: '小型反應容器',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".5" stroke="none" d="M45 18h30v61a15 15 0 0 1-30 0z"/>
      <path fill="${liquid}" fill-opacity=".75" stroke="none" d="M48 63h24v16a12 12 0 0 1-24 0z"/>
      <path d="M45 18v61a15 15 0 0 0 30 0V18"/>
    `),
  },
  {
    id: 'funnel',
    name: '漏斗',
    category: 'glassware',
    description: '液體轉移用',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".45" d="M22 24h76L68 57v38H52V57z"/>
      <path d="M22 24h76M52 57h16M52 95h16"/>
      <path fill="${liquid}" stroke="none" d="M53 60h14v8H53z"/>
      <path d="M53 60h14"/>
    `),
  },
  {
    id: 'graduated-cylinder',
    name: '量筒',
    category: 'glassware',
    description: '量測液體體積',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".5" d="M43 16h34v77a5 5 0 0 1-5 5H48a5 5 0 0 1-5-5z"/>
      <path fill="${liquid}" fill-opacity=".72" stroke="none" d="M47 76h26v14a4 4 0 0 1-4 4H51a4 4 0 0 1-4-4z"/>
      <path d="M43 16h34M49 32h10M49 43h10M49 54h10M49 65h10M36 98h48"/>
    `),
  },
  {
    id: 'retort-stand',
    name: '鐵架台',
    category: 'support',
    description: '固定支撐器材',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" d="M23 94h74l-7 10H30z"/>
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
      <circle cx="59" cy="53" r="27" fill="${muted}" fill-opacity=".4"/>
      <circle cx="59" cy="53" r="16" fill="#fff"/>
      <path d="M59 80v22M46 102h26"/>
      <path d="M42 53h34"/>
    `),
  },
  {
    id: 'tripod',
    name: '三腳架',
    category: 'support',
    description: '加熱支撐架',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".45" d="M28 35h64l-8 13H36z"/>
      <path d="M36 48 23 101M84 48l13 53M60 48v53M22 101h10M88 101h10M55 101h10M36 41h48"/>
    `),
  },
  {
    id: 'alcohol-lamp',
    name: '酒精燈',
    category: 'heating',
    description: '低溫加熱器材',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".55" d="M37 46h46v43a9 9 0 0 1-9 9H46a9 9 0 0 1-9-9z"/>
      <path d="M45 46h30M50 35h20v11H50zM60 35V25"/>
      <path fill="${heat}" stroke="none" d="M60 25c-8-8 5-12 0-20 14 9 6 18 0 20z"/>
      <path d="M37 76h46"/>
    `),
  },
  {
    id: 'thermometer',
    name: '溫度計',
    category: 'accessories',
    description: '量測溫度',
    svg: equipmentSvg(`
      <path fill="${muted}" fill-opacity=".5" d="M54 23a8 8 0 0 1 16 0v47a18 18 0 1 1-16 0z"/>
      <path stroke="${detail}" stroke-width="4" d="M62 49v29"/>
      <circle cx="62" cy="88" r="10" fill="${muted}"/>
      <path d="M75 35h9M75 47h9M75 59h9"/>
    `),
  },
  {
    id: 'stirring-rod',
    name: '攪拌棒',
    category: 'accessories',
    description: '攪拌液體用',
    svg: equipmentSvg(`
      <path stroke="${detail}" stroke-width="4" d="m35 91 48-62"/>
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
      <path fill="${muted}" fill-opacity=".6" d="M36 49h48l-7 48H43z"/>
      <path d="M36 49h48M43 97h34M43 59h34M45 70h30M46 81h28"/>
    `),
  },
  ...extraEquipment,
];

equipmentCatalog.forEach((item) => Object.assign(item, getEquipmentGeometry(item.id)));

export const getEquipmentById = (id) => equipmentCatalog.find((item) => item.id === id);
