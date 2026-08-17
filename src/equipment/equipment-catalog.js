import { getEquipmentGeometry } from './equipment-geometry.js';
import { apparatusModelIds, getApparatusSvg } from './equipment-svg-models.js';

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
      <path d="M11 4h10M13 4v9L7 25a2 2 0 0 0 2 3h14a2 2 0 0 0 2-3l-6-12V4M9 22h14"/>
    </svg>
  `,
  support: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M7 27h19M12 27V5M9 5h6M12 10h12M24 10v7M18 17h9"/>
    </svg>
  `,
  heating: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="M9 16h14v9a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3zM12 16h8M14 12h4v4M16 12V8"/>
      <path d="M16 8c-4-3 2-5 0-7 6 4 2 7 0 7z"/>
    </svg>
  `,
  accessories: `
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path d="m7 25 14-18M5 27l5-5M20 8l5-5M20 22h7M23.5 18.5v7M6 8h8M10 4v8"/>
    </svg>
  `,
};

const definitions = [
  ['beaker', '燒杯', 'glassware', '一般液體容器'],
  ['erlenmeyer-flask', '錐形瓶', 'glassware', '錐形反應瓶'],
  ['round-bottom-flask', '圓底燒瓶', 'glassware', '圓底反應瓶'],
  ['test-tube', '試管', 'glassware', '小型反應容器'],
  ['funnel', '漏斗', 'glassware', '液體轉移用'],
  ['graduated-cylinder', '量筒', 'glassware', '量測液體體積'],
  ['retort-stand', '鐵架台', 'support', '固定支撐器材'],
  ['iron-ring', '鐵環', 'support', '環形支撐配件'],
  ['tripod', '三腳架', 'support', '加熱支撐架'],
  ['alcohol-lamp', '酒精燈', 'heating', '低溫加熱器材'],
  ['thermometer', '溫度計', 'accessories', '量測溫度'],
  ['stirring-rod', '攪拌棒', 'accessories', '攪拌液體用'],
  ['rubber-stopper', '橡皮塞', 'accessories', '容器密封配件'],
  ['flat-bottom-flask', '平底燒瓶', 'glassware', '平底反應瓶'],
  ['volumetric-flask', '容量瓶', 'glassware', '精確定容容器'],
  ['filter-flask', '抽濾瓶', 'glassware', '減壓過濾容器，側管可接軟管'],
  ['test-tube-rack', '試管架', 'glassware', '試管收納架'],
  ['u-tube', 'U 型管', 'glassware', '連通與氣體實驗用管'],
  ['condenser', '冷凝管', 'glassware', '蒸餾冷凝器材'],
  ['long-neck-funnel', '長頸漏斗', 'glassware', '液體導入漏斗'],
  ['dropping-funnel', '滴液漏斗', 'glassware', '控制滴加速度'],
  ['separatory-funnel', '分液漏斗', 'glassware', '液液分離器材'],
  ['dropper', '滴管', 'glassware', '少量液體轉移'],
  ['pipette', '移液管', 'glassware', '精確移取液體'],
  ['volumetric-pipette', '容量吸管', 'glassware', '定量移液器材'],
  ['reagent-bottle', '試劑瓶', 'glassware', '液體試劑儲存'],
  ['wide-mouth-bottle', '廣口瓶', 'glassware', '固體試劑儲存'],
  ['wash-bottle', '洗瓶', 'glassware', '蒸餾水沖洗器材'],
  ['petri-dish', '培養皿', 'glassware', '培養與觀察樣品'],
  ['evaporating-dish', '蒸發皿', 'glassware', '蒸發濃縮液體'],
  ['watch-glass', '時計皿', 'glassware', '覆蓋與少量蒸發'],
  ['surface-dish', '表面皿', 'glassware', '樣品承載器皿'],
  ['crystallizing-dish', '結晶皿', 'glassware', '溶液結晶器皿'],
  ['universal-clamp', '萬用夾', 'support', '多用途固定夾'],
  ['flask-clamp', '燒瓶夾', 'support', '固定燒瓶'],
  ['test-tube-holder', '試管夾', 'support', '夾持試管'],
  ['crucible-tongs', '坩堝鉗', 'support', '夾取高溫坩堝'],
  ['bunsen-burner', '本生燈', 'heating', '高溫氣體加熱器材'],
  ['asbestos-mesh', '石棉網', 'heating', '均勻分散熱量'],
  ['wooden-stopper', '木塞', 'accessories', '容器密封配件'],
  ['glass-tubing', '玻璃導管', 'accessories', '硬質導氣管'],
  ['rubber-tubing', '橡膠軟管', 'accessories', '柔性連接管', 'hose'],
  ['water-tank', '水箱', 'accessories', '水流實驗容器'],
  ['aspirator', '水流抽氣器', 'accessories', '水流產生真空'],
  ['water-delivery-tube', '導水管', 'accessories', '水下導管', 'hose'],
  ['gas-delivery-tube', '導氣管', 'accessories', '氣體導管', 'hose'],
  ['gas-jar', '集氣瓶', 'accessories', '收集氣體'],
  ['pneumatic-trough', '集氣槽', 'accessories', '排水集氣槽'],
  ['test-tube-brush', '試管刷', 'accessories', '清潔試管'],
  ['spatula', '藥匙', 'accessories', '取用固體藥品'],
  ['tweezers', '鑷子', 'accessories', '夾取細小樣品'],
  ['electronic-balance', '電子天平', 'accessories', '量測樣品質量'],
];

const definitionIds = definitions.map(([id]) => id);
const hoseStyles = {
  'water-delivery-tube': { color: '#78b9c8', strokeWidth: 8 },
  'gas-delivery-tube': { color: '#667078', strokeWidth: 7 },
};
const missingModelIds = definitionIds.filter((id) => !apparatusModelIds.includes(id));
const unusedModelIds = apparatusModelIds.filter((id) => !definitionIds.includes(id));

if (missingModelIds.length || unusedModelIds.length) {
  throw new Error(`Equipment catalog/model mismatch. Missing: ${missingModelIds.join(', ') || 'none'}; unused: ${unusedModelIds.join(', ') || 'none'}`);
}

export const equipmentCatalog = definitions.map(([
  id,
  name,
  category,
  description,
  equipmentType = id,
]) => ({
  id,
  name,
  category,
  description,
  equipmentType,
  hoseStyle: hoseStyles[id],
  ...getEquipmentGeometry(id),
  svg: getApparatusSvg(id),
}));

export const getEquipmentById = (id) => equipmentCatalog.find((item) => item.id === id);
