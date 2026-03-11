/**
 * Executa migrations do PostgreSQL.
 * Uso: npx tsx scripts/run-migrations.ts
 *
 * Requer DB_HOST, DB_NAME, DB_USER, DB_PASSWORD no .env
 */

import "dotenv/config";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { getPool, query } from "@/lib/db";

const run = async () => {
  if (!process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_USER) {
    throw new Error("Variáveis DB_HOST, DB_NAME, DB_USER e DB_PASSWORD devem estar definidas no .env");
  }

  const migrationsDir = join(cwd(), "db", "migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), "utf-8");
    await query(sql);
    console.log(`Migration executada: ${file}`);
  }

  console.log("Todas as migrations executadas com sucesso.");

  const pool = getPool();
  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
