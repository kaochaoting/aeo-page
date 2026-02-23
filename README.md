<p align="center">
  <h1 align="center">AEO.page</h1>
  <p align="center"><strong>Agent Engine Optimization — Get found by AI.</strong></p>
</p>

<p align="center">
  <a href="https://api.washinmura.jp/aeo">Live Demo</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#why-aeo">Why AEO</a> ·
  <a href="#api">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License">
  <img src="https://img.shields.io/badge/runtime-Bun-black" alt="Bun">
  <img src="https://img.shields.io/badge/AI-Claude%20Sonnet-orange" alt="Claude">
  <img src="https://img.shields.io/badge/lang-TypeScript-blue" alt="TypeScript">
</p>

---

## TL;DR

> **Paste a URL → AI diagnoses the issues → one-click fix → your business gets found by AI.**

When someone asks ChatGPT *"recommend a ryokan in Chiba"*, does it mention your place?

If not, the problem isn't your service — it's that **AI can't read your data**.

AEO.page fixes that.

---

## Why AEO

| | SEO (old era) | AEO (AI era) |
|---|---|---|
| Target | Google search engine | ChatGPT / Claude / Perplexity |
| Goal | Rank higher | Get cited |
| Key tech | meta tags, backlinks | JSON-LD, llms.txt, FAQ Schema |
| Who benefits | Big sites with SEO budgets | Every small business |

**SEO gets Google to find you. AEO gets AI to recommend you.**

In 2026, more people skip "searching" and just "ask AI" directly. If AI doesn't know your business, you disappear from their world.

---

## Features

### Scanner Engine

Paste any URL, and the AEO Scanner will:

1. **Fetch** the page (supports Shift_JIS / EUC-JP encoding for Japanese sites)
2. **Regex scoring** — checks JSON-LD, llms.txt, OG Tags, FAQ Schema, and 8 indicators total
3. **AI deep analysis** — uses Claude Sonnet to extract business name, features, story, FAQ (optional)
4. **Generate fix code** — one-click copy of JSON-LD + OG Tags + FAQ Schema
5. **Host llms.txt** — free hosting so AI Agents can read your business info directly

### Scoring Criteria (out of 100)

| Item | Points | Why it matters |
|------|--------|----------------|
| JSON-LD structured data | 30 | Primary channel for AI to read business info |
| llms.txt | 20 | AI Agent's instruction manual for your business |
| Open Graph tags | 15 | Rich previews when shared on LINE / Facebook |
| Meta Description | 10 | First impression for search engines and AI |
| FAQ Schema | 10 | AI can quote your Q&A directly |
| Page title | 5 | Most basic identification |
| Contact info | 5 | Phone number and address |
| Images | 5 | Visual content |

---

## Quick Start

### Use Online (easiest)

