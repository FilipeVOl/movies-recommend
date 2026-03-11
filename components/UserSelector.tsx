"use client";

import { useState } from "react";
import Link from "next/link";

type UserSummary = {
  id: number;
  name: string;
  age: number | null;
  likedCount: number;
};

type UserSelectorProps = {
  users: UserSummary[];
  selectedUserId: number | null;
  onSelectUser: (userId: number) => void;
  onUserCreated: (user: { id: number; name: string; age: number | null }) => void;
};

export default function UserSelector({
  users,
  selectedUserId,
  onSelectUser,
  onUserCreated,
}: UserSelectorProps) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (trimmed.length < 2) {
      setError("Name must be at least 2 characters");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const age = newAge ? parseInt(newAge) : null;
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, age }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create user");
      }

      const user = await res.json();
      onUserCreated(user);
      setNewName("");
      setNewAge("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <aside className="flex w-full flex-col gap-1 border-b border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950 lg:w-64 lg:min-h-screen lg:border-b-0 lg:border-r">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
          Users
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
          title="Add user"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4.5v15m7.5-7.5h-15"} />
          </svg>
        </button>
      </div>

      {showForm && (
        <div className="mb-3 flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
          <input
            type="text"
            placeholder="User name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            autoFocus
          />
          <input
            type="number"
            placeholder="Age"
            min={1}
            max={120}
            value={newAge}
            onChange={(e) => setNewAge(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            className="rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Add User"}
          </button>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-x-visible">
        {users.map((user) => {
          const isSelected = user.id === selectedUserId;
          return (
            <div key={user.id} className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => onSelectUser(user.id)}
                className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all duration-150 ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                  }`}
                >
                  {user.name[0]}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {user.name}
                    {user.age != null && (
                      <span className={`ml-1 text-[11px] font-normal ${isSelected ? "text-indigo-200" : "text-zinc-400"}`}>
                        {user.age}y
                      </span>
                    )}
                  </p>
                  <p
                    className={`text-[11px] ${
                      isSelected ? "text-indigo-200" : "text-zinc-400 dark:text-zinc-500"
                    }`}
                  >
                    {user.likedCount} liked
                  </p>
                </div>
              </button>
              <Link
                href={`/users/${user.id}`}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors ${
                  isSelected
                    ? "text-indigo-300 hover:text-white"
                    : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                }`}
                title={`Open ${user.name}'s page`}
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </Link>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

export type { UserSummary };
