import { createApp } from "../app.ts";
import { testPrisma } from "./database.ts";

export const createTestApp = () => createApp({ prisma: testPrisma, secureCookies: false });
