export interface RateLimitRequest {
  ip: string;
  limit: number;
}

interface RateLimitState {
  bucket: number;
  count: number;
}

export class RateLimiterDO {
  constructor(private readonly state: DurableObjectState) {}

  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const body = (await request.json()) as RateLimitRequest;
    const ip = body.ip || 'unknown';
    const limit = Number.isFinite(body.limit) && body.limit > 0 ? body.limit : 30;
    const now = Date.now();
    const currentBucket = Math.floor(now / 60000);
    const key = `rl:${ip}`;

    const record = (await this.state.storage.get<RateLimitState>(key)) || {
      bucket: currentBucket,
      count: 0,
    };

    const next: RateLimitState = record.bucket === currentBucket
      ? record
      : { bucket: currentBucket, count: 0 };

    if (next.count >= limit) {
      const retryAfter = Math.max(1, 60 - Math.floor((now % 60000) / 1000));
      return Response.json({ allowed: false, retryAfter }, { status: 200 });
    }

    next.count += 1;
    await this.state.storage.put(key, next);

    return Response.json({ allowed: true, retryAfter: 0, count: next.count }, { status: 200 });
  }
}
