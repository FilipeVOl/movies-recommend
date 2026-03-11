import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { toSql } from "pgvector/pg";

const VECTOR_DIM = 256;

/** POST /api/movies/vectors - Salva vetores do modelo (encodeMovie) em movie_vectors */
export async function POST(request: NextRequest) {
  try {
    let body: { vectors?: unknown };
    try {
      const text = await request.text();
      if (!text?.trim()) {
        return NextResponse.json(
          { error: "Request body is empty" },
          { status: 400 }
        );
      }
      body = JSON.parse(text) as { vectors?: unknown };
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }
    const vectors = body.vectors as { movie_id?: number; id?: number; vector?: number[]; encoding?: number[] }[];

    if (!Array.isArray(vectors) || vectors.length === 0) {
      return NextResponse.json(
        { error: "vectors must be a non-empty array of { movie_id, vector }" },
        { status: 400 }
      );
    }

    for (const item of vectors) {
      const movieId = item.movie_id ?? item.id;
      const vector = item.vector ?? item.encoding;

      if (typeof movieId !== "number" || !Array.isArray(vector)) {
        return NextResponse.json(
          { error: "Each item must have movie_id (number) and vector or encoding (number[])" },
          { status: 400 }
        );
      }

      const padded = [...vector];
      while (padded.length < VECTOR_DIM) padded.push(0);
      const slice = padded.slice(0, VECTOR_DIM);

      await query(
        `INSERT INTO movie_vectors (movie_id, vector, dimensions)
         VALUES ($1, $2, $3)
         ON CONFLICT (movie_id) DO UPDATE SET
           vector = EXCLUDED.vector,
           dimensions = EXCLUDED.dimensions,
           updated_at = NOW()`,
        [movieId, toSql(slice), vector.length]
      );
    }

    return NextResponse.json({
      ok: true,
      updated: vectors.length,
    });
  } catch (err) {
    console.error("Vectors save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
