import { createApp } from "./app.ts";

const app = createApp();

const PORT = process.env.PORT || 3000;

app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`Listening on http://localhost:${PORT}`);
});
