import {
  getCachedRecommendations,
  rankAndPersistRecommendations,
  type RecommendationCandidate,
  type RecommendationRow,
} from "@/lib/repositories/recommendationRepo";

const sanitizeCandidates = (candidates: RecommendationCandidate[]) =>
  candidates
    .filter(
      (item) => Number.isFinite(item?.movie_id) && Number.isFinite(item?.score)
    )
    .map((item) => ({
      movie_id: Number(item.movie_id),
      score: Math.max(0, Math.min(1, Number(item.score))),
    }));

const normalizeRows = (rows: RecommendationRow[]) =>
  rows.map((row) => ({
    ...row,
    model_score: Number(row.model_score),
    distance: Number(row.distance),
  }));

export const generateRecommendations = async (
  userId: number,
  candidates: RecommendationCandidate[]
) => {
  const sanitized = sanitizeCandidates(candidates);
  if (sanitized.length === 0) {
    return [];
  }

  const result = await rankAndPersistRecommendations(userId, sanitized, 3);
  return normalizeRows(result.rows as RecommendationRow[]);
};

export const readCachedRecommendations = async (userId: number) => {
  const result = await getCachedRecommendations(userId, 3);
  return normalizeRows(result.rows as RecommendationRow[]);
};

