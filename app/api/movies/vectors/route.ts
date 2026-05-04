import { NextRequest, NextResponse } from "next/server";
import {
  getMovieVectorsByIds,
  upsertMovieVectors,
} from "@/lib/repositories/movieVectorsRepo";
import { parseVectorPayload } from "@/lib/validators/requestValidators";

/** GET /api/movies/vectors?ids=1,2,3 - Busca vetores por movie_id */
export async function GET(request: NextRequest) {
  try {
    const idsParam = request.nextUrl.searchParams.get("ids") ?? "";
    const ids = idsParam
      .split(",")
      .map((value) => parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value));

    if (ids.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const result = await getMovieVectorsByIds(ids);

    return NextResponse.json({ data: result.rows });
  } catch (err) {
    console.error("Vectors fetch error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

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
    const vectors = parseVectorPayload(body);

    if (!Array.isArray(vectors) || vectors.length === 0) {
      return NextResponse.json(
        { error: "vectors must be a non-empty array of { movie_id, vector }" },
        { status: 400 }
      );
    }

    await upsertMovieVectors(vectors);

    return NextResponse.json({
      ok: true,
      updated: vectors.length,
    });
  } catch (err) {
    console.error("Vectors save error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
