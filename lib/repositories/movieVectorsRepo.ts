import { toSql } from "pgvector/pg";
import { query } from "@/lib/db";

export const VECTOR_DIM = 256;

export type VectorRecord = {
  movie_id: number;
  vector: number[];
};

export const normalizeVector = (vector: number[]) => {
  const padded = [...vector];
  while (padded.length < VECTOR_DIM) padded.push(0);
  return padded.slice(0, VECTOR_DIM);
};

export const upsertMovieVectors = async (vectors: VectorRecord[]) => {
  for (const item of vectors) {
    const normalized = normalizeVector(item.vector);
    await query(
      `INSERT INTO movie_vectors (movie_id, vector, dimensions)
       VALUES ($1, $2, $3)
       ON CONFLICT (movie_id) DO UPDATE SET
         vector = EXCLUDED.vector,
         dimensions = EXCLUDED.dimensions,
         updated_at = NOW()`,
      [item.movie_id, toSql(normalized), item.vector.length]
    );
  }
};

export const getMovieVectorsByIds = async (ids: number[]) => {
  return query(
    `SELECT movie_id, vector, dimensions
     FROM movie_vectors
     WHERE movie_id = ANY($1::int[])`,
    [ids]
  );
};

