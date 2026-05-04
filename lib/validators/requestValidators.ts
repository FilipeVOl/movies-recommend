import type { RecommendationCandidate } from "@/lib/repositories/recommendationRepo";
import type { VectorRecord } from "@/lib/repositories/movieVectorsRepo";

export const parseMovieId = (value: unknown) => {
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

export const parseLikePayload = (body: unknown) => {
  if (!body || typeof body !== "object") return null;
  const movieId = parseMovieId((body as { movieId?: unknown }).movieId);
  if (movieId == null) return null;
  return { movieId };
};

export const parseRecommendationCandidates = (body: unknown): RecommendationCandidate[] => {
  if (!body || typeof body !== "object") return [];
  const candidates = (body as { candidates?: unknown }).candidates;
  if (!Array.isArray(candidates)) return [];

  return candidates
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const movieId = parseMovieId((item as { movie_id?: unknown }).movie_id);
      const score = Number((item as { score?: unknown }).score);
      if (movieId == null || !Number.isFinite(score)) return null;
      return { movie_id: movieId, score };
    })
    .filter((item): item is RecommendationCandidate => item !== null);
};

export const parseVectorPayload = (body: unknown): VectorRecord[] => {
  if (!body || typeof body !== "object") return [];
  const vectors = (body as { vectors?: unknown }).vectors;
  if (!Array.isArray(vectors)) return [];

  return vectors
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const movieId = parseMovieId(
        (item as { movie_id?: unknown; id?: unknown }).movie_id ??
          (item as { movie_id?: unknown; id?: unknown }).id
      );
      const vector =
        (item as { vector?: unknown; encoding?: unknown }).vector ??
        (item as { vector?: unknown; encoding?: unknown }).encoding;
      if (movieId == null || !Array.isArray(vector)) return null;
      const numericVector = vector.map(Number);
      if (!numericVector.every(Number.isFinite)) return null;
      return { movie_id: movieId, vector: numericVector };
    })
    .filter((item): item is VectorRecord => item !== null);
};

