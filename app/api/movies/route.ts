import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search")?.trim() || "";

  try {
    const countQuery = search
      ? await query(
          "SELECT COUNT(*) FROM movies WHERE title ILIKE $1",
          [`%${search}%`]
        )
      : await query("SELECT COUNT(*) FROM movies");

    const total = parseInt(countQuery.rows[0].count);

    const moviesResult = search
      ? await query(
          `SELECT id, title, cast_names, director, cast_count, genre, age_rating
           FROM movies
           WHERE title ILIKE $1
           ORDER BY title
           LIMIT $2 OFFSET $3`,
          [`%${search}%`, limit, offset]
        )
      : await query(
          `SELECT id, title, cast_names, director, cast_count, genre, age_rating
           FROM movies
           ORDER BY title
           LIMIT $1 OFFSET $2`,
          [limit, offset]
        );

    return NextResponse.json({
      data: moviesResult.rows,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Failed to fetch movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
}
