<p align="center">
  <h1 align="center">AEO.page</h1>
  <p align="center"><strong>Agent Engine Optimization — Get found by AI.</strong></p>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Free-Online_Scanner-green?style=for-the-badge" alt="Free"/>
  <img src="https://img.shields.io/badge/Checks-8_Indicators-blue?style=for-the-badge" alt="8 Indicators"/>
  <img src="https://img.shields.io/badge/Fixes-One_Click-orange?style=for-the-badge" alt="One Click Fix"/>
</p>

<p align="center">
  <a href="https://github.com/sstklen/aeo-page/stargazers"><img src="https://img.shields.io/github/stars/sstklen/aeo-page?style=social" alt="Stars"/></a>
  &nbsp;
  <a href="https://api.washinmura.jp/aeo"><strong>Try It Now (free) →</strong></a>
</p>

---

## The Problem

You ask ChatGPT: *"Recommend a ryokan in Chiba"*

Your ryokan has 5-star reviews. 200 years of history. Beautiful photos.

**ChatGPT doesn't mention it.** It recommends your competitor instead.

The problem isn't your service. It's that **AI can't read your website data.**

Most small business websites score **15-35 out of 100** on AI readability.

## The Fix

Paste your URL into AEO.page → See your score → Copy the fix code → Paste it into your site.

```
Before:  Score 25/100 — AI can't find you
After:   Score 85/100 — AI recommends you
Time:    5 minutes
Cost:    Free
```

---

## Real World: Washin Village Case Study

We used AEO.page on our own business — an animal sanctuary in rural Japan.

**Before AEO:** Ask ChatGPT *"recommend glamping in Chiba"* → No mention of Washin Village.

