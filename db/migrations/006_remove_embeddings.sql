-- Remove movies.embedding e índice associado (substituído por movie_vectors)
DROP INDEX IF EXISTS movies_embedding_idx;
ALTER TABLE movies DROP COLUMN IF EXISTS embedding;
