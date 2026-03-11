-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de filmes
CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    cast_names TEXT,
    director VARCHAR(255),
    cast_count INTEGER DEFAULT 0,
    genre VARCHAR(100),
    age_rating INTEGER,
    embedding vector(384),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de relacionamento: usuários e filmes que curtiram
CREATE TABLE IF NOT EXISTS user_liked_movies (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, movie_id)
);

-- Índice vetorial: criar depois de popular embeddings
-- CREATE INDEX movies_embedding_idx ON movies USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Índices para consultas comuns
CREATE INDEX IF NOT EXISTS user_liked_movies_user_id_idx ON user_liked_movies(user_id);
CREATE INDEX IF NOT EXISTS user_liked_movies_movie_id_idx ON user_liked_movies(movie_id);
