/**
 * AEO Scanner v2 — AI 驅動的網站 AI 友善度掃描引擎
 * 用 Claude AI 分析網站內容，產出高品質結構化數據
 * 無 AI Key 時自動降級為 regex 模式
 */


// === 型別定義 ===

export interface ScanResult {
  url: string;
  score: number;
  businessName: string;
  businessType: string;
  issues: Issue[];
  hostedUrl: string | null;
  jsonld: string | null;
  ogTags: string | null;
  faqSchema: string | null;
  llmsTxt: string | null;
  scannedAt: string;
  aiAnalyzed: boolean;
}

export interface Issue {
  title: string;
  detail: string;
  status: 'pass' | 'fail' | 'warn';
}

interface ExtractedInfo {
  title: string;
  description: string;
  ogTags: Record<string, string>;
  jsonldTypes: string[];
  hasLlmsTxt: boolean;
  hasMetaDescription: boolean;
  hasFaqSchema: boolean;
  hasOgTags: boolean;
  telephone: string | null;
  address: string | null;
  images: string[];
  links: string[];
  textContent: string;
}

// AI 分析結果
interface AIAnalysis {
  name: string;
  nameEn: string;
  type: string;
  description: string;
  descriptionEn: string;
  address: string | null;
  telephone: string | null;
  hours: string | null;
  features: string[];
  products: string[];
  story: string;
  faq: Array<{ q: string; a: string }>;
}

// === 取得 Anthropic API Key ===

async function getAnthropicKey(): Promise<string | null> {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }
  return null;
}

// === 主掃描函式 ===

export async function scanWebsite(url: string): Promise<ScanResult> {
  // 1. 抓取網頁
  const html = await fetchWebsite(url);

  // 2. Regex 提取基本資訊（用於計分）
  const info = extractInfo(html, url);

  // 3. 計算分數 + 問題清單（基於網站實際狀態）
  const { score, issues } = analyzeScore(info);

  // 4. 嘗試 AI 分析（用於產出高品質內容）
  const aiResult = await analyzeWithAI(info.textContent, url, info);

  // 5. 決定商家類型（AI 優先，regex 備用）
  const businessType = aiResult?.type || guessBusinessType(info);

  // 6. 生成結構化數據（AI 結果 + regex 結果混合）
  const generated = generateStructuredData(url, info, businessType, aiResult);

  // 7. 組裝結果（儲存交由 runtime：Cloudflare KV / app DB）
  const businessName = aiResult?.name || info.title || new URL(url).hostname;
  const result: ScanResult = {
    url,
    score,
    businessName,
    businessType,
    issues,
    hostedUrl: null,
    jsonld: generated.jsonld,
    ogTags: generated.ogTags,
    faqSchema: generated.faqSchema,
    llmsTxt: generated.llmsTxt,
    scannedAt: new Date().toISOString(),
    aiAnalyzed: !!aiResult,
  };
  return result;
}

// === AI 分析引擎（v2 核心）===

