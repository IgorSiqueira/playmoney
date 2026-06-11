import Redis from "ioredis";

declare global {
  // eslint-disable-next-line no-var
  var _redis: Redis | undefined;
}

function createRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

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
