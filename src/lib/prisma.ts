import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;

export const isPrismaConfigured = Boolean(
  databaseUrl &&
  databaseUrl.startsWith("postgres") &&
  !databaseUrl.includes("user:password")
);

function createPrismaClient(): PrismaClient {
  try {
    const pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (err) {
    console.warn("Could not initialize PrismaClient with driver adapter:", err);
    return new PrismaClient({ adapter: new PrismaPg(new Pool()) });
  }
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}
