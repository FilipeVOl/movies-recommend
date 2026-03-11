/**
 * Cria o banco de dados movies_recommend se não existir.
 * Uso: npx tsx scripts/create-database.ts
 *
 * Requer DB_HOST, DB_NAME, DB_USER, DB_PASSWORD no .env
 */

import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const run = async () => {
  if (!process.env.DB_HOST || !process.env.DB_USER) {
    throw new Error(
      "Variáveis DB_HOST, DB_USER e DB_PASSWORD devem estar definidas no .env"
    );
  }

  const dbName = process.env.DB_NAME || "movies_recommend";

  const pool = new Pool({
    host: process.env.DB_HOST,
    database: "postgres",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
  });

  const result = await pool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );

  if (result.rows.length === 0) {
    await pool.query(`CREATE DATABASE "${dbName}"`);
    console.log(`Banco "${dbName}" criado com sucesso.`);
  } else {
    console.log(`Banco "${dbName}" já existe.`);
  }

  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
