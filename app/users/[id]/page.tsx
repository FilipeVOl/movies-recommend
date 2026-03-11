"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import MovieGrid from "@/components/MovieGrid";
import MovieCard from "@/components/MovieCard";
import type { Movie } from "@/components/MovieCard";

type UserData = {
  id: number;
  name: string;
  age: number | null;
  liked_movies: Movie[];
};

export default function UserPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<UserData | null>(null);
  const [likedMovieIds, setLikedMovieIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/users");
        const users: UserData[] = await res.json();
        const found = users.find((u) => u.id === parseInt(id));
        if (found) {
          setUser(found);
          setLikedMovieIds(new Set(found.liked_movies.map((m) => m.id)));
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleToggleLike = useCallback(
    async (movieId: number) => {
      if (!user) return;

      setLikedMovieIds((prev) => {
        const next = new Set(prev);
        if (next.has(movieId)) next.delete(movieId);
        else next.add(movieId);
        return next;
      });

      try {
        const res = await fetch(`/api/users/${user.id}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId }),
        });

        if (!res.ok) throw new Error("Failed to toggle like");

        setUser((prev) => {
          if (!prev) return prev;
          const alreadyLiked = prev.liked_movies.some((m) => m.id === movieId);
          return {
            ...prev,
            liked_movies: alreadyLiked
              ? prev.liked_movies.filter((m) => m.id !== movieId)
              : [...prev.liked_movies, { id: movieId, title: "", cast_names: null, director: null, cast_count: null, genre: null, age_rating: null }],
          };
        });
      } catch (err) {
        console.error("Like toggle failed:", err);
        setLikedMovieIds((prev) => {
          const next = new Set(prev);
          if (next.has(movieId)) next.delete(movieId);
          else next.add(movieId);
          return next;
        });
      }
    },
    [user]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <p className="text-lg text-zinc-500">User not found</p>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Back to Home
        </Link>
      </div>
    );
  }

  const likedMovies = user.liked_movies.filter((m) => m.title);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-5 py-4 dark:border-zinc-800 dark:bg-zinc-900 lg:px-8">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
            title="Back to home"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-base font-bold text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400">
              {user.name[0]}
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                {user.name}
                {user.age != null && (
                  <span className="ml-2 text-sm font-normal text-zinc-400">{user.age} years old</span>
                )}
              </h1>
              <p className="text-xs text-zinc-400">
                {likedMovieIds.size} movies liked
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-5 lg:p-8">
        {likedMovies.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Liked Movies
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {likedMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  isLiked={true}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </div>
          </section>
        )}

        <MovieGrid
          likedMovieIds={likedMovieIds}
          onToggleLike={handleToggleLike}
        />
      </main>
    </div>
  );
}
