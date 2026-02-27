# Deploy AEO.page to Cloudflare Pages

本文件提供把此專案部署到 Cloudflare Pages（含 Functions + KV）的完整流程。

## 1) 專案型態與部署策略

本 repo 是 **Hono + 單頁靜態 HTML (`public/aeo.html`)**，不是 Next.js/Vite。

因此 Cloudflare Pages 採用：
- 靜態輸出目錄：`public`
- 後端 API：`/functions/**`（Pages Functions）
- 資料層：Cloudflare KV（快取 + rate limit + directory + llms.txt）

## 2) 建立 Cloudflare KV

1. 建立 namespace：
   - `AEO_KV`（production）
   - `AEO_KV_preview`（preview）
2. 記下兩組 Namespace ID。
3. 填入 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "AEO_KV"
id = "<PROD_NAMESPACE_ID>"
preview_id = "<PREVIEW_NAMESPACE_ID>"
```

## 3) Pages 專案設定

在 Cloudflare Dashboard 建立 Pages 專案並連到本 repo。

- **Framework preset**: None
- **Build command**: `npm run build`
- **Build output directory**: `public`
- **Root directory**: `/`（留空也可）

## 4) 設定環境變數（Pages > Settings > Environment variables）

必填/建議：
- `AEO_RATE_LIMIT_PER_MINUTE=30`（可調）
- `ANTHROPIC_API_KEY=<optional>`（可不填，不填會走 regex 模式）

## 5) 綁定 KV 到 Pages

在 Pages 專案的 **Settings > Functions > KV namespace bindings**：
- Variable name: `AEO_KV`
- Namespace: 對應到 production / preview 的 namespace

## 6) 自訂網域

### 優先：子網域
- 新增 Custom domain：`aeo.kairossite.com`
- Cloudflare 會自動建立 DNS 記錄與憑證。

### 備選：子路徑
- 可用 `kairossite.com/aeo`，需搭配站點路由規則或反向代理到 Pages。
- 本專案已支援 `/aeo` 入口（轉址到 `/aeo.html`）。

## 7) 本機驗證（Bun 等價 + Wrangler 可選）

```bash
npm install
npm run build
npm run dev
```

`npm run dev` 會啟動 Bun 本地伺服器（等價驗證 API 行為）。

若你本機可安裝 wrangler，建議額外執行：
```bash
npx wrangler pages dev public --kv AEO_KV
```

測試 API：
```bash
curl -i -X POST http://127.0.0.1:8788/api/aeo/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

重複同一 URL，第二次應看到：
- `X-Cache: HIT`
- 回應 body `cached: true`

大量連打超過限制應回：
- HTTP `429`
- `Retry-After` header

## 8) 目前 Functions 路徑

- `POST /api/aeo/scan`
- `GET /api/aeo/directory`
- `GET /aeo/shops/:shopId/llms.txt`

