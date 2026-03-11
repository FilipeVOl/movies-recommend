/**
 * Dropa tabelas movies e user_liked_movies para recriar com schema limpo.
 * Uso: npm run db:reset
 *
 * Requer DB_HOST, DB_NAME, DB_USER, DB_PASSWORD no .env
 */

import "dotenv/config";
import { getPool, query } from "@/lib/db";

const run = async () => {
  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER) {
    throw new Error("Variáveis DB_HOST, DB_NAME, DB_USER e DB_PASSWORD devem estar definidas no .env");
  }

  await query("DROP TABLE IF EXISTS user_liked_movies");
  await query("DROP TABLE IF EXISTS movies");
  console.log("Tabelas movies e user_liked_movies removidas.");

  const pool = getPool();
  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
