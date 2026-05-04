"use client";

import { useState, useEffect, useCallback } from "react";
import UserSelector from "@/components/UserSelector";
import type { UserSummary } from "@/components/UserSelector";
import MovieGrid from "@/components/MovieGrid";
import MovieCard from "@/components/MovieCard";
import RecommendationPanel from "@/components/RecommendationPanel";
import { useRecommendationsWorker } from "@/hooks/useRecommendationsWorker";
import type { Movie } from "@/types/schemas";

type ApiUser = {
  id: number;
  name: string;
  age: number | null;
  liked_movies: Movie[];
};

export default function Home() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [likedMovieIds, setLikedMovieIds] = useState<Set<number>>(new Set());
  const { trainingProgress, recommendations: workerRecommendations, triggerTrain } =
    useRecommendationsWorker({ selectedUserId });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        const data: ApiUser[] = await res.json();
        setUsers(data);
        if (data.length > 0 && !selectedUserId) {
          setSelectedUserId(data[0].id);
        }

        if (data.length > 0) {
          triggerTrain();
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
  }, [triggerTrain]);

  useEffect(() => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user) {
      setLikedMovieIds(new Set(user.liked_movies.map((m) => m.id)));
    } else {
      setLikedMovieIds(new Set());
    }
  }, [selectedUserId, users]);

  const handleToggleLike = useCallback(
    async (movieId: number) => {
      if (!selectedUserId) return;

      setLikedMovieIds((prev) => {
        const next = new Set(prev);
        if (next.has(movieId)) next.delete(movieId);
        else next.add(movieId);
        return next;
      });

      try {
        const res = await fetch(`/api/users/${selectedUserId}/like`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ movieId }),
        });

        if (!res.ok) throw new Error("Failed to toggle like");

        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== selectedUserId) return u;
            const alreadyLiked = u.liked_movies.some((m) => m.id === movieId);
            return {
              ...u,
              liked_movies: alreadyLiked
                ? u.liked_movies.filter((m) => m.id !== movieId)
                : [...u.liked_movies, { id: movieId, title: "", cast_names: null, director: null, cast_count: null, genre: null, age_rating: null }],
            };
          })
        );

        if (selectedUserId) {
          setTimeout(() => {
            // Request new recommendations after persisted like state is updated.
            // Triggering train here keeps model aligned with latest likes.
            triggerTrain();
          }, 0);
        }
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
    [selectedUserId, triggerTrain]
  );

  const handleUserCreated = useCallback(
    (user: { id: number; name: string; age: number | null }) => {
      const newUser: ApiUser = { id: user.id, name: user.name, age: user.age, liked_movies: [] };
      setUsers((prev) => [...prev, newUser]);
      setSelectedUserId(user.id);
    },
    []
  );

  const userSummaries: UserSummary[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    age: u.age,
    likedCount: u.liked_movies.length,
  }));

  const selectedUser = users.find((u) => u.id === selectedUserId);
  const likedMovies = selectedUser?.liked_movies.filter((m) => m.title) ?? [];
  const handleRetrainModel = useCallback(() => {
    triggerTrain();
  }, [triggerTrain]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 lg:flex-row">
      <UserSelector
        users={userSummaries}
        selectedUserId={selectedUserId}
        onSelectUser={setSelectedUserId}
        onUserCreated={handleUserCreated}
      />

      <main className="flex-1 overflow-y-auto p-5 lg:p-8">
        <header className="mb-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Movie Recommendations
              </h1>
              {selectedUser && (
                <p className="mt-1 text-sm text-zinc-500">
                  Browsing as <span className="font-medium text-indigo-600 dark:text-indigo-400">{selectedUser.name}</span>
                </p>
              )}
            </div>
            <button
              onClick={handleRetrainModel}
              disabled={trainingProgress !== null}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {trainingProgress !== null ? "Treinando..." : "Treinar modelo"}
            </button>
          </div>
          {trainingProgress !== null && (
            <div className="mt-3 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${trainingProgress}%` }}
                />
              </div>
              <span className="text-xs text-zinc-400">Training {trainingProgress}%</span>
            </div>
          )}
        </header>

        <RecommendationPanel
          userId={selectedUserId}
          likedMovieIds={likedMovieIds}
          onToggleLike={handleToggleLike}
          isTraining={trainingProgress !== null}
          workerRecommendations={workerRecommendations}
        />

        {likedMovies.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Your Liked Movies
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
