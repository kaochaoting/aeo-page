import { scanWebsite, urlToShopId, type ScanResult } from '../../../src/aeo-scanner';
import type { DirectoryEntry, Env } from '../../_lib/types';
import { CACHE_TTL_SECONDS, RATE_LIMIT_WINDOW_SECONDS, ipFromHeaders, minuteBucket, normalizeUrl } from '../../_lib/kv-utils';

async function json(request: Request): Promise<any> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function parseRateLimit(env: Env): number {
  const raw = Number.parseInt(env.AEO_RATE_LIMIT_PER_MINUTE || '30', 10);
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const rateLimit = parseRateLimit(env);
  const ip = ipFromHeaders(request);
  const bucket = minuteBucket();
  const rlKey = `AEO_RL:${ip}:${bucket}`;

  const currentCount = Number.parseInt((await env.AEO_KV.get(rlKey)) || '0', 10);
  if (currentCount >= rateLimit) {
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Retry-After': String(RATE_LIMIT_WINDOW_SECONDS),
      },
    });
  }

  await env.AEO_KV.put(rlKey, String(currentCount + 1), { expirationTtl: RATE_LIMIT_WINDOW_SECONDS });

  const body = await json(request);
  const inputUrl = body?.url?.trim();
  if (!inputUrl) {
    return Response.json({ error: '請提供網址' }, { status: 400 });
  }

  let normalized: string;
  try {
    normalized = normalizeUrl(inputUrl);
  } catch {
    return Response.json({ error: '網址格式不正確' }, { status: 400 });
  }

  const cacheKey = `AEO_CACHE:${normalized}`;
  const cached = await env.AEO_KV.get(cacheKey, 'json') as ScanResult | null;
  if (cached) {
    return Response.json({ ...cached, cached: true }, {
      headers: {
        'X-Cache': 'HIT',
      },
    });
  }

  if (env.ANTHROPIC_API_KEY && typeof process !== 'undefined') {
    (process as any).env = { ...(process as any).env, ANTHROPIC_API_KEY: env.ANTHROPIC_API_KEY };
  }

  try {
    const result = await scanWebsite(normalized);
    const shopId = urlToShopId(normalized);
    const hostedPath = `/aeo/shops/${shopId}/llms.txt`;
    const hostedUrl = new URL(hostedPath, request.url).toString();

    const persisted: ScanResult = {
      ...result,
      url: normalized,
      hostedUrl,
    };

    await env.AEO_KV.put(cacheKey, JSON.stringify(persisted), { expirationTtl: CACHE_TTL_SECONDS });
    await env.AEO_KV.put(`AEO_LLMSTXT:${shopId}`, persisted.llmsTxt || '', { expirationTtl: CACHE_TTL_SECONDS });

    const directoryKey = 'AEO_DIRECTORY';
    const directory = (await env.AEO_KV.get(directoryKey, 'json') as DirectoryEntry[] | null) || [];
    const entry: DirectoryEntry = {
      id: shopId,
      name: persisted.businessName,
      type: persisted.businessType,
      url: persisted.url,
      score: persisted.score,
      aiAnalyzed: persisted.aiAnalyzed,
      scannedAt: persisted.scannedAt,
    };

    const idx = directory.findIndex((d) => d.id === shopId);
    if (idx >= 0) directory[idx] = entry;
    else directory.unshift(entry);

    await env.AEO_KV.put(directoryKey, JSON.stringify(directory.slice(0, 200)));

    return Response.json({ ...persisted, cached: false }, {
      headers: {
        'X-Cache': 'MISS',
      },
    });
  } catch (err: any) {
    const msg = err?.message || '未知錯誤';
    if (msg.includes('abort') || msg.includes('timeout')) {
      return Response.json({ error: '網站連線逾時，請確認網址正確' }, { status: 504 });
    }
    if (msg.includes('HTTP 4') || msg.includes('HTTP 5')) {
      return Response.json({ error: `網站回傳錯誤：${msg}` }, { status: 502 });
    }

    return Response.json({ error: `掃描失敗：${msg}` }, { status: 500 });
  }
};
