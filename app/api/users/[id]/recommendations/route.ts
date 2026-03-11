import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { toSql } from "pgvector/pg";
import { averageVectors } from "@/lib/helpers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const VECTOR_DIM = 256;

/**
 * GET /api/users/[id]/recommendations
 * Recomenda filmes usando vetores do modelo (movie_vectors) e busca por similaridade.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const likedResult = await query(
      `SELECT mv.vector
       FROM user_liked_movies ulm
       JOIN movie_vectors mv ON mv.movie_id = ulm.movie_id
       WHERE ulm.user_id = $1`,
      [userId]
    );

    if (likedResult.rows.length === 0) {
      return NextResponse.json([]);
    }

    const toArray = (v: unknown): number[] => {
      if (Array.isArray(v)) return v.map(Number);
      if (typeof v === "string") return JSON.parse(v) as number[];
      return [];
    };

    const likedVectors = likedResult.rows.map((r) => toArray(r.vector));
    const queryVector = averageVectors(likedVectors);

    const padded = [...queryVector];
    while (padded.length < VECTOR_DIM) padded.push(0);
    const slice = padded.slice(0, VECTOR_DIM);

    const result = await query(
      `SELECT m.id, m.title, m.cast_names, m.director, m.cast_count, m.genre, m.age_rating,
              (mv.vector <=> $1::vector) AS distance
       FROM movies m
       JOIN movie_vectors mv ON mv.movie_id = m.id
       WHERE m.id NOT IN (SELECT movie_id FROM user_liked_movies WHERE user_id = $2)
       ORDER BY mv.vector <=> $1::vector
       LIMIT 3`,
      [toSql(slice), userId]
    );

    const movies = result.rows.map(({ distance, ...m }) => ({
      ...m,
      distance: distance != null ? Number(distance) : null,
    }));

    return NextResponse.json(movies);
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
