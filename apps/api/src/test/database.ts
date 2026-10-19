import { createPrismaClient } from "../lib/prisma.ts";
import { getTestDatabaseUrl } from "./test-database-url.ts";

export const testPrisma = createPrismaClient(getTestDatabaseUrl());

export const resetDatabase = async () => {
  const tables = await testPrisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tables.length === 0) return;

  const tableList = tables.map(({ tablename }) => `"${tablename}"`).join(", ");
  await testPrisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableList} CASCADE`);
};
