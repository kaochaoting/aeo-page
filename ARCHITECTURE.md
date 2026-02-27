# AEO.page on Cloudflare Pages — Architecture

## Components

- **UI**: `public/aeo.html`
  - 單頁前端，呼叫 `/api/aeo/scan` 並渲染分數、問題、JSON-LD/FAQ/OG/llms.txt。
- **Pages Functions**:
  - `functions/api/aeo/scan.ts`
  - `functions/api/aeo/directory.ts`
  - `functions/aeo/shops/[shopId]/llms.txt.ts`
- **KV (`AEO_KV`)**:
  - Rate limit counter
  - 掃描結果快取
  - llms.txt 文本
  - directory 索引

## Data Flow

1. 使用者在 UI 輸入 URL。
2. 前端 POST 到 `/api/aeo/scan`。
3. Function 先用 `CF-Connecting-IP` 做 per-minute rate limit：
   - key: `AEO_RL:{ip}:{minuteBucket}`
4. 做 URL normalization（去 hash、去 utm_*、統一路徑尾斜線）
5. 查詢 cache：
   - key: `AEO_CACHE:{normalizedUrl}`
   - 命中時直接回 `X-Cache: HIT`、`cached=true`
6. 未命中則執行 scanner（`src/aeo-scanner.ts`）
7. 寫回 KV：
   - `AEO_CACHE:{normalizedUrl}`（TTL 24h）
   - `AEO_LLMSTXT:{shopId}`（TTL 24h）
   - `AEO_DIRECTORY`（最近掃描索引）
8. 前端顯示結果；若 cached 會顯示快取命中。

## Why KV + Functions

- 符合 Cloudflare Pages 無常駐 Node server 的模式。
- 免費版可直接實現可調整的 rate limit + cache。
- 不依賴本機檔案系統（不使用 fs 持久化）。

