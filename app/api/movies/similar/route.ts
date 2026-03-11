import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/movies/similar?movieId=123&limit=10
 * Retorna filmes similares ao movieId usando busca vetorial (cosine distance).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const movieId = parseInt(searchParams.get("movieId") || "");
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);

    if (isNaN(movieId)) {
      return NextResponse.json(
        { error: "movieId is required and must be a number" },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT m.id, m.title, m.cast_names, m.director, m.cast_count, m.genre, m.age_rating,
              (mv.vector <=> ref.vector) AS distance
       FROM movies m
       JOIN movie_vectors mv ON mv.movie_id = m.id
       CROSS JOIN (SELECT vector FROM movie_vectors WHERE movie_id = $1) ref
       WHERE m.id != $1
       ORDER BY mv.vector <=> ref.vector
       LIMIT $2`,
      [movieId, limit]
    );

    return NextResponse.json({
      data: result.rows.map(({ distance, ...movie }) => ({
        ...movie,
        distance: Number(distance),
      })),
    });
  } catch (err) {
    console.error("Similar movies error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