**After AEO:** We built [guide.washinmura.jp](https://guide.washinmura.jp/) with full AEO optimization. Here's what we implemented:

| Schema Type | What AI Can Now Read |
|-------------|---------------------|
| **LodgingBusiness + TouristAttraction** | "200-year-old farmhouse with glamping and rescue cats" |
| **FAQPage** | 3 structured Q&As AI can quote directly |
| **HowTo** | 4-step driving directions from Tokyo |
| **ReserveAction** | Direct link to booking system |
| **GeoCoordinates** | 35.2341, 139.8765 — precise location |
| **amenityFeature** (×8) | Sauna, cat interaction, BBQ, bonfire... |
| **llms.txt** | [Plain text](https://guide.washinmura.jp/llms.txt) any AI agent can read |
| **Multi-language** | Japanese, English, Chinese — 3x AI coverage |

**8 pages, 6 Schema types, 3 languages.**

Now when AI is asked about Chiba glamping, it has everything it needs — business name, features, pricing, directions, and a booking link.

> 👉 **Live example:** [guide.washinmura.jp](https://guide.washinmura.jp/) · [llms.txt](https://guide.washinmura.jp/llms.txt) · [Access page with HowTo Schema](https://guide.washinmura.jp/access/)

---

## Why AEO Matters in 2026

| | SEO (Google era) | AEO (AI era) |
|---|---|---|
| **Target** | Google search engine | ChatGPT / Claude / Perplexity |
| **Goal** | Rank higher in results | Get cited in AI answers |
| **Key tech** | Meta tags, backlinks | JSON-LD, llms.txt, FAQ Schema |
| **Who wins** | Big sites with SEO budgets | Any business that adds structured data |

> **SEO gets Google to find you. AEO gets AI to recommend you.**
>
> In 2026, more people skip "searching" and just ask AI. If AI doesn't know your business, you disappear from their world.

---

## How It Works

Paste any URL. AEO.page scans 8 indicators:

| Indicator | Points | What AI looks for |
|-----------|--------|-------------------|
| **JSON-LD** | 30 | Structured business data (name, type, address) |
| **llms.txt** | 20 | AI Agent's instruction manual for your site |
| **Open Graph** | 15 | Rich previews on LINE / Facebook / Slack |
| **Meta Description** | 10 | First impression for AI and search |
| **FAQ Schema** | 10 | Q&A that AI can quote directly |
| **Page Title** | 5 | Basic identification |
| **Contact Info** | 5 | Phone and address for local results |
| **Images** | 5 | Visual content signals |

Then it **generates the fix code** — JSON-LD, OG Tags, FAQ Schema — ready to copy-paste.

---

## Quick Start

### Online (easiest — no install)

1. Open **[aeo.washinmura.jp](https://api.washinmura.jp/aeo)**
2. Paste a URL
3. See your score + copy the fix code

### API

```bash
curl -X POST https://api.washinmura.jp/api/aeo/scan \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-site.com"}'
```

Returns score, issues, and generated fix code (JSON-LD + OG + FAQ Schema).

### Self-Host

```bash
git clone https://github.com/sstklen/aeo-page.git && cd aeo-page
bun install
bun run dev
# → http://localhost:3000/aeo
# Optional: export ANTHROPIC_API_KEY=sk-ant-xxx for AI deep analysis
```

<details>
<summary><b>Docker / CLI options</b></summary>

**Docker:**
```bash
docker build -t aeo-page .
docker run -p 3000:3000 -e ANTHROPIC_API_KEY=sk-ant-xxx aeo-page
```

**CLI:**
```bash
bun run src/cli.ts https://example.com
```

</details>

---

## What is llms.txt?

Like `robots.txt` tells search engines *which pages to crawl*,
**`llms.txt`** tells AI *what your website is about*.

It's an [emerging standard](https://llmstxt.org/) for making websites AI-readable.

AEO.page auto-generates and **hosts** llms.txt for every scanned site — for free.

---

## Roadmap

- [x] Scan engine (Regex + AI dual mode)
- [x] llms.txt auto-generation and hosting
- [x] Japanese encoding support (Shift_JIS / EUC-JP)
- [x] Web frontend + API
- [ ] Batch scan API
- [ ] Scheduled re-scans (monitor score over time)
- [ ] MCP Server (let AI Agents call the scanner)
- [ ] Chrome extension
- [ ] Multi-language frontend

---

<details>
<summary><b>🔧 Architecture & Tech Stack</b></summary>

```
aeo-page/
├── src/
│   ├── aeo-scanner.ts    # Scan engine (Regex + AI dual mode)
│   ├── aeo-routes.ts     # Hono API routes
│   ├── cli.ts            # CLI scanner tool
│   └── server.ts         # HTTP server
├── public/
│   └── aeo.html          # Frontend SPA (zero dependencies)
└── data/aeo/             # Scan results (auto-generated)
```

| Component | Tech | Why |
|-----------|------|-----|
| Runtime | Bun | Fast, built-in TypeScript |
| HTTP | Hono | Lightweight, edge-ready |
| AI | Claude Sonnet | Best Japanese understanding |
| Frontend | Vanilla HTML/JS | Zero deps, single file |

</details>

<details>
<summary><b>📡 Full API Reference</b></summary>

### POST `/api/aeo/scan`

```json
// Response
{
  "url": "https://example.com",
  "score": 35,
  "businessName": "Example Shop",
  "issues": [
    { "title": "JSON-LD", "status": "fail", "detail": "AI can't read your business info" },
    { "title": "llms.txt", "status": "fail", "detail": "ChatGPT/Claude can't find your details" }
  ],
  "hostedUrl": "https://api.washinmura.jp/aeo/shops/example-com/llms.txt",
  "jsonld": "<script type=\"application/ld+json\">...</script>",
  "ogTags": "<!-- Open Graph -->...",
  "faqSchema": "<script type=\"application/ld+json\">..."
}
```

### GET `/api/aeo/directory` — List all scanned businesses

### GET `/aeo/shops/:shopId/llms.txt` — Get hosted llms.txt

</details>

---

## Contributing

PRs welcome! Especially: new scoring rules, parser improvements for non-Japanese sites, translations.

---

<p align="center">
  <sub>
    <a href="https://washinmura.jp">Washin Village</a> 🐾 — An animal sanctuary in Japan building AI tools.
  </sub>
</p>
