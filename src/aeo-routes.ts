/**
 * AEO Routes — Hono 路由
 * 提供掃描 API（Bun 本地模式）
 */

import { Hono } from 'hono';
import { scanWebsite, urlToShopId } from './aeo-scanner';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const memoryDirectory: any[] = [];
const memoryLlms = new Map<string, string>();

export function createAeoRoutes() {
  const aeo = new Hono();

  aeo.post('/scan', async (c) => {
    try {
      const body = await c.req.json();
      const url = body?.url?.trim();

      if (!url) {
        return c.json({ error: '請提供網址' }, 400);
      }

      let validUrl = url;
      if (!validUrl.startsWith('http')) validUrl = 'https://' + validUrl;
      try { new URL(validUrl); } catch {
        return c.json({ error: '網址格式不正確' }, 400);
      }

      const result = await scanWebsite(validUrl, { anthropicApiKey: process.env.ANTHROPIC_API_KEY });
      const shopId = urlToShopId(validUrl);
      result.hostedUrl = `${new URL(c.req.url).origin}/aeo/shops/${shopId}/llms.txt`;

      if (result.llmsTxt) memoryLlms.set(shopId, result.llmsTxt);
      const entry = {
        id: shopId,
        name: result.businessName,
        type: result.businessType,
        url: result.url,
        score: result.score,
        aiAnalyzed: result.aiAnalyzed,
        scannedAt: result.scannedAt,
      };
      const idx = memoryDirectory.findIndex((s) => s.id === shopId);
      if (idx >= 0) memoryDirectory[idx] = entry;
      else memoryDirectory.unshift(entry);

      return c.json({ ...result, cached: false });
    } catch (err: any) {
      console.error('[AEO] 掃描失敗:', err.message);
      return c.json({ error: '掃描失敗：' + (err.message || '未知錯誤') }, 500);
    }
  });

  aeo.get('/directory', (c) => c.json(memoryDirectory));

  return aeo;
}

export function createAeoStaticRoutes() {
  const routes = new Hono();

  routes.get('/shops/:shopId/llms.txt', (c) => {
    const content = memoryLlms.get(c.req.param('shopId'));
    if (!content) return c.text('Not found', 404);
    return c.text(content, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
  });

  routes.get('/', (c) => {
    const htmlPath = resolve(import.meta.dir, '../public/aeo.html');
    if (!existsSync(htmlPath)) return c.text('AEO page not found', 404);
    return c.html(readFileSync(htmlPath, 'utf-8'));
  });

  return routes;
}
