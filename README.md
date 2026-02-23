<p align="center">
  <strong style="font-size: 2rem;">AEO.page</strong><br>
  <em>Agent Engine Optimization — 讓 AI 找到你的店</em>
</p>

<p align="center">
  <a href="https://api.washinmura.jp/aeo">線上體驗</a> ·
  <a href="#快速開始">快速開始</a> ·
  <a href="#為什麼需要-aeo">為什麼需要 AEO</a> ·
  <a href="#api">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
  <img src="https://img.shields.io/badge/runtime-Bun-black" alt="Bun">
  <img src="https://img.shields.io/badge/AI-Claude%20Sonnet-orange" alt="Claude">
  <img src="https://img.shields.io/badge/lang-TypeScript-blue" alt="TypeScript">
</p>

---

## 一句話

> **貼上網址 → AI 幫你診斷 → 一鍵生成修復代碼 → 你的店從此被 AI 找到。**

ChatGPT、Claude、Perplexity 在回答「推薦一家千葉的民宿」時，會不會提到你的店？

如果不會，問題不在你的服務不好，而是 **AI 根本讀不到你的資料**。

AEO.page 解決這個問題。

---

## 為什麼需要 AEO

| | SEO（舊時代） | AEO（AI 時代） |
|---|---|---|
| 對象 | Google 搜尋引擎 | ChatGPT / Claude / Perplexity |
| 核心 | 排名 | 被引用 |
| 關鍵技術 | meta tags, backlinks | JSON-LD, llms.txt, FAQ Schema |
| 受益者 | 有 SEO 預算的大網站 | 每一間小店 |

**SEO 讓 Google 找到你。AEO 讓 AI 推薦你。**

2026 年，越來越多人不再「搜尋」，而是直接「問 AI」。
如果 AI 不認識你的店，你就從這些人的世界裡消失了。

---

## 功能

### 掃描引擎

貼上任何網址，AEO Scanner 會：

1. **抓取** 網頁內容（支援 Shift_JIS / EUC-JP 等日文編碼）
2. **Regex 計分** — 檢測 JSON-LD、llms.txt、OG Tags、FAQ Schema 等 8 項指標
3. **AI 深度分析** — 用 Claude Sonnet 提取商家名稱、特色、故事、FAQ（可選）
4. **生成修復代碼** — 一鍵複製 JSON-LD + OG Tags + FAQ Schema
5. **託管 llms.txt** — 免費幫你託管，AI Agent 可以直接讀取

### 評分標準（滿分 100）

| 項目 | 分數 | 說明 |
|------|------|------|
| JSON-LD 結構化數據 | 30 | AI 讀取商家資訊的主要管道 |
| llms.txt | 20 | AI Agent 專用的商家說明書 |
| Open Graph | 15 | LINE / Facebook 分享時的圖文 |
| Meta Description | 10 | 搜尋引擎和 AI 的第一印象 |
| FAQ Schema | 10 | AI 引用你的問答 |
| 網頁標題 | 5 | 最基本的識別 |
| 聯絡資訊 | 5 | 電話和地址 |
| 圖片 | 5 | 視覺素材 |

---

## 快速開始

### 線上使用（最簡單）

