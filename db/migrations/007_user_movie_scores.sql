CREATE TABLE IF NOT EXISTS user_movie_scores (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  movie_id INTEGER NOT NULL REFERENCES movies(id) ON DELETE CASCADE,
  score DOUBLE PRECISION NOT NULL,
  distance DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, movie_id)
);

CREATE INDEX IF NOT EXISTS user_movie_scores_user_id_idx ON user_movie_scores(user_id);
CREATE INDEX IF NOT EXISTS user_movie_scores_score_idx ON user_movie_scores(score DESC);