async function analyzeWithAI(
  textContent: string,
  url: string,
  info: ExtractedInfo
): Promise<AIAnalysis | null> {
  const apiKey = await getAnthropicKey();
  if (!apiKey) {
    console.log('[AEO] 無 Anthropic API Key，使用 regex 模式');
    return null;
  }

  // 組合送給 AI 的內容（精簡版，節省 token）
  const pageContext = [
    `URL: ${url}`,
    info.title ? `Title: ${info.title}` : '',
    info.description ? `Description: ${info.description}` : '',
    info.telephone ? `TEL: ${info.telephone}` : '',
    info.address ? `Address: ${info.address}` : '',
    `\n--- 頁面內容 ---\n${textContent.slice(0, 3000)}`,
  ].filter(Boolean).join('\n');

  const prompt = `You are a website analysis expert. Extract business information from the context below.

${pageContext}

Return JSON only (no markdown, no explanation):

{
  "name": "Official business name",
  "nameEn": "English name (best guess from context)",
  "type": "Schema.org type: Restaurant, Store, LodgingBusiness, BeautySalon, MedicalBusiness, TouristAttraction, SportsActivityLocation, EducationalOrganization, or LocalBusiness",
  "description": "Primary description (max 80 chars)",
  "descriptionEn": "English description (max 80 chars)",
  "address": "Address or null",
  "telephone": "Phone number or null",
  "hours": "Opening hours or null",
  "features": ["3-5 concrete strengths"],
  "products": ["3-8 products or services"],
  "story": "2-3 factual sentences suitable for AI citation",
  "faq": [
    {"q": "Useful question 1", "a": "Helpful answer 1"},
    {"q": "Useful question 2", "a": "Helpful answer 2"},
    {"q": "Useful question 3", "a": "Helpful answer 3"},
    {"q": "Useful question 4", "a": "Helpful answer 4"},
    {"q": "Useful question 5", "a": "Helpful answer 5"}
  ]
}

Rules:
- Use null for unknown fields.
- Minimize guessing; prioritize verifiable facts from the page.
- Keep FAQ practical (location, booking, parking, pricing, offerings).
- Keep story factual and specific.`;

  try {
    console.log('[AEO] AI 分析中...', url);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error('[AEO] Claude API 錯誤:', response.status, errText.slice(0, 200));
      return null;
    }

    const data = await response.json() as any;
    const text = data.content?.[0]?.text || '';

    // 從回應中抽取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[AEO] AI 回應中找不到 JSON');
      return null;
    }

    const analysis = JSON.parse(jsonMatch[0]) as AIAnalysis;
    console.log('[AEO] AI 分析完成:', analysis.name);
    return analysis;

  } catch (err: any) {
    console.error('[AEO] AI 分析失敗:', err.message);
    return null;
  }
}

// === 抓取網頁 ===

