import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const movieId = body.movieId;

    if (!movieId) {
      return NextResponse.json(
        { error: "movieId is required" },
        { status: 400 }
      );
    }

    const movieExists = await query(
      "SELECT 1 FROM movies WHERE id = $1",
      [movieId]
    );
    if (movieExists.rows.length === 0) {
      return NextResponse.json(
        { error: `Movie ${movieId} does not exist in catalog` },
        { status: 400 }
      );
    }

    const existing = await query(
      "SELECT 1 FROM user_liked_movies WHERE user_id = $1 AND movie_id = $2",
      [userId, movieId]
    );

    if (existing.rows.length > 0) {
      await query(
        "DELETE FROM user_liked_movies WHERE user_id = $1 AND movie_id = $2",
        [userId, movieId]
      );
      return NextResponse.json({ liked: false });
    } else {
      await query(
        "INSERT INTO user_liked_movies (user_id, movie_id) VALUES ($1, $2)",
        [userId, movieId]
      );
      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error("Failed to toggle like:", error);
    return NextResponse.json(
      { error: "Failed to toggle like" },
      { status: 500 }
    );
  }
}
