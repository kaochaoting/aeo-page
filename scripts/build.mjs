import { access } from 'node:fs/promises';

const required = [
  'public/aeo.html',
  'public/index.html',
  'functions/api/aeo/scan.ts',
  'functions/api/aeo/directory.ts',
  'functions/aeo/shops/[shopId]/llms.txt.ts',
  'wrangler.local.toml',
];

for (const file of required) {
  await access(file);
}

console.log('Build check passed: static assets + Pages Functions are ready.');
