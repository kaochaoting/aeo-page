import type { DirectoryEntry, Env } from '../../_lib/types';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const directory = (await env.AEO_KV.get('AEO_DIRECTORY', 'json') as DirectoryEntry[] | null) || [];
  return Response.json(directory);
};
