import type { Env } from '../../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const shopId = params.shopId as string;
  const content = await env.AEO_KV.get(`AEO_LLMSTXT:${shopId}`);
  if (!content) {
    return new Response('Not found', { status: 404 });
  }

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
