import pg from "pg";
import { registerTypes } from "pgvector/pg";

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || "5432"),
});

pool.on("connect", async (client) => {
  await registerTypes(client);
});

export const query = (text: string, params?: unknown[]) =>
  pool.query(text, params);

export const getPool = () => pool;
