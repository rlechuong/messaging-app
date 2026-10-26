import { createApp } from "./app.ts";
import { env } from "./config/env.ts";
import { createPrismaClient } from "./lib/prisma.ts";

const prisma = createPrismaClient(env.DATABASE_URL);

const app = createApp({ prisma, secureCookies: env.NODE_ENV === "production" });

app.listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`Listening on http://localhost:${env.PORT}`);
});
