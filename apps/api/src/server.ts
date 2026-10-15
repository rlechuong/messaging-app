import { createApp } from "./app.ts";
import { env } from "./config/env.ts";

const app = createApp();

app.listen(env.PORT, (error) => {
  if (error) throw error;
  console.log(`Listening on http://localhost:${env.PORT}`);
});
