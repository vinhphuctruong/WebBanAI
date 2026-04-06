import { Pool } from "pg";
import { env } from "./env.js";

export const pgPool = new Pool({
  host: env.postgres.host,
  port: env.postgres.port,
  database: env.postgres.database,
  user: env.postgres.user,
  password: env.postgres.password,
  max: 15
});

export async function query(text, params = []) {
  return pgPool.query(text, params);
}

export async function withTransaction(work) {
  const client = await pgPool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
