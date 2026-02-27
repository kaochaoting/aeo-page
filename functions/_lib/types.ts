export interface Env {
  AEO_KV: KVNamespace;
  AEO_RATE_LIMITER: DurableObjectNamespace;
  ANTHROPIC_API_KEY?: string;
  AEO_RATE_LIMIT_PER_MINUTE?: string;
}

export interface DirectoryEntry {
  id: string;
  name: string;
  type: string;
  url: string;
  score: number;
  aiAnalyzed: boolean;
  scannedAt: string;
}
