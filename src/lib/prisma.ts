import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    max: parseInt(process.env.DB_POOL_MAX ?? "10"),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT_MS ?? "30000"),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT_MS ?? "5000"),
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma || createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
