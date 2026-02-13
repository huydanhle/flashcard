"use client";

import { useState, useEffect } from "react";
import type { Flashcard, Deck } from "@/lib/supabase/types";

interface CardActionsProps {
  card: Flashcard;
  decks: Deck[];
  onUpdate: (id: string, word: string, meaning: string, deckId?: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isBusy?: boolean;
}

export function CardActions({ card, decks, onUpdate, onDelete, isBusy = false }: CardActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [word, setWord] = useState(card.word);
  const [meaning, setMeaning] = useState(card.meaning);
  const [deckId, setDeckId] = useState<string | null>(card.deck_id);
  const [error, setError] = useState<string | null>(null);

  // Keep form in sync with the currently displayed card (e.g. after navigating to another card)
  useEffect(() => {
    setWord(card.word);
    setMeaning(card.meaning);
    setDeckId(card.deck_id);
    setError(null);
    setIsEditing(false);
  }, [card.id]);

  async function handleSave() {
    setError(null);
    const w = word.trim();
    const m = meaning.trim();
    if (!w || !m) {
      setError("Word and meaning are required.");
      return;
    }
    try {
      await onUpdate(card.id, w, m, deckId);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this card?")) return;
    setError(null);
    try {
      await onDelete(card.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  if (isEditing) {
    return (
      <div className="rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-4 shadow-[var(--shadow)] dark:border-slate-600">
        <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-400">Edit card</p>
        <input
          value={word}
          onChange={(e) => setWord(e.target.value)}
          placeholder="Word"
          className="mb-2 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100"
        />
        <textarea
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder="Meaning"
          rows={2}
          className="mb-3 w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-slate-800 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100"
        />
        <div className="mb-3">
          <label htmlFor="edit-deck" className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Deck
          </label>
          <select
            id="edit-deck"
            value={deckId ?? ""}
            onChange={(e) => setDeckId(e.target.value === "" ? null : e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100"
          >
            <option value="">Uncategorized</option>
            {decks.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy}
            className="rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60 dark:bg-indigo-500"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setIsEditing(false); setError(null); setWord(card.word); setMeaning(card.meaning); setDeckId(card.deck_id); }}
            className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-sm font-medium text-slate-700 transition hover:opacity-90 dark:border-slate-600 dark:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => {
          setWord(card.word);
          setMeaning(card.meaning);
          setDeckId(card.deck_id);
          setError(null);
          setIsEditing(true);
        }}
        disabled={isBusy}
        className="rounded-full border border-[var(--card-border)] bg-[var(--card)] px-4 py-2 text-xs font-semibold text-slate-600 transition hover:opacity-90 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isBusy}
        className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
      >
        Delete
      </button>
    </div>
  );
}