Open [https://api.washinmura.jp/aeo](https://api.washinmura.jp/aeo), paste a URL, done.

### Self-Host

```bash
# 1. Clone
git clone https://github.com/sstklen/aeo-page.git
cd aeo-page

# 2. Install
bun install

# 3. Configure (optional: AI analysis requires Anthropic API Key)
export ANTHROPIC_API_KEY=sk-ant-xxx   # Works without it, just falls back to regex mode

# 4. Start
bun run dev
# → http://localhost:3000/aeo
```

### CLI

```bash
# Scan a single URL from the command line
bun run src/cli.ts https://example.com

# With AI analysis
ANTHROPIC_API_KEY=sk-ant-xxx bun run src/cli.ts https://example.com
```

### Docker

```bash
docker build -t aeo-page .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-xxx aeo-page
```

---

## API

### POST `/api/aeo/scan`

Scan a website and return its AI-friendliness score with fix suggestions.

```bash
curl -X POST https://api.washinmura.jp/api/aeo/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'
```

**Response:**

```json
{
  "url": "https://example.com",
  "score": 35,
  "businessName": "Example Shop",
  "businessType": "LocalBusiness",
  "aiAnalyzed": true,
  "issues": [
    { "title": "JSON-LD", "status": "fail", "detail": "AI and Google can't read your business info" },
    { "title": "llms.txt", "status": "fail", "detail": "ChatGPT, Claude, Perplexity can't find your details" }
  ],
  "hostedUrl": "https://api.washinmura.jp/aeo/shops/example-com/llms.txt",
  "jsonld": "<script type=\"application/ld+json\">...</script>",
  "ogTags": "<!-- Open Graph -->...",
  "faqSchema": "<script type=\"application/ld+json\">..."
}
```

### GET `/api/aeo/directory`

List all scanned businesses.

### GET `/aeo/shops/:shopId/llms.txt`

Get a business's hosted llms.txt (plain text).

---

## Architecture

```
aeo-page/
├── src/
│   ├── aeo-scanner.ts    # Scan engine (Regex + AI dual mode)
│   ├── aeo-routes.ts     # Hono API routes
│   ├── cli.ts            # CLI scanner tool
│   └── server.ts         # HTTP server
├── public/
│   └── aeo.html          # Frontend SPA (zero dependencies)
├── data/aeo/             # Scan results (auto-generated)
│   ├── directory.json
│   └── shops/
│       └── {shopId}/
│           ├── llms.txt
│           └── data.json
├── Dockerfile
├── package.json
└── tsconfig.json
```

### Tech Stack

| Component | Tech | Why |
|-----------|------|-----|
| Runtime | Bun | Fast, built-in TypeScript |
| HTTP | Hono | Lightweight, fast, edge-ready |
| AI | Claude Sonnet | Best Japanese language understanding |
| Frontend | Vanilla HTML/JS | Zero deps, single file |
| Storage | JSON files | Simple, no database needed |

---

## Scan Example

### Washin Village (washinmura.jp) — Score: 100/100

```markdown
# 和心村（Washin Village / わしんむら）

> 千葉県富津市の里山に佇む、築200年の古民家を中心とした体験型宿泊施設。
> A 200-year-old farmhouse retreat with 16 rescue cats, sauna, and glamping.

- URL: https://washinmura.jp
- Address: 〒299-1607 千葉県富津市高溝14
- TEL: 080-6570-7474

## Features
- Stay in a 200-year-old traditional Japanese farmhouse
- Interact with 16 rescue cats
- Authentic Finnish wood-fired sauna
- Kengo Kuma × Snow Peak "Jyubako" glamping units
- Just 70 min from Tokyo by car
```

---

## What is llms.txt?

[llms.txt](https://llmstxt.org/) is an emerging standard that helps AI Agents quickly understand a website.

Just like `robots.txt` tells search engines *"which pages to crawl"*,
`llms.txt` tells AI *"what this website is about"*.

AEO.page auto-generates and hosts llms.txt for every scanned website.

---

## Roadmap

- [x] Core scan engine (Regex mode)
- [x] AI deep analysis (Claude Sonnet)
- [x] llms.txt auto-hosting
- [x] Web frontend
- [x] Japanese encoding support (Shift_JIS / EUC-JP)
- [ ] Batch scan API
- [ ] Scheduled re-scans (monitor score changes)
- [ ] MCP Server (let AI Agents call the scanner directly)
- [ ] Multi-language frontend (日本語 / 中文)
- [ ] Chrome extension

---

## Contributing

PRs welcome! Especially:

- New scoring items (e.g. robots.txt check, sitemap detection)
- Website parsing improvements for non-Japanese sites
- Frontend UI improvements
- Translations

---

## 中文

> AEO.page 幫你檢測網站的「AI 友善度」。貼上網址，自動診斷 JSON-LD、llms.txt、FAQ Schema，
> 一鍵生成修復代碼。免費。
>
> **SEO 是給 Google 的。AEO 是給 AI 的。**

## 日本語

> AEO.page は、あなたのウェブサイトが AI（ChatGPT、Claude、Perplexity 等）に
> 発見されやすいかを診断するツールです。
>
> URL を入力するだけで、JSON-LD、llms.txt、FAQ Schema を自動生成します。
> すべて無料です。
>
> **SEO は Google のため。AEO は AI のため。**

---

## License

MIT — free for personal and commercial use.

---

<p align="center">
  Built by <a href="https://washinmura.jp">Washin Village</a> 🐾<br>
  <em>An animal sanctuary on the Boso Peninsula, Japan — home to 28 cats & dogs</em>
</p>
