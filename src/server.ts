/**
 * AEO.page — 獨立伺服器
 * 用法：bun run src/server.ts
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createAeoRoutes, createAeoStaticRoutes } from './aeo-routes';

const app = new Hono();

// CORS
app.use('/*', cors());

// API 路由
app.route('/api/aeo', createAeoRoutes());

// 靜態路由（llms.txt 託管 + 首頁）
app.route('/aeo', createAeoStaticRoutes());

// 根路徑重導到 /aeo
app.get('/', (c) => c.redirect('/aeo'));

// 啟動
const port = Number(process.env.PORT) || 3000;
console.log(`\n  AEO.page 啟動 → http://localhost:${port}/aeo\n`);

export default {
  port,
  fetch: app.fetch,
};
