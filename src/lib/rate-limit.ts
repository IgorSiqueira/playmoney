import { redis } from "./redis";

// ── In-memory fallback (single-instance / dev) ────────────────────────────────

interface Entry { count: number; resetAt: number }
const memStore = new Map<string, Entry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memStore) {
    if (entry.resetAt < now) memStore.delete(key);
  }
}, 10 * 60 * 1000);

function memRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || entry.resetAt < now) {
    const resetAt = now + windowMs;
    memStore.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) return { ok: false, remaining: 0, resetAt: entry.resetAt };

  entry.count++;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ── Redis fixed-window ────────────────────────────────────────────────────────

async function redisRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const ttlSec   = Math.ceil(windowMs / 1000);

  // INCR é atômico — safe para múltiplas instâncias
  const count = await redis!.incr(redisKey);

  if (count === 1) {
    // Primeira requisição na janela — define expiração
    await redis!.expire(redisKey, ttlSec);
  }

  const resetAt = Date.now() + windowMs;

  if (count > limit) return { ok: false, remaining: 0, resetAt };
  return { ok: true, remaining: limit - count, resetAt };
}

// ── API pública ───────────────────────────────────────────────────────────────

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Rate limiter com janela fixa.
 * Usa Redis quando REDIS_URL está configurado; cai para in-memory caso contrário.
 *
 * @param key      Chave do bucket (ex: `register:${ip}`)
 * @param limit    Máx de requisições na janela
 * @param windowMs Duração da janela em ms
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (redis) {
    try {
      return await redisRateLimit(key, limit, windowMs);
    } catch {
      // Redis indisponível — degrada para in-memory sem derrubar a request
    }
  }
  return memRateLimit(key, limit, windowMs);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export function rateLimitResponse(resetAt: number) {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Muitas requisições. Tente novamente em breve." }),
    {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    }
  );
}
