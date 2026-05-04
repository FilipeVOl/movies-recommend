import { NextRequest, NextResponse } from "next/server";
import {
  generateRecommendations,
  readCachedRecommendations,
} from "@/lib/services/recommendationService";
import { parseRecommendationCandidates } from "@/lib/validators/requestValidators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/users/[id]/recommendations
 * 1) Recebe candidatos e score do modelo (worker)
 * 2) Persiste score por usuário/filme
 * 3) Faz varredura vetorial no DB dentro dos candidatos e retorna top 3
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const candidates = parseRecommendationCandidates(body);
    const rows = await generateRecommendations(userId, candidates);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Recommendations error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

/**
 * GET /api/users/[id]/recommendations
 * Compatibilidade: últimos top 3 persistidos para o usuário.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const userId = parseInt(id, 10);

  if (Number.isNaN(userId)) {
    return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
  }

  try {
    const rows = await readCachedRecommendations(userId);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Recommendations cache read error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
