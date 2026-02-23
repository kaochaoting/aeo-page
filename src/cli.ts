/**
 * AEO CLI — 命令列掃描工具
 * 用法：bun run src/cli.ts https://example.com
 */

import { scanWebsite } from './aeo-scanner';

const url = process.argv[2];

if (!url) {
  console.log(`
  AEO Scanner CLI — AI 友善度掃描

  用法：
    bun run src/cli.ts <URL>

  範例：
    bun run src/cli.ts https://washinmura.jp
    bun run src/cli.ts https://sommelier.co.jp

  設定 AI 分析（可選）：
    ANTHROPIC_API_KEY=sk-ant-xxx bun run src/cli.ts <URL>
  `);
  process.exit(0);
}

console.log(`\n掃描中: ${url}\n`);

try {
  const result = await scanWebsite(url.startsWith('http') ? url : `https://${url}`);

  // 顯示分數
  const scoreColor = result.score >= 70 ? '\x1b[32m' : result.score >= 40 ? '\x1b[33m' : '\x1b[31m';
  console.log(`${scoreColor}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m`);
  console.log(`  ${result.businessName}`);
  console.log(`  ${scoreColor}AI 友善度: ${result.score}/100\x1b[0m`);
  console.log(`  分析模式: ${result.aiAnalyzed ? 'AI 深度分析' : 'Regex 基本模式'}`);
  console.log(`${scoreColor}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m\n`);

  // 顯示問題清單
  for (const issue of result.issues) {
    const icon = issue.status === 'pass' ? '✅' : issue.status === 'warn' ? '⚠️ ' : '❌';
    console.log(`  ${icon} ${issue.title}: ${issue.detail}`);
  }

  // 顯示 llms.txt 路徑
  console.log(`\n  📄 llms.txt 已儲存: data/aeo/shops/`);

  if (!result.aiAnalyzed) {
    console.log(`\n  💡 設定 ANTHROPIC_API_KEY 可啟用 AI 深度分析，品質大幅提升`);
  }

  console.log('');

} catch (err: any) {
  console.error(`\n  ❌ 掃描失敗: ${err.message}\n`);
  process.exit(1);
}
