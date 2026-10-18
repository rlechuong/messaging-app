import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.ts";

export const createPrismaClient = (connectionString: string) => {
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
};
