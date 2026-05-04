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

let vectorTypesReady = false;
let vectorTypesInitPromise: Promise<void> | null = null;

const isMissingVectorTypeError = (error: unknown) =>
  error instanceof Error &&
  error.message.toLowerCase().includes("vector type not found");

const ensureVectorTypes = async () => {
  if (vectorTypesReady) {
    return;
  }

  if (!vectorTypesInitPromise) {
    vectorTypesInitPromise = (async () => {
      const client = await pool.connect();

      try {
        await registerTypes(client);
        vectorTypesReady = true;
      } catch (error) {
        if (!isMissingVectorTypeError(error)) {
          throw error;
        }
      } finally {
        client.release();
      }
    })().finally(() => {
      vectorTypesInitPromise = null;
    });
  }

  await vectorTypesInitPromise;
};

export const query = async (text: string, params?: unknown[]) => {
  await ensureVectorTypes();
  return pool.query(text, params);
};

export const getPool = () => pool;
