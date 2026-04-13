import app from "./app.js";
import { env } from "./config/env.js";
import { pgPool } from "./config/postgres.js";
import { connectMongo } from "./config/mongo.js";
import { initPostgres } from "./db/initPostgres.js";

async function retry(label, fn, options = {}) {
  const retries = options.retries ?? 20;
  const delayMs = options.delayMs ?? 2000;
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await fn();
      console.log(`${label} connected (attempt ${attempt}/${retries})`);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`${label} not ready (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw new Error(`${label} unavailable after ${retries} attempts: ${lastError?.message || "unknown error"}`);
}

async function bootstrap() {
  await retry("MongoDB", connectMongo, { retries: 30, delayMs: 2000 });
  await retry("PostgreSQL", initPostgres, { retries: 30, delayMs: 2000 });

  app.listen(env.port, () => {
    console.log(`Node backend running at http://localhost:${env.port}`);
  });
}

bootstrap().catch(async (err) => {
  console.error("Boot failed:", err);
  await pgPool.end().catch(() => {});
  process.exit(1);
});

process.on("SIGINT", async () => {
  await pgPool.end().catch(() => {});
  process.exit(0);
});
