ALTER TABLE users ADD COLUMN IF NOT EXISTS age INTEGER;

-- Populate age for existing seed users
UPDATE users SET age = 32 WHERE id = 1 AND age IS NULL;
UPDATE users SET age = 27 WHERE id = 2 AND age IS NULL;
UPDATE users SET age = 41 WHERE id = 3 AND age IS NULL;
UPDATE users SET age = 23 WHERE id = 4 AND age IS NULL;
UPDATE users SET age = 35 WHERE id = 5 AND age IS NULL;

-- Populate genre and age_rating for existing seed movies
UPDATE movies SET genre = 'Sci-Fi',     age_rating = 12 WHERE id = 19995  AND genre IS NULL;
UPDATE movies SET genre = 'Adventure',  age_rating = 12 WHERE id = 285    AND genre IS NULL;
UPDATE movies SET genre = 'Action',     age_rating = 14 WHERE id = 206647 AND genre IS NULL;
UPDATE movies SET genre = 'Action',     age_rating = 14 WHERE id = 49026  AND genre IS NULL;
UPDATE movies SET genre = 'Sci-Fi',     age_rating = 12 WHERE id = 49529  AND genre IS NULL;
UPDATE movies SET genre = 'Action',     age_rating = 12 WHERE id = 559    AND genre IS NULL;
UPDATE movies SET genre = 'Animation',  age_rating = 0  WHERE id = 38757  AND genre IS NULL;
UPDATE movies SET genre = 'Action',     age_rating = 12 WHERE id = 99861  AND genre IS NULL;
UPDATE movies SET genre = 'Fantasy',    age_rating = 10 WHERE id = 767    AND genre IS NULL;
UPDATE movies SET genre = 'Action',     age_rating = 14 WHERE id = 209112 AND genre IS NULL;
