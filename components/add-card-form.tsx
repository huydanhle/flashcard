"use client";

import { useState } from "react";

interface AddCardFormProps {
  onSubmit: (word: string, meaning: string) => Promise<void>;
  isSubmitting?: boolean;
  /** Optional label e.g. "Adding to: Default" */
  addingToDeckName?: string;
}

/**
 * Form to add a new flashcard (word + meaning). Resets on success.
 */
export function AddCardForm({ onSubmit, isSubmitting = false, addingToDeckName }: AddCardFormProps) {
  const [word, setWord] = useState("");
  const [meaning, setMeaning] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const w = word.trim();
    const m = meaning.trim();
    if (!w || !m) {
      setError("Word and meaning are required.");
      return;
    }
    try {
      await onSubmit(w, m);
      setWord("");
      setMeaning("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add card.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-[var(--card-border)] border-l-4 border-l-[var(--accent)] bg-[var(--card)] p-7 shadow-[var(--shadow-md)] dark:border-slate-600 dark:border-l-indigo-500"
    >
      <h3 className="mb-5 text-lg font-bold text-slate-800 dark:text-slate-100">Add a card</h3>
      {addingToDeckName && (
        <p className="mb-4 rounded-lg bg-slate-50 py-2 px-3 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-400">
          Adding to: <span className="font-semibold text-slate-800 dark:text-slate-200">{addingToDeckName}</span>
        </p>
      )}
      <div className="space-y-4">
        <div>
          <label htmlFor="add-word" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
            Word
          </label>
          <input
            id="add-word"
            type="text"
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder="e.g. Serendipity"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 placeholder-slate-400 transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="add-meaning" className="mb-1.5 block text-sm font-medium text-slate-600 dark:text-slate-400">
            Meaning
          </label>
          <textarea
            id="add-meaning"
            value={meaning}
            onChange={(e) => setMeaning(e.target.value)}
            placeholder="e.g. The occurrence of events by chance in a happy way"
            rows={2}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-slate-800 placeholder-slate-400 transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder-slate-500"
            disabled={isSubmitting}
          />
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[var(--accent)] py-3 font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 focus:ring-offset-2 disabled:opacity-60 dark:bg-indigo-500 dark:focus:ring-offset-slate-900"
        >
          {isSubmitting ? "Adding…" : "Add card"}
        </button>
      </div>
    </form>
  );
}
