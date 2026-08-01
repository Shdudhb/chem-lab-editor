# Chem Lab Editor

Chem Lab Editor 是一個以 HTML、CSS 與原生 JavaScript ES Modules 製作的化學實驗示意圖編輯器。它專注於教材與實驗配置圖，不進行物理模擬。

## 開始使用

```bash
npm install
npm run dev
```

開發伺服器預設監聽 `0.0.0.0:4173`，因此可以從同一個 Tailscale 網路使用主機的 Tailscale IP 開啟。

## 功能

- Infinite Canvas：格線、平移、縮放與物件選取
- SVG 器材庫：搜尋、分類、點擊放置與拖曳放置
- 器材管理：收藏、最近使用與自訂 SVG 器材
- 器材吸附：上下／左右接點預覽與自動對位
- Bezier 橡膠軟管：控制點、端點吸附與自動更新
- 液體屬性：多層液體、液面高度、顏色與透明度
- 標註工具：文字、箭頭、自由線、線段、矩形、圓形與編號
- 圖層管理：搜尋、重新命名、隱藏、鎖定、排序與群組變形
- 場景檔案：儲存／開啟 JSON，並支援瀏覽器本機自動保存
- 儲存介面：內建 localStorage，另提供可插拔 HTTP 儲存 adapter
- 匯出：SVG、PNG、JPG、JSON，支援透明背景與 1x／2x／4x

## 建置與預覽

```bash
npm run build
npm run preview
```

若要接上雲端場景服務，可在啟動前設定 `VITE_SCENE_STORAGE_URL`。介面會以 `PUT` 儲存、`GET` 讀取、`DELETE` 清除 JSON 場景；未設定時則使用瀏覽器 `localStorage`。

## 技術選擇

專案使用 Vite 作為開發伺服器與建置工具，因為它提供快速的原生 ES Modules 開發流程與輕量的 production build。編輯器本身使用瀏覽器原生 DOM、SVG、Canvas API 與 Pointer Events，避免引入付費素材或不必要的執行期依賴。

## 專案結構

```text
src/
  canvas/
    canvas-controller.js
    scene-store.js
    snap-system.js
  equipment/
    equipment-catalog.js
    equipment-user-store.js
  export/
    exporter.js
  storage/
    scene-storage.js
  main.js
  styles.css
```

## 待辦事項

尚未補齊的規格與後續優化請參考 [docs/TODO.md](docs/TODO.md)。
