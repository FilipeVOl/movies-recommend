/**
 * Popula o banco com dados de data/user.json e data/tmdb_5000_credits.csv.
 * Uso: npx tsx scripts/ingest-users.ts
 */

import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cwd } from "node:process";
import { parse } from "csv-parse/sync";
import { query, getPool } from "@/lib/db";
import { upsertMovieVectors, VECTOR_DIM } from "@/lib/repositories/movieVectorsRepo";

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

type CsvMovie = {
  movie_id: string;
  title: string;
  cast: string;
  crew: string;
};

type Person = {
  job?: string;
  name?: string;
};

const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const hashString = (value: string) => {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return Math.abs(hash >>> 0);
};

const buildCatalogVector = (movie: {
  title: string | null;
  genre: string | null;
  director: string | null;
  cast_count: number | null;
  age_rating: number | null;
}) => {
  const vector = new Array<number>(VECTOR_DIM).fill(0);
  vector[0] = clamp01((movie.age_rating ?? 0) / 18);
  vector[1] = clamp01((movie.cast_count ?? 0) / 200);

  const genreKey = (movie.genre || "").trim().toLowerCase();
  if (genreKey) {
    const genreIdx = 2 + (hashString(genreKey) % 64);
    vector[genreIdx] = 1;
  }

  const directorKey = (movie.director || "").trim().toLowerCase();
  if (directorKey) {
    const directorIdx = 66 + (hashString(directorKey) % 95);
    vector[directorIdx] = 1;
  }

  const titleKey = (movie.title || "").trim().toLowerCase();
  if (titleKey) {
    const titleIdx = 161 + (hashString(titleKey) % 95);
    vector[titleIdx] = 1;
  }

  return vector;
};

const parseMoviesFromCsv = (): LikedMovie[] => {
  const csvPath = join(cwd(), "data", "tmdb_5000_credits.csv");
  const csvText = readFileSync(csvPath, "utf-8");
  const rows = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as CsvMovie[];

  return rows.map((row) => {
    const cast = safeJsonParse<Person[]>(row.cast, []);
    const crew = safeJsonParse<Person[]>(row.crew, []);
    const director = crew.find((person) => person.job === "Director")?.name ?? null;

    return {
      id: Number(row.movie_id),
      title: row.title,
      cast_names: cast
        .slice(0, 10)
        .map((person) => person.name)
        .filter((name): name is string => Boolean(name))
        .join(", "),
      crew: director ?? "",
      cast_count: cast.length,
      genre: "",
      age_rating: 0,
    };
  });
};

const run = async () => {
  const filePath = join(cwd(), "data", "user.json");
  const usersData = JSON.parse(readFileSync(filePath, "utf-8")) as UserData[];
  const csvMovies = parseMoviesFromCsv();

  const moviesMap = new Map<number, LikedMovie>();
  for (const movie of csvMovies) {
    moviesMap.set(movie.id, movie);
  }

  for (const user of usersData) {
    for (const movie of user.liked_movies) {
      moviesMap.set(movie.id, movie);
    }
  }

  for (const user of usersData) {
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

  for (const user of usersData) {
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

  const movieRows = await query(
    `SELECT id, title, genre, director, cast_count, age_rating
     FROM movies`
  );

  const vectors = movieRows.rows.map((row) => ({
    movie_id: Number(row.id),
    vector: buildCatalogVector({
      title: row.title as string | null,
      genre: row.genre as string | null,
      director: row.director as string | null,
      cast_count: row.cast_count as number | null,
      age_rating: row.age_rating as number | null,
    }),
  }));
  await upsertMovieVectors(vectors);

  console.log(
    `Ingest concluído: ${usersData.length} usuários, ${moviesMap.size} filmes (${csvMovies.length} vindos do CSV), ${movieRows.rows.length} vetores gerados.`
  );

  const pool = getPool();
  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