直接打開 [https://api.washinmura.jp/aeo](https://api.washinmura.jp/aeo)，貼上網址，完成。

### 自架部署

```bash
# 1. Clone
git clone https://github.com/sstklen/aeo-page.git
cd aeo-page

# 2. 安裝
bun install

# 3. 設定（可選：AI 分析需要 Anthropic API Key）
export ANTHROPIC_API_KEY=sk-ant-xxx   # 沒有也能跑，只是降級為 regex 模式

# 4. 啟動
bun run dev
# → http://localhost:3000/aeo
```

### Docker

```bash
docker build -t aeo-page .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-xxx aeo-page
```

---

## API

### POST `/api/aeo/scan`

掃描一個網站，回傳 AI 友善度評分和修復建議。

```bash
curl -X POST https://api.washinmura.jp/api/aeo/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**回應：**

```json
{
  "url": "https://example.com",
  "score": 35,
  "businessName": "Example Shop",
  "businessType": "LocalBusiness",
  "aiAnalyzed": true,
  "issues": [
    { "title": "JSON-LD 結構化數據", "status": "fail", "detail": "AI 和 Google 讀不到你的店家資訊" },
    { "title": "llms.txt", "status": "fail", "detail": "ChatGPT、Claude、Perplexity 找不到你的詳細資料" }
  ],
  "hostedUrl": "https://api.washinmura.jp/aeo/shops/example-com/llms.txt",
  "jsonld": "<script type=\"application/ld+json\">...</script>",
  "ogTags": "<!-- Open Graph -->...",
  "faqSchema": "<script type=\"application/ld+json\">..."
}
```

### GET `/api/aeo/directory`

取得所有已掃描店家的清單。

### GET `/aeo/shops/:shopId/llms.txt`

取得某個店家的 llms.txt（純文字）。

---

## 架構

```
aeo-page/
├── src/
│   ├── aeo-scanner.ts    # 掃描引擎（Regex + AI 雙模式）
│   ├── aeo-routes.ts     # Hono API 路由
│   └── server.ts         # HTTP 伺服器
├── public/
│   └── aeo.html          # 前端單頁應用
├── data/aeo/             # 掃描結果儲存（自動產生）
│   ├── directory.json
│   └── shops/
│       └── {shopId}/
│           ├── llms.txt
│           └── data.json
├── package.json
└── tsconfig.json
```

### 技術選型

| 元件 | 技術 | 為什麼 |
|------|------|--------|
| Runtime | Bun | 快、內建 TypeScript |
| HTTP | Hono | 輕量、快、邊緣友善 |
| AI | Claude Sonnet | 日文理解力最強 |
| 前端 | 原生 HTML/JS | 零依賴、一個檔案搞定 |
| 儲存 | JSON 檔案 | 簡單，不需要資料庫 |

---

## 掃描範例

### 和心村（washinmura.jp）— 100 分

```
# 和心村（Washin Village / わしんむら）

> 千葉県富津市の里山に佇む、築200年の古民家を中心とした体験型宿泊施設。
> A 200-year-old farmhouse retreat with 16 rescue cats, sauna, and glamping.

- URL: https://washinmura.jp
- 住所: 〒299-1607 千葉県富津市高溝14
- TEL: 080-6570-7474

## 特徴
- 築200年の古民家での宿泊体験
- 16匹の保護猫との触れ合い
- 本格薪サウナ（フィンランド式）
- 隈研吾×Snow Peak「住箱」でのグランピング
- 東京から車でわずか70分の好アクセス
```

---

## 什麼是 llms.txt？

[llms.txt](https://llmstxt.org/) 是一個新興標準，讓 AI Agent 能快速理解一個網站。

就像 `robots.txt` 告訴搜尋引擎「哪些頁面可以爬」，
`llms.txt` 告訴 AI「這個網站是做什麼的」。

AEO.page 幫每個掃描過的網站自動生成並託管 llms.txt。

---

## 日本語

> AEO.page は、あなたのウェブサイトが AI（ChatGPT、Claude、Perplexity など）に
> 発見されやすいかを診断するツールです。
>
> URL を入力するだけで、JSON-LD、llms.txt、FAQ Schema を自動生成します。
> すべて無料です。
>
> **SEO はGoogleのため。AEO は AI のため。**

---

## 路線圖

- [x] 基本掃描引擎（Regex 模式）
- [x] AI 深度分析（Claude Sonnet）
- [x] llms.txt 自動託管
- [x] 前端介面
- [x] 日文網站編碼支援（Shift_JIS / EUC-JP）
- [ ] 批量掃描 API
- [ ] 定期重新掃描（監控分數變化）
- [ ] MCP Server（讓 AI Agent 直接呼叫掃描）
- [ ] 多語言前端（日本語 / English）
- [ ] Chrome 擴充功能

---

## 貢獻

歡迎 PR！尤其歡迎：

- 新的評分項目（例如：robots.txt 檢測、sitemap 檢測）
- 其他語言的網站解析優化
- 前端 UI 改進
- 文件翻譯

---

## 授權

MIT License — 自由使用，商用也行。

---

<p align="center">
  由 <a href="https://washinmura.jp">和心村</a> 製作 🐾<br>
  <em>千葉縣房總半島的動物庇護所，28 隻貓狗的家</em>
</p>
