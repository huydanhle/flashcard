"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/use-auth";
import { DashboardStats } from "@/components/dashboard-stats";
import { Nav } from "@/components/nav";
import { fetchDecks } from "@/lib/decks/queries";
import { fetchFlashcards, fetchDueCards } from "@/lib/flashcards/queries";
import { computeStreak, countReviewedToday } from "@/lib/flashcards/streak";
import type { Deck } from "@/lib/supabase/types";
import type { Flashcard } from "@/lib/supabase/types";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetchDecks(user.id),
      fetchFlashcards(user.id),
      fetchDueCards(user.id),
    ])
      .then(([deckList, all, due]) => {
        if (cancelled) return;
        setDecks(deckList);
        setCards(all);
        setDueCards(due);
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="page-bg min-h-screen">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg min-h-screen">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
            Dashboard
          </h1>
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--accent)] transition hover:underline dark:text-indigo-400"
          >
            ← Back to cards
          </Link>
        </div>

        <DashboardStats
          decks={decks}
          cards={cards}
          dueCards={dueCards}
          isLoading={isLoading}
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-xl bg-[var(--accent)] px-5 py-2.5 font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-indigo-500"
          >
            Browse cards
          </Link>
          <Link
            href="/quiz"
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-2.5 font-semibold text-slate-700 shadow-[var(--shadow)] transition hover:opacity-90 dark:border-slate-600 dark:text-slate-200"
          >
            Start quiz
          </Link>
        </div>
      </main>
    </div>
  );
}
