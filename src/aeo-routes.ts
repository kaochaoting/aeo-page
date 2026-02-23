/**
 * AEO Routes — Hono 路由
 * 提供掃描 API、llms.txt 託管、目錄查詢
 */

import { Hono } from 'hono';
import { scanWebsite, getDirectory, getShopLlmsTxt } from './aeo-scanner';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export function createAeoRoutes() {
  const aeo = new Hono();

  // POST /api/aeo/scan — 掃描網站
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

      const result = await scanWebsite(validUrl);

      const origin = new URL(c.req.url).origin;
      if (result.hostedUrl) {
        result.hostedUrl = origin + result.hostedUrl;
      }

      return c.json(result);

    } catch (err: any) {
      console.error('[AEO] 掃描失敗:', err.message);

      if (err.message?.includes('abort') || err.message?.includes('timeout')) {
        return c.json({ error: '網站連線逾時，請確認網址正確' }, 504);
      }
      if (err.message?.includes('HTTP 4') || err.message?.includes('HTTP 5')) {
        return c.json({ error: `網站回傳錯誤：${err.message}` }, 502);
      }

      return c.json({ error: '掃描失敗：' + (err.message || '未知錯誤') }, 500);
    }
  });

  // GET /api/aeo/directory — 取得目錄
  aeo.get('/directory', (c) => {
    const directory = getDirectory();
    return c.json(directory);
  });

  return aeo;
}

// llms.txt 託管 + 前端頁面路由
export function createAeoStaticRoutes() {
  const routes = new Hono();

  // 每個店家的 llms.txt
  routes.get('/shops/:shopId/llms.txt', (c) => {
    const shopId = c.req.param('shopId');
    const content = getShopLlmsTxt(shopId);
    if (!content) return c.text('Not found', 404);
    return c.text(content, 200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    });
  });

  // AEO 首頁
  routes.get('/', (c) => {
    const htmlPath = resolve(import.meta.dir, '../public/aeo.html');
    if (!existsSync(htmlPath)) return c.text('AEO page not found', 404);
    const html = readFileSync(htmlPath, 'utf-8');
    return c.html(html);
  });

  return routes;
}
