import { query } from "@/lib/db";

export type RecommendationCandidate = {
  movie_id: number;
  score: number;
};

export type RecommendationRow = {
  id: number;
  title: string;
  cast_names: string | null;
  director: string | null;
  cast_count: number | null;
  genre: string | null;
  age_rating: number | null;
  model_score: number;
  distance: number;
};

export const rankAndPersistRecommendations = async (
  userId: number,
  candidates: RecommendationCandidate[],
  limit = 3
) => {
  const movieIds = candidates.map((candidate) => candidate.movie_id);
  const scores = candidates.map((candidate) => candidate.score);

  return query(
    `WITH user_vector AS (
       SELECT AVG(mv.vector) AS vector
       FROM user_liked_movies ulm
       JOIN movie_vectors mv ON mv.movie_id = ulm.movie_id
       WHERE ulm.user_id = $1
     ),
     candidate_scores AS (
       SELECT * FROM UNNEST($2::int[], $3::float8[]) AS t(movie_id, score)
     ),
     ranked AS (
       SELECT
         m.id,
         m.title,
         m.cast_names,
         m.director,
         m.cast_count,
         m.genre,
         m.age_rating,
         cs.score AS model_score,
         (mv.vector <=> uv.vector) AS distance
       FROM user_vector uv
       JOIN candidate_scores cs ON TRUE
       JOIN movie_vectors mv ON mv.movie_id = cs.movie_id
       JOIN movies m ON m.id = mv.movie_id
       WHERE uv.vector IS NOT NULL
         AND m.id NOT IN (SELECT movie_id FROM user_liked_movies WHERE user_id = $1)
       ORDER BY mv.vector <=> uv.vector
       LIMIT $4
     ),
     persisted AS (
       INSERT INTO user_movie_scores (user_id, movie_id, score, distance)
       SELECT $1, r.id, r.model_score, r.distance
       FROM ranked r
       ON CONFLICT (user_id, movie_id)
       DO UPDATE SET
         score = EXCLUDED.score,
         distance = EXCLUDED.distance,
         updated_at = NOW()
       RETURNING movie_id
     )
     SELECT
       r.id,
       r.title,
       r.cast_names,
       r.director,
       r.cast_count,
       r.genre,
       r.age_rating,
       r.model_score,
       r.distance
     FROM ranked r`,
    [userId, movieIds, scores, limit]
  );
};

export const getCachedRecommendations = async (userId: number, limit = 3) => {
  return query(
    `SELECT
       m.id,
       m.title,
       m.cast_names,
       m.director,
       m.cast_count,
       m.genre,
       m.age_rating,
       ums.score AS model_score,
       ums.distance
     FROM user_movie_scores ums
     JOIN movies m ON m.id = ums.movie_id
     WHERE ums.user_id = $1
     ORDER BY ums.score DESC, ums.distance ASC
     LIMIT $2`,
    [userId, limit]
  );
};

