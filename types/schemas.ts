type LikedMovie = {
  user_id: number;
  movie_id: number;
  created_at: Date;
};

type User = Readonly<{
  id: number;
  name: string;
  age: number | null;
  liked_movies: Movie[];
}>;

interface Movie {
  id: number;
  title: string;
  cast_names: string | null;
  director: string | null;
  cast_count: number | null;
  genre: string | null;
  age_rating: number | null;
  created_at?: Date;
}

interface MovieVector {
  id: number;
  meta: Movie;
  vector: number[];
}

type UserResponse = {
  id: number;
  name: string;
  age: number | null;
  liked_movies: Movie[];
};

export type { User, LikedMovie, Movie, UserResponse, MovieVector };
