-- Tabela para vetores de filmes (output de encodeMovie do modelo treinado)
CREATE TABLE IF NOT EXISTS movie_vectors (
  movie_id INTEGER PRIMARY KEY REFERENCES movies(id) ON DELETE CASCADE,
  vector vector(256) NOT NULL,
  dimensions INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS movie_vectors_vector_idx ON movie_vectors
  USING hnsw (vector vector_cosine_ops);