async function fetchWebsite(url: string): Promise<string> {
  if (!url.startsWith('http')) url = 'https://' + url;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'AEO-Scanner/2.0 (AI-Friendliness Checker; +https://aeo.page)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'ja,en;q=0.9,zh-TW;q=0.8',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    // 處理日文網站常見的 Shift_JIS / EUC-JP 編碼
    const contentType = res.headers.get('content-type') || '';
    const arrayBuffer = await res.arrayBuffer();

    let charset = 'utf-8';
    const ctMatch = contentType.match(/charset=([^\s;]+)/i);
    if (ctMatch) {
      charset = ctMatch[1].toLowerCase().replace(/["']/g, '');
    } else {
      const preview = new TextDecoder('latin1').decode(arrayBuffer.slice(0, 2000));
      const metaMatch = preview.match(/charset=["']?([^"'\s;>]+)/i)
        || preview.match(/encoding=["']?([^"'\s;>]+)/i);
      if (metaMatch) {
        charset = metaMatch[1].toLowerCase().replace(/["']/g, '');
      }
    }

    const charsetMap: Record<string, string> = {
      'shift_jis': 'shift_jis', 'shiftjis': 'shift_jis', 'sjis': 'shift_jis', 'x-sjis': 'shift_jis',
      'euc-jp': 'euc-jp', 'eucjp': 'euc-jp', 'x-euc-jp': 'euc-jp',
      'iso-2022-jp': 'iso-2022-jp',
      'utf-8': 'utf-8', 'utf8': 'utf-8',
    };
    const decoderCharset = charsetMap[charset] || charset;

    try {
      return new TextDecoder(decoderCharset).decode(arrayBuffer);
    } catch {
      return new TextDecoder('utf-8').decode(arrayBuffer);
    }
  } finally {
    clearTimeout(timeout);
  }
}

// === Regex 提取資訊（計分用）===

function extractInfo(html: string, url: string): ExtractedInfo {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  const hasMetaDescription = !!description;

  const ogTags: Record<string, string> = {};
  const ogRegex = /<meta[^>]*property=["'](og:[^"']+)["'][^>]*content=["']([^"']+)["']/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[1]] = ogMatch[2];
  }
  const hasOgTags = Object.keys(ogTags).length >= 3;

  const jsonldTypes: string[] = [];
  const jsonldRegex = /"@type"\s*:\s*"([^"]+)"/g;
  let jMatch;
  while ((jMatch = jsonldRegex.exec(html)) !== null) {
    if (!jsonldTypes.includes(jMatch[1])) jsonldTypes.push(jMatch[1]);
  }

  const hasLlmsTxt = /llms\.txt/i.test(html) || /llms-full\.txt/i.test(html);
  const hasFaqSchema = /FAQPage/i.test(html);

  // 電話
  const telMatch = html.match(/href=["']tel:([+\d\-() ]+)["']/i)
    || html.match(/>(\+?\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4}[-\s]?\d{0,4})<\/a>/i)
    || html.match(/TEL[：:\s]*([0-9\-()+ ]{8,20})/i)
    || html.match(/電話[：:\s]*([0-9\-()+ ]{8,20})/i);
  const telephone = telMatch ? telMatch[1].trim() : null;

  // 地址（日本格式：用都道府縣名嚴格匹配，避免抓到 CSS 等垃圾）
  const prefectures = '北海道|青森県|岩手県|宮城県|秋田県|山形県|福島県|茨城県|栃木県|群馬県|埼玉県|千葉県|東京都|神奈川県|新潟県|富山県|石川県|福井県|山梨県|長野県|岐阜県|静岡県|愛知県|三重県|滋賀県|京都府|大阪府|兵庫県|奈良県|和歌山県|鳥取県|島根県|岡山県|広島県|山口県|徳島県|香川県|愛媛県|高知県|福岡県|佐賀県|長崎県|熊本県|大分県|宮崎県|鹿児島県|沖縄県';
  let address: string | null = null;

  // 策略 1：郵遞區號 + 都道府縣
  const postalMatch = html.match(new RegExp(`〒(\\d{3}-\\d{4})[^<"'=]{0,5}((?:${prefectures})[^<"']{3,80})`, 'u'));
  if (postalMatch) {
    address = `〒${postalMatch[1]} ${postalMatch[2].trim()}`;
  }

  // 策略 2：標籤式（「住所」「所在地」後面跟都道府縣）
  if (!address) {
    const labelMatch = html.match(new RegExp(`(?:住所|所在地)[：:\\s</td><>]*(?:〒?\\d{3}-\\d{4})?\\s*((?:${prefectures})[^<"']{3,80})`, 'iu'));
    if (labelMatch) address = labelMatch[1].trim();
  }

  // 策略 3：HTML 可見文字中的都道府縣
  if (!address) {
    const visibleHtml = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    const prefMatch = visibleHtml.match(new RegExp(`>(〒?\\d{3}-?\\d{4})?\\s*((?:${prefectures})[^<"']{3,80})`));
    if (prefMatch) {
      const postal = prefMatch[1] ? prefMatch[1] + ' ' : '';
      address = (postal + prefMatch[2]).trim();
    }
  }

  // 圖片
  const images: string[] = [];
  const imgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    if (images.length < 5) images.push(imgMatch[1]);
  }
  if (ogTags['og:image'] && !images.includes(ogTags['og:image'])) {
    images.unshift(ogTags['og:image']);
  }

  // 連結
  const links: string[] = [];
  const linkRegex = /<a[^>]*href=["']([^"']+)["']/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    if (links.length < 20) links.push(linkMatch[1]);
  }

  // 純文字（去 HTML，取前 3000 字給 AI 分析用）
  const textContent = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 3000);

  return {
    title, description, ogTags, jsonldTypes, hasLlmsTxt,
    hasMetaDescription, hasFaqSchema, hasOgTags, telephone,
    address, images, links, textContent,
  };
}

// === 分析分數（基於網站實際狀態，不受 AI 分析影響）===

function analyzeScore(info: ExtractedInfo): { score: number; issues: Issue[] } {
  const issues: Issue[] = [];
  let score = 0;

  // 1. JSON-LD（30 分）
  const businessTypes = ['LocalBusiness', 'LodgingBusiness', 'Restaurant', 'Store',
    'FoodEstablishment', 'Hotel', 'Organization', 'MedicalBusiness'];
  const hasBusinessSchema = info.jsonldTypes.some(t => businessTypes.includes(t));
  if (hasBusinessSchema) {
    score += 30;
    issues.push({ title: 'JSON-LD 結構化數據', detail: `有 ${info.jsonldTypes.join(', ')}`, status: 'pass' });
  } else if (info.jsonldTypes.length > 0) {
    score += 10;
    issues.push({ title: 'JSON-LD 結構化數據', detail: `有 ${info.jsonldTypes.join(', ')}，但缺少商家類型`, status: 'warn' });
  } else {
    issues.push({ title: 'JSON-LD 結構化數據', detail: 'AI 和 Google 讀不到你的店家資訊', status: 'fail' });
  }

  // 2. llms.txt（20 分）
  if (info.hasLlmsTxt) {
    score += 20;
    issues.push({ title: 'llms.txt', detail: '有 llms.txt，AI 可以讀取詳細資訊', status: 'pass' });
  } else {
    issues.push({ title: 'llms.txt', detail: 'ChatGPT、Claude、Perplexity 找不到你的詳細資料', status: 'fail' });
  }

  // 3. Open Graph（15 分）
  if (info.hasOgTags) {
    score += 15;
    issues.push({ title: 'Open Graph 標籤', detail: 'LINE/Facebook 分享時有圖片和說明', status: 'pass' });
  } else {
    issues.push({ title: 'Open Graph 標籤', detail: '分享到 LINE/Facebook 時沒有圖片', status: 'fail' });
  }

  // 4. Meta Description（10 分）
  if (info.hasMetaDescription) {
    score += 10;
    issues.push({ title: 'Meta Description', detail: `「${info.description.slice(0, 50)}...」`, status: 'pass' });
  } else {
    issues.push({ title: 'Meta Description', detail: '搜尋引擎不知道你的網站在講什麼', status: 'fail' });
  }

  // 5. FAQ（10 分）
  if (info.hasFaqSchema) {
    score += 10;
    issues.push({ title: 'FAQ 問答', detail: 'Google 會直接顯示你的常見問答', status: 'pass' });
  } else {
    issues.push({ title: 'FAQ 問答', detail: '沒有 FAQ，AI 無法引用你的常見問答', status: 'fail' });
  }

  // 6. 標題（5 分）
  if (info.title) {
    score += 5;
    issues.push({ title: '網頁標題', detail: info.title, status: 'pass' });
  } else {
    issues.push({ title: '網頁標題', detail: '沒有標題，AI 不知道你是誰', status: 'fail' });
  }

  // 7. 聯絡資訊（5 分）
  if (info.telephone || info.address) {
    score += 5;
    issues.push({ title: '聯絡資訊', detail: [info.telephone, info.address].filter(Boolean).join(' / '), status: 'pass' });
  } else {
    issues.push({ title: '聯絡資訊', detail: '找不到電話或地址', status: 'warn' });
  }

  // 8. 圖片（5 分）
  if (info.images.length > 0) {
    score += 5;
    issues.push({ title: '圖片', detail: `找到 ${info.images.length} 張圖片`, status: 'pass' });
  } else {
    issues.push({ title: '圖片', detail: '找不到圖片', status: 'warn' });
  }

  return { score: Math.min(score, 100), issues };
}

// === 推測商家類型（regex 備用）===

function guessBusinessType(info: ExtractedInfo): string {
  const text = (info.title + ' ' + info.description + ' ' + info.textContent).toLowerCase();

  const types: [string, string[]][] = [
    ['Restaurant', ['restaurant', 'food', 'dining', 'menu', 'cafe', 'sushi', 'bar', 'bbq', 'eat']],
    ['LodgingBusiness', ['hotel', 'motel', 'inn', 'glamping', 'stay', 'check-in', 'resort', 'guesthouse']],
    ['Store', ['shop', 'store', 'product', 'buy', 'cart', 'ecommerce', 'retail']],
    ['BeautySalon', ['salon', 'beauty', 'hair', 'nail', 'spa', 'stylist']],
    ['MedicalBusiness', ['clinic', 'hospital', 'dental', 'medical', 'pharmacy', 'health']],
    ['SportsActivityLocation', ['gym', 'fitness', 'yoga', 'sports', 'golf', 'training']],
    ['EducationalOrganization', ['school', 'academy', 'course', 'lesson', 'education', 'training']],
    ['TouristAttraction', ['tourism', 'attraction', 'experience', 'activity', 'travel', 'visit']],
  ];

  for (const [type, keywords] of types) {
    const matchCount = keywords.filter(kw => text.includes(kw)).length;
    if (matchCount >= 2) return type;
  }

  return 'LocalBusiness';
}

// === 生成結構化數據（v2：AI 分析優先）===

function generateStructuredData(
  url: string,
  info: ExtractedInfo,
  businessType: string,
  ai: AIAnalysis | null
) {
  const hostname = new URL(url).hostname;
  const name = ai?.name || info.title?.split(/[|｜\-–—]/).map(s => s.trim())[0] || hostname;
  const nameEn = ai?.nameEn || '';
  const desc = ai?.description || info.description || info.title || '';
  const descEn = ai?.descriptionEn || '';
  const addr = ai?.address || info.address;
  const tel = ai?.telephone || info.telephone;
  const image = info.images[0] || '';

  // --- llms.txt（AI 驅動版，品質大幅提升）---
  let llmsTxt = `# ${name}`;
  if (nameEn) llmsTxt += `（${nameEn}）`;
  llmsTxt += '\n\n';
  llmsTxt += `> ${desc}\n`;
  if (descEn) llmsTxt += `> ${descEn}\n`;
  llmsTxt += '\n';
  llmsTxt += `- URL: ${url}\n`;
  if (addr) llmsTxt += `- Address: ${addr}\n`;
  if (tel) llmsTxt += `- TEL: ${tel}\n`;
  if (ai?.hours) llmsTxt += `- Opening Hours: ${ai.hours}\n`;
  llmsTxt += '\n';

  if (ai?.story) {
    llmsTxt += `## Story\n\n${ai.story}\n\n`;
  }

  if (ai?.features && ai.features.length > 0) {
    llmsTxt += `## Features\n\n`;
    for (const f of ai.features) {
      llmsTxt += `- ${f}\n`;
    }
    llmsTxt += '\n';
  }

  if (ai?.products && ai.products.length > 0) {
    llmsTxt += `## Products & Services\n\n`;
    for (const p of ai.products) {
      llmsTxt += `- ${p}\n`;
    }
    llmsTxt += '\n';
  }

  if (ai?.faq && ai.faq.length > 0) {
    llmsTxt += `## FAQ\n\n`;
    for (const f of ai.faq) {
      llmsTxt += `**Q: ${f.q}**\nA: ${f.a}\n\n`;
    }
  }

  if (!ai) {
    llmsTxt += `## Overview\n\n${info.textContent.slice(0, 500)}\n\n`;
  }

  llmsTxt += `---\n\n`;
  llmsTxt += `*Generated by AEO.page | AI-Friendliness Optimization*\n`;
  llmsTxt += `*Last scanned: ${new Date().toISOString().split('T')[0]}*\n`;
  llmsTxt += ai ? `*Analyzed by AI*\n` : '';

  // --- JSON-LD ---
  const jsonldObj: any = {
    "@context": "https://schema.org",
    "@type": businessType,
    "name": name,
    "url": url,
    "description": desc,
  };
  if (nameEn) jsonldObj.alternateName = nameEn;
  if (tel) jsonldObj.telephone = tel;
  if (addr) {
    jsonldObj.address = { "@type": "PostalAddress", "description": addr };
  }
  if (image) jsonldObj.image = image;
  if (ai?.hours) jsonldObj.openingHours = ai.hours;

  const jsonld = `<script type="application/ld+json">\n${JSON.stringify(jsonldObj, null, 2)}\n</script>`;

  // --- OG Tags ---
  const ogTags = `<!-- Open Graph -->
<meta property="og:type" content="website">
<meta property="og:title" content="${escapeHtml(name)}">
<meta property="og:description" content="${escapeHtml(desc)}">
<meta property="og:url" content="${url}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(name)}">`;

  // --- FAQ Schema ---
  const faqEntries = ai?.faq?.length ? ai.faq : [
    { q: `Where is ${name} located?`, a: addr || `Please check ${url}.` },
    { q: 'What are your opening hours?', a: ai?.hours || `Please check details at ${url}.` },
    { q: 'Do I need a reservation?', a: `Please check ${url} or contact directly.${tel ? ' TEL: ' + tel : ''}` },
  ];

  const faqSchema = `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
${faqEntries.map(f => `    {
      "@type": "Question",
      "name": "${escapeJson(f.q)}",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "${escapeJson(f.a)}"
      }
    }`).join(',\n')}
  ]
}
</script>`;

  return { llmsTxt, jsonld, ogTags, faqSchema };
}

// === 儲存與讀取 ===

export function urlToShopId(url: string): string {
  return new URL(url).hostname.replace(/\./g, '-').replace(/^www-/, '');
}

// === 工具 ===

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeJson(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
