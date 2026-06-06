import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const createPrismaClient = () => {
  let url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  
  // Vercel/Neon pooled URLs require pgbouncer=true for Prisma to work properly
  if (url && url.includes("-pooler.") && !url.includes("pgbouncer=true")) {
    url += url.includes("?") ? "&pgbouncer=true" : "?pgbouncer=true";
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
