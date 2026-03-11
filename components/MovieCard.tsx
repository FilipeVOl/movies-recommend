"use client";

type Movie = {
  id: number;
  title: string;
  cast_names: string | null;
  director: string | null;
  cast_count: number | null;
  genre: string | null;
  age_rating: number | null;
};

type MovieCardProps = {
  movie: Movie;
  isLiked: boolean;
  onToggleLike: (movieId: number) => void;
  compact?: boolean;
};

const genreColors = [
  "from-violet-600 to-indigo-700",
  "from-rose-600 to-pink-700",
  "from-amber-500 to-orange-600",
  "from-emerald-500 to-teal-700",
  "from-cyan-500 to-blue-700",
  "from-fuchsia-500 to-purple-700",
  "from-lime-500 to-green-700",
  "from-red-500 to-rose-700",
];

function hashColor(id: number) {
  return genreColors[id % genreColors.length];
}

function getInitials(title: string) {
  return title
    .split(/[\s:]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function MovieCard({
  movie,
  isLiked,
  onToggleLike,
  compact,
}: MovieCardProps) {
  const castList = movie.cast_names
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900 ${
        compact ? "min-w-[220px] max-w-[220px]" : ""
      }`}
    >
      <div
        className={`relative flex items-center justify-center bg-linear-to-br ${hashColor(movie.id)} ${
          compact ? "h-28" : "h-36"
        }`}
      >
        <span className="text-3xl font-bold text-white/80 select-none">
          {getInitials(movie.title)}
        </span>

        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          {movie.genre && (
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {movie.genre}
            </span>
          )}
          {movie.cast_count != null && (
            <span className="rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {movie.cast_count} cast
            </span>
          )}
        </div>

        {movie.age_rating != null && (
          <span className="absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center rounded bg-black/40 px-1.5 text-[10px] font-bold text-white backdrop-blur-sm">
            {movie.age_rating === 0 ? "L" : `${movie.age_rating}+`}
          </span>
        )}

        <button
          onClick={() => onToggleLike(movie.id)}
          className={`absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            isLiked
              ? "bg-red-500 text-white shadow-md shadow-red-500/30"
              : "bg-black/20 text-white/80 hover:bg-red-500 hover:text-white backdrop-blur-sm"
          }`}
          title={isLiked ? "Unlike" : "Like"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={2}
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3
          className="line-clamp-2 text-sm font-semibold leading-tight text-zinc-900 dark:text-zinc-100"
          title={movie.title}
        >
          {movie.title}
        </h3>

        {movie.director && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-zinc-600 dark:text-zinc-300">Dir.</span>{" "}
            {movie.director}
          </p>
        )}

        {castList && castList.length > 0 && !compact && (
          <p className="mt-auto line-clamp-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            {castList.join(", ")}
          </p>
        )}
      </div>
    </div>
  );
}

export type { Movie };
