FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat

# ── Stage 1: install dependencies ─────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ── Stage 2: build ────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN node_modules/.bin/prisma generate
RUN npm run build

# ── Stage 3: runtime ──────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 nextjs

# Next.js standalone output (app + its traced deps, no node_modules needed)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder                        /app/public          ./public

# Prisma: CLI + generated client + schema + migrations
# Kept separate from standalone — used only by entrypoint.sh at startup
COPY --from=deps    /app/node_modules/.bin/prisma  ./node_modules/.bin/prisma
COPY --from=deps    /app/node_modules/prisma       ./node_modules/prisma
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma      ./node_modules/@prisma
COPY --from=deps    /app/node_modules/dotenv       ./node_modules/dotenv
COPY --from=builder /app/prisma                    ./prisma
COPY --from=builder /app/prisma.config.ts          ./

COPY --chown=nextjs:nodejs entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

USER nextjs
EXPOSE 3000

CMD ["./entrypoint.sh"]
