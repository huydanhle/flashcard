"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/use-auth";
import { QuizCard } from "@/components/quiz-card";
import { Nav } from "@/components/nav";
import {
  fetchDueCards,
  updateFlashcard,
  getNextReviewAt,
} from "@/lib/flashcards/queries";
import { fetchDecks } from "@/lib/decks/queries";
import type { Flashcard, Deck } from "@/lib/supabase/types";

export default function QuizPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [quizDeckId, setQuizDeckId] = useState<string | null>(null);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("flashcard-reverse-mode");
      setReverseMode(stored === "true");
    } catch {
      // ignore
    }
  }, []);

  const toggleReverseMode = useCallback(() => {
    setReverseMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("flashcard-reverse-mode", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    Promise.all([
      fetchDecks(user.id),
      fetchDueCards(user.id, quizDeckId ?? undefined),
    ])
      .then(([deckList, data]) => {
        if (!cancelled) {
          setDecks(deckList);
          setDueCards(data);
          setCurrentIndex(0);
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, quizDeckId]);

  const handleRate = useCallback(
    async (choice: "easy" | "medium" | "hard") => {
      const card = dueCards[currentIndex];
      if (!card || !user) return;
      setIsSubmitting(true);
      try {
        const now = new Date().toISOString();
        const nextReviewAt = getNextReviewAt(choice);
        await updateFlashcard(card.id, {
          last_reviewed: now,
          review_count: card.review_count + 1,
          next_review_at: nextReviewAt,
          difficulty_level: choice,
        });
        setDueCards((prev) => {
          const next = prev.filter((c) => c.id !== card.id);
          setCurrentIndex((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
          return next;
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [dueCards, currentIndex, user]
  );

  const currentCard = dueCards[currentIndex];

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
      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
            Quiz mode
          </h1>
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--accent)] transition hover:underline dark:text-indigo-400"
          >
            ← Back to cards
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap items-end gap-6">
          <div>
            <label htmlFor="quiz-deck" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
              Quiz from
            </label>
            <select
              id="quiz-deck"
              value={quizDeckId ?? ""}
              onChange={(e) => setQuizDeckId(e.target.value === "" ? null : e.target.value)}
              className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm text-slate-800 shadow-[var(--shadow)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:text-slate-100"
            >
              <option value="">All decks</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">Show first</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={toggleReverseMode}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  !reverseMode
                    ? "bg-[var(--accent)] text-white dark:bg-indigo-500"
                    : "border border-[var(--card-border)] bg-[var(--card)] text-slate-600 dark:border-slate-600 dark:text-slate-400"
                }`}
              >
                Word
              </button>
              <button
                type="button"
                onClick={toggleReverseMode}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                  reverseMode
                    ? "bg-[var(--accent)] text-white dark:bg-indigo-500"
                    : "border border-[var(--card-border)] bg-[var(--card)] text-slate-600 dark:border-slate-600 dark:text-slate-400"
                }`}
              >
                Meaning
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex min-h-[320px] items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow)] dark:border-slate-600">
            <p className="text-slate-500 dark:text-slate-400">Loading due cards…</p>
          </div>
        ) : dueCards.length === 0 ? (
          <div className="rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-12 text-center shadow-[var(--shadow)] dark:border-slate-600">
            <p className="text-lg font-medium text-slate-600 dark:text-slate-300">No cards due for review right now.</p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              New cards or cards you marked &quot;Hard&quot; will appear here.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 dark:bg-indigo-500"
            >
              Add more cards
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm font-medium text-slate-600 dark:text-slate-400">
              {dueCards.length} card{dueCards.length !== 1 ? "s" : ""} due for review
            </p>
            <QuizCard
              card={currentCard}
              onRate={handleRate}
              isSubmitting={isSubmitting}
              reverse={reverseMode}
            />
            {dueCards.length > 1 && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) => (i <= 0 ? dueCards.length - 1 : i - 1))
                  }
                  className="rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-slate-700 shadow-[var(--shadow)] transition hover:opacity-90 dark:border-slate-600 dark:text-slate-200"
                >
                  ← Previous
                </button>
                <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {currentIndex + 1} / {dueCards.length}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((i) =>
                      i >= dueCards.length - 1 ? 0 : i + 1
                    )
                  }
                  className="rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-slate-700 shadow-[var(--shadow)] transition hover:opacity-90 dark:border-slate-600 dark:text-slate-200"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
