import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
  const offset = parseInt(searchParams.get("offset") || "0");
  const search = searchParams.get("search")?.trim() || "";
  const genre = searchParams.get("genre")?.trim() || "";
  const director = searchParams.get("director")?.trim() || "";
  const minAgeRating = parseInt(searchParams.get("minAgeRating") || "");
  const maxAgeRating = parseInt(searchParams.get("maxAgeRating") || "");
  const cast = searchParams.get("cast")?.trim() || "";

  try {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`title ILIKE $${idx++}`);
      params.push(`%${search}%`);
    }
    if (genre) {
      conditions.push(`genre ILIKE $${idx++}`);
      params.push(`%${genre}%`);
    }
    if (director) {
      conditions.push(`director ILIKE $${idx++}`);
      params.push(`%${director}%`);
    }
    if (!Number.isNaN(minAgeRating)) {
      conditions.push(`age_rating >= $${idx++}`);
      params.push(minAgeRating);
    }
    if (!Number.isNaN(maxAgeRating)) {
      conditions.push(`age_rating <= $${idx++}`);
      params.push(maxAgeRating);
    }

    const castNames = cast
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    for (const castName of castNames) {
      conditions.push(`cast_names ILIKE $${idx++}`);
      params.push(`%${castName}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = await query(
      `SELECT COUNT(*) FROM movies ${whereClause}`,
      params
    );

    const total = parseInt(countQuery.rows[0].count);

    const moviesResult = await query(
      `SELECT id, title, cast_names, director, cast_count, genre, age_rating
       FROM movies
       ${whereClause}
       ORDER BY title
       LIMIT $${idx++} OFFSET $${idx}`,
      [...params, limit, offset]
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
