const SCENE_FORMAT = 'chem-lab-editor-scene';
const SCENE_VERSION = 1;

const isSceneSnapshot = (scene) => (
  scene
  && Array.isArray(scene.objects)
  && Array.isArray(scene.selectedIds)
);

export const serializeScene = (scene) => {
  if (!isSceneSnapshot(scene)) throw new Error('無效的場景資料。');
  return JSON.stringify({
    format: SCENE_FORMAT,
    version: SCENE_VERSION,
    savedAt: new Date().toISOString(),
    scene,
  }, null, 2);
};

export const parseScene = (text) => {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    throw new Error('場景 JSON 格式不正確。');
  }

  if (payload?.format !== SCENE_FORMAT || payload.version !== SCENE_VERSION || !isSceneSnapshot(payload.scene)) {
    throw new Error('這不是 Chem Lab Editor 的場景檔案。');
  }
  return payload.scene;
};

const safeStorage = (storage) => ({
  getItem: (key) => {
    try { return storage?.getItem(key) ?? null; } catch { return null; }
  },
  setItem: (key, value) => {
    try { storage?.setItem(key, value); } catch { /* storage may be unavailable */ }
  },
  removeItem: (key) => {
    try { storage?.removeItem(key); } catch { /* storage may be unavailable */ }
  },
});

export const createLocalSceneStorage = ({
  storage = globalThis.localStorage,
  key = 'chem-lab-editor.scene',
} = {}) => {
  const localStorageApi = safeStorage(storage);
  return {
    async save(scene) {
      localStorageApi.setItem(key, serializeScene(scene));
    },
    async load() {
      const text = localStorageApi.getItem(key);
      return text ? parseScene(text) : null;
    },
    async clear() {
      localStorageApi.removeItem(key);
    },
  };
};

export const createHttpSceneStorage = ({ endpoint, fetchImpl = globalThis.fetch } = {}) => {
  if (!endpoint || typeof fetchImpl !== 'function') {
    throw new Error('HTTP 場景儲存需要 endpoint 與 fetch。');
  }

  return {
    async save(scene) {
      const response = await fetchImpl(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: serializeScene(scene),
      });
      if (!response.ok) throw new Error(`雲端儲存失敗（${response.status}）。`);
    },
    async load() {
      const response = await fetchImpl(endpoint, { headers: { Accept: 'application/json' } });
      if (response.status === 404) return null;
      if (!response.ok) throw new Error(`雲端讀取失敗（${response.status}）。`);
      return parseScene(await response.text());
    },
    async clear() {
      const response = await fetchImpl(endpoint, { method: 'DELETE' });
      if (!response.ok && response.status !== 404) throw new Error(`雲端刪除失敗（${response.status}）。`);
    },
  };
};

export const createSceneStorage = (options = {}) => (
  options.endpoint
    ? createHttpSceneStorage(options)
    : createLocalSceneStorage(options)
);

