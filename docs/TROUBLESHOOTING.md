# 區域網路與 Tailscale 連線排查

## 啟動服務

在專案目錄執行：

```bash
npm run dev
```

Vite 會監聽 `0.0.0.0:4173`，因此不只限於本機 `localhost`。若啟動時顯示連接埠已被使用，請先停止佔用 4173 的程式；開發與預覽模式會固定使用這個埠，避免網址與 Tailscale 設定不一致。

## Tailscale

1. 確認主機與要瀏覽的裝置都登入同一個 tailnet。
2. 在主機執行 `tailscale ip -4` 取得 Tailscale IPv4。
3. 在另一台裝置開啟 `http://<Tailscale-IP>:4173/`。
4. 若無法連線，確認 `tailscale status` 中兩台裝置都是可連線狀態。

Windows 可用以下指令確認服務是否監聽：

```powershell
Get-NetTCPConnection -LocalPort 4173 -State Listen
```

若看到 Windows 防火牆提示，允許 Node.js 在目前使用的私人網路通訊。也可以建立只允許 TCP 4173 的入站規則，不需要開放其他連接埠。

## 一般區域網路

在主機執行 `ipconfig`，找到目前網路介面的 IPv4 位址，然後從同一個區域網路的裝置開啟：

```text
http://<區域網路-IP>:4173/
```

訪客 Wi-Fi、AP isolation 或 VPN 可能會阻擋裝置互相連線。可先在主機本機開啟 `http://127.0.0.1:4173/`，再逐步確認 IP、連接埠與防火牆。

## 場景檔案

場景自動保存於瀏覽器的 `localStorage`。要在不同裝置或不同瀏覽器使用同一份場景，請按「儲存場景」下載 JSON，再在另一端按「開啟場景」載入。
