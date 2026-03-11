import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const name = body.name?.trim();
    const age = body.age != null ? parseInt(body.age) : null;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    const result = await query(
      "INSERT INTO users (name, age) VALUES ($1, $2) RETURNING id, name, age",
      [name, age]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await query(`
      SELECT
        u.id,
        u.name,
        u.age,
        COALESCE(
          json_agg(
            json_build_object(
              'id', m.id,
              'title', m.title,
              'cast_names', m.cast_names,
              'director', m.director,
              'cast_count', m.cast_count,
              'genre', m.genre,
              'age_rating', m.age_rating
            )
          ) FILTER (WHERE m.id IS NOT NULL),
          '[]'::json
        ) AS liked_movies
      FROM users u
      LEFT JOIN user_liked_movies ulm ON u.id = ulm.user_id
      LEFT JOIN movies m ON ulm.movie_id = m.id
      GROUP BY u.id
      ORDER BY u.id
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
