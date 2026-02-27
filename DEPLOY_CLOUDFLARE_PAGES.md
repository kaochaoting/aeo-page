# Deploy AEO.page to Cloudflare Pages

本文件提供把此專案部署到 Cloudflare Pages（含 Functions + KV + Durable Object）的完整流程。

## 0) 重要：Pages 不使用 repo root 的 `wrangler.toml`

Cloudflare Pages 會自動讀取 repo 根目錄 `wrangler.toml`，但 Pages 不支援 `migrations`，也會對 Durable Object 的 TOML 規則有不同限制，可能導致驗證失敗。

因此本 repo 改為使用：
- `wrangler.local.toml`：只給本機 wrangler 測試參考
- **不要在 repo root 放 `wrangler.toml`**（避免 Pages deploy fail）

## 1) 專案型態與部署策略

本 repo 是 **Hono + 單頁靜態 HTML (`public/aeo.html`)**，不是 Next.js/Vite。

因此 Cloudflare Pages 採用：
- 靜態輸出目錄：`public`
- 後端 API：`/functions/**`（Pages Functions）
- 資料層：Cloudflare KV（快取、directory、llms.txt）
- Rate limit：Durable Object（原子計數，避免併發穿透）

## 2) 建立 KV（在 Cloudflare Dashboard）

1. 建立 namespace：
   - `AEO_KV`（production）
   - `AEO_KV_preview`（preview）
2. 記下兩組 Namespace ID。

## 3) 建立 Durable Object（在 Pages 專案 Settings）

本專案使用 `RateLimiterDO` 做每 IP 每分鐘計數。

> Pages 不使用 wrangler migrations；請直接在 Pages UI 綁定 DO。

## 4) Pages 專案設定

在 Cloudflare Dashboard 建立 Pages 專案並連到本 repo。

- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/`（留空也可）

## 5) 設定環境變數（Pages > Settings > Environment variables）

必填/建議：
- `AEO_RATE_LIMIT_PER_MINUTE=30`（可調）
- `ANTHROPIC_API_KEY=<optional>`（可不填，不填會走 regex 模式）

## 6) 在 Pages UI 綁定 KV / DO（重點）

在 Pages 專案的 **Settings > Functions > Bindings**：

- **KV namespace bindings**
  - Variable name: `AEO_KV`
  - Namespace: 選擇對應 namespace

- **Durable Object bindings**
  - Variable name: `AEO_RATE_LIMITER`
  - Class name: `RateLimiterDO`

> 程式碼已使用 `env.AEO_KV` 與 `env.AEO_RATE_LIMITER`。

## 7) 自訂網域

### 優先：子網域
- 新增 Custom domain：`aeo.kairossite.com`
- Cloudflare 會自動建立 DNS 記錄與憑證。

### 備選：子路徑
- 可用 `kairossite.com/aeo`，需搭配站點路由規則或反向代理到 Pages。
- 本專案已支援 `/aeo` 入口（轉址到 `/aeo.html`）。

## 8) 本機驗證（Bun 等價 + Wrangler 可選）

```bash
npm install
npm run build
npm run dev
```

`npm run dev` 會啟動 Bun 本地伺服器（等價驗證 API 行為）。

若你本機可安裝 wrangler，可參考本 repo 的 `wrangler.local.toml` 自行測試。

## 9) 目前 Functions 路徑

- `POST /api/aeo/scan`
- `GET /api/aeo/directory`
- `GET /aeo/shops/:shopId/llms.txt`

