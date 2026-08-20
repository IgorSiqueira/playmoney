import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
}

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) {
    if (process.env.NODE_ENV === "production") {
      // Rate limiting falls back to in-memory, which does NOT work across multiple instances.
      // In production this means rate limits are per-instance only — a real gap.
      console.warn("[redis] REDIS_URL not set in production — rate limiting is per-instance only");
    }
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
  });

  client.on("error", () => {
    // Silencia logs de erro recorrentes — a lógica de fallback está no rate-limit
  });

  return client;
}

export const redis: Redis | null =
  process.env.NODE_ENV === "production"
    ? (globalThis._redis ??= createRedis() ?? undefined) ?? null
    : (globalThis._redis ??= createRedis() ?? undefined) ?? null;
