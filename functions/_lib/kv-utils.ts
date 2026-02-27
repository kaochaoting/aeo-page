export const CACHE_TTL_SECONDS = 60 * 60 * 24;
export const RATE_LIMIT_WINDOW_SECONDS = 60;

const TRACKING_KEYS = new Set([
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'ref',
  'source',
]);

export function normalizeUrl(input: string): string {
  const value = input.trim();
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  const parsed = new URL(withProtocol);

  parsed.hash = '';
  parsed.hostname = parsed.hostname.toLowerCase();

  const params = Array.from(parsed.searchParams.entries())
    .filter(([key]) => !key.toLowerCase().startsWith('utm_') && !TRACKING_KEYS.has(key.toLowerCase()))
    .sort(([a], [b]) => a.localeCompare(b));

  parsed.search = '';
  for (const [key, val] of params) {
    parsed.searchParams.append(key, val);
  }

  if (parsed.pathname !== '/' && parsed.pathname.endsWith('/')) {
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
  }

  return parsed.toString();
}

export function ipFromHeaders(request: Request): string {
  const connectingIp = request.headers.get('CF-Connecting-IP');
  if (connectingIp) return connectingIp;
  const xff = request.headers.get('X-Forwarded-For');
  if (xff) return xff.split(',')[0].trim();
  return 'unknown';
}

export function minuteBucket(now = Date.now()): string {
  return Math.floor(now / 60000).toString();
}
