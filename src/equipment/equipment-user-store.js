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

export const createEquipmentUserStore = (storage = globalThis.localStorage) => {
  const api = safeStorage(storage);
  let state = { favorites: [], recent: [], custom: [] };
  try {
    const parsed = JSON.parse(api.getItem(STORAGE_KEY) ?? '{}');
    state = {
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      recent: Array.isArray(parsed.recent) ? parsed.recent : [],
      custom: Array.isArray(parsed.custom) ? parsed.custom : [],
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
      const custom = { ...item, id: item.id ?? makeId(), category: 'custom' };
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

