const STORAGE_KEY = 'chem-lab-editor.equipment-user-state';

const safeStorage = (storage) => ({
  getItem: (key) => {
    try { return storage?.getItem(key) ?? null; } catch { return null; }
  },
  setItem: (key, value) => {
    try { storage?.setItem(key, value); } catch { /* storage may be unavailable */ }
  },
});

const makeId = () => `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeIdList = (value) => (
  Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string' && id.length <= 200))] : []
);

const normalizeCustomEquipment = (item, sanitizeSvg) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;
  const id = typeof item.id === 'string' && item.id ? item.id.slice(0, 200) : makeId();
  const name = typeof item.name === 'string' ? item.name.trim().slice(0, 80) : '';
  const description = typeof item.description === 'string'
    ? item.description.trim().slice(0, 240)
    : '自訂實驗器材';
  if (!name || typeof item.svg !== 'string' || !item.svg.trim() || item.svg.length > 2_000_000) return null;

  try {
    return {
      id,
      name,
      description: description || '自訂實驗器材',
      svg: sanitizeSvg(item.svg),
      category: 'custom',
      equipmentType: typeof item.equipmentType === 'string' ? item.equipmentType.slice(0, 80) : undefined,
      supportsLiquid: false,
      snapPoints: [],
    };
  } catch {
    return null;
  }
};

export const createEquipmentUserStore = (
  storage = globalThis.localStorage,
  { sanitizeSvg = (svg) => svg } = {},
) => {
  const api = safeStorage(storage);
  let state = { favorites: [], recent: [], custom: [] };
  try {
    const parsed = JSON.parse(api.getItem(STORAGE_KEY) ?? '{}');
    state = {
      favorites: normalizeIdList(parsed.favorites),
      recent: normalizeIdList(parsed.recent).slice(0, 12),
      custom: Array.isArray(parsed.custom)
        ? parsed.custom.map((item) => normalizeCustomEquipment(item, sanitizeSvg)).filter(Boolean)
        : [],
    };
  } catch {
    // Ignore malformed user preferences and use an empty state.
  }

  const persist = () => api.setItem(STORAGE_KEY, JSON.stringify(state));

  return {
    get favorites() { return [...state.favorites]; },
    get recent() { return [...state.recent]; },
    get custom() { return state.custom.map((item) => ({ ...item })); },
    isFavorite(id) { return state.favorites.includes(id); },
    toggleFavorite(id) {
      state.favorites = state.favorites.includes(id)
        ? state.favorites.filter((itemId) => itemId !== id)
        : [id, ...state.favorites];
      persist();
    },
    addRecent(id) {
      state.recent = [id, ...state.recent.filter((itemId) => itemId !== id)].slice(0, 12);
      persist();
    },
    addCustom(item) {
      const custom = normalizeCustomEquipment(item, sanitizeSvg);
      if (!custom) throw new Error('自訂器材資料不完整。');
      state.custom = [custom, ...state.custom];
      persist();
      return custom;
    },
    removeCustom(id) {
      state.custom = state.custom.filter((item) => item.id !== id);
      state.favorites = state.favorites.filter((itemId) => itemId !== id);
      state.recent = state.recent.filter((itemId) => itemId !== id);
      persist();
    },
  };
};
