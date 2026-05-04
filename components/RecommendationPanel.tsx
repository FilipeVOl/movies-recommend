"use client";

import { useRef } from "react";
import MovieCard from "./MovieCard";
import type { Movie } from "./MovieCard";

type RecommendationPanelProps = {
  userId: number | null;
  likedMovieIds: Set<number>;
  onToggleLike: (movieId: number) => void;
  isTraining: boolean;
  workerRecommendations?: Movie[];
};

export default function RecommendationPanel({
  userId,
  likedMovieIds,
  onToggleLike,
  isTraining,
  workerRecommendations = [],
}: RecommendationPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const recommendations = workerRecommendations;

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({
      left: dir === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  if (!userId) return null;

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Recommended for You
          </h2>
          <p className="text-xs text-zinc-400">
            Based on users with similar taste
          </p>
        </div>
        {recommendations.length > 3 && (
          <div className="flex gap-1">
            <button
              onClick={() => scroll("left")}
              className="rounded-full border border-zinc-300 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              className="rounded-full border border-zinc-300 p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {isTraining && recommendations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-400">
            No recommendations yet. Keep liking movies to improve worker suggestions.
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin"
        >
          {recommendations.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              isLiked={likedMovieIds.has(movie.id)}
              onToggleLike={onToggleLike}
              compact
            />
          ))}
        </div>
      )}
    </section>
  );
}
