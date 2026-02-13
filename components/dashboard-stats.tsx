"use client";

import Link from "next/link";
import { useMemo } from "react";
import { computeStreak, countReviewedToday } from "@/lib/flashcards/streak";
import type { Deck, Flashcard } from "@/lib/supabase/types";

interface DashboardStatsProps {
  decks: Deck[];
  cards: Flashcard[];
  dueCards: Flashcard[];
  isLoading?: boolean;
}

/**
 * Dashboard summary: cards learned, current streak, pending review, reviewed today, and per-deck stats.
 */
export function DashboardStats({
  decks,
  cards,
  dueCards,
  isLoading = false,
}: DashboardStatsProps) {
  const { totalCards, dueCount, streakDays, reviewedToday, deckRows } = useMemo(() => {
    const totalCards = cards.length;
    const dueCount = dueCards.length;
    const streakDays = computeStreak(cards.map((c) => c.last_reviewed));
    const reviewedToday = countReviewedToday(cards.map((c) => c.last_reviewed));
    const dueByDeck = new Map<string | null, number>();
    const totalByDeck = new Map<string | null, number>();
    for (const c of cards) totalByDeck.set(c.deck_id, (totalByDeck.get(c.deck_id) ?? 0) + 1);
    for (const c of dueCards) dueByDeck.set(c.deck_id, (dueByDeck.get(c.deck_id) ?? 0) + 1);
    const deckRows: { name: string; deckId: string | null; total: number; due: number }[] = [];
    for (const d of decks) {
      deckRows.push({
        name: d.name,
        deckId: d.id,
        total: totalByDeck.get(d.id) ?? 0,
        due: dueByDeck.get(d.id) ?? 0,
      });
    }
    const uncategorizedTotal = totalByDeck.get(null) ?? 0;
    const uncategorizedDue = dueByDeck.get(null) ?? 0;
    if (uncategorizedTotal > 0 || uncategorizedDue > 0) {
      deckRows.push({ name: "Uncategorized", deckId: null, total: uncategorizedTotal, due: uncategorizedDue });
    }
    return { totalCards, dueCount, streakDays, reviewedToday, deckRows };
  }, [decks, cards, dueCards]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl bg-slate-200/80 dark:bg-slate-700/80"
              aria-hidden
            />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: "Cards learned", value: totalCards, accent: "border-l-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10" },
    { label: "Review streak", value: `${streakDays} day${streakDays !== 1 ? "s" : ""}`, accent: "border-l-amber-500 bg-amber-500/5 dark:bg-amber-500/10" },
    { label: "Pending review", value: dueCount, accent: "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10" },
    { label: "Reviewed today", value: reviewedToday, accent: "border-l-sky-500 bg-sky-500/5 dark:bg-sky-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl border border-[var(--card-border)] border-l-4 bg-[var(--card)] p-6 shadow-[var(--shadow)] transition hover:shadow-[var(--shadow-md)] dark:border-slate-600 ${s.accent}`}
          >
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">{s.value}</p>
          </div>
        ))}
      </div>

      {deckRows.length > 0 && (
        <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6 shadow-[var(--shadow)] dark:border-slate-600">
          <h2 className="mb-4 text-lg font-semibold text-slate-800 dark:text-slate-100">By deck</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-600">
                  <th className="pb-2 pr-4 text-left font-medium text-slate-600 dark:text-slate-400">Deck</th>
                  <th className="pb-2 pr-4 text-right font-medium text-slate-600 dark:text-slate-400">Cards</th>
                  <th className="pb-2 text-right font-medium text-slate-600 dark:text-slate-400">Due</th>
                </tr>
              </thead>
              <tbody>
                {deckRows.map((row) => (
                  <tr key={row.deckId ?? "uncategorized"} className="border-b border-slate-100 dark:border-slate-700/50">
                    <td className="py-2 pr-4 text-slate-800 dark:text-slate-200">{row.name}</td>
                    <td className="py-2 pr-4 text-right text-slate-600 dark:text-slate-400">{row.total}</td>
                    <td className="py-2 text-right text-slate-600 dark:text-slate-400">{row.due}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dueCount > 0 && (
        <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 p-5 dark:border-amber-700/50 dark:bg-amber-950/30">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            You have {dueCount} card{dueCount !== 1 ? "s" : ""} due for review.
          </p>
          <Link
            href="/quiz"
            className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600"
          >
            Start quiz
            <span aria-hidden>→</span>
          </Link>
        </div>
      )}
    </div>
  );
}
