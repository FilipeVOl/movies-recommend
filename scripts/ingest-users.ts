/**
 * Popula o banco com dados de data/user.json.
 * Uso: npx tsx scripts/ingest-users.ts
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { query, getPool } from "@/lib/db";

type LikedMovie = {
  id: number;
  title: string;
  cast_names: string;
  crew: string;
  cast_count: number;
  genre: string;
  age_rating: number;
};

type UserData = {
  id: number;
  name: string;
  age: number;
  liked_movies: LikedMovie[];
};

const run = async () => {
  const filePath = join(cwd(), "data", "user.json");
  const data = JSON.parse(readFileSync(filePath, "utf-8")) as UserData[];

  const moviesMap = new Map<number, LikedMovie>();
  for (const user of data) {
    for (const movie of user.liked_movies) {
      moviesMap.set(movie.id, movie);
    }
  }

  for (const user of data) {
    await query(
      `INSERT INTO users (id, name, age) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age`,
      [user.id, user.name, user.age ?? null]
    );
  }

  for (const movie of moviesMap.values()) {
    await query(
      `INSERT INTO movies (id, title, cast_names, director, cast_count, genre, age_rating)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         cast_names = EXCLUDED.cast_names,
         director = EXCLUDED.director,
         cast_count = EXCLUDED.cast_count,
         genre = EXCLUDED.genre,
         age_rating = EXCLUDED.age_rating`,
      [movie.id, movie.title, movie.cast_names, movie.crew, movie.cast_count, movie.genre ?? null, movie.age_rating ?? null]
    );
  }

  for (const user of data) {
    for (const movie of user.liked_movies) {
      await query(
        `INSERT INTO user_liked_movies (user_id, movie_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, movie_id) DO NOTHING`,
        [user.id, movie.id]
      );
    }
  }

  await query("SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT COALESCE(MAX(id), 1) FROM users))");

  console.log(`Ingest concluído: ${data.length} usuários, ${moviesMap.size} filmes.`);

  const pool = getPool();
  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
