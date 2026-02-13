"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth/use-auth";
import { FlashCard } from "@/components/flash-card";
import { AddCardForm } from "@/components/add-card-form";
import { CardActions } from "@/components/card-actions";
import { Nav } from "@/components/nav";
import { fetchFlashcards, fetchFlashcardsCount, insertFlashcard, insertFlashcards, updateFlashcard, deleteFlashcard } from "@/lib/flashcards/queries";
import { cardsToCsv, parseCsv, parseJsonImport, type ParsedImportItem } from "@/lib/flashcards/import-export";
import { fetchDecks, createDeck, updateDeck, deleteDeck } from "@/lib/decks/queries";
import { SEED_WORDS } from "@/lib/flashcards/seed-words";
import type { Flashcard, Deck } from "@/lib/supabase/types";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function EllipsisIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path d="M12 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Zm6-6a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z" />
    </svg>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [isCreatingDeck, setIsCreatingDeck] = useState(false);
  const [showNewDeckInput, setShowNewDeckInput] = useState(false);
  const [openMenuDeckId, setOpenMenuDeckId] = useState<string | null>(null);
  const [editingDeckId, setEditingDeckId] = useState<string | null>(null);
  const [editingDeckName, setEditingDeckName] = useState("");
  const [isDeckActionBusy, setIsDeckActionBusy] = useState(false);
  const [reverseMode, setReverseMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  const filteredCards = useMemo(() => {
    if (!searchQuery.trim()) return cards;
    const q = searchQuery.trim().toLowerCase();
    return cards.filter(
      (c) =>
        c.word.toLowerCase().includes(q) || c.meaning.toLowerCase().includes(q)
    );
  }, [cards, searchQuery]);

  const effectiveIndex = Math.min(currentIndex, Math.max(0, filteredCards.length - 1));

  // Single load: decks + card count (lightweight) + cards for selected deck. Seed only when count is 0.
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const [deckList, totalCount, deckCards] = await Promise.all([
          fetchDecks(user.id),
          fetchFlashcardsCount(user.id),
          fetchFlashcards(user.id, selectedDeckId ?? undefined),
        ]);
        if (cancelled) return;
        setDecks(deckList);
        if (totalCount === 0) {
          const list = deckList.length > 0 ? deckList : [];
          let defaultDeckId: string;
          if (list.length === 0) {
            const defaultDeck = await createDeck(user.id, "Default");
            if (cancelled) return;
            defaultDeckId = defaultDeck.id;
            setDecks([defaultDeck]);
          } else {
            defaultDeckId = list[0].id;
          }
          await insertFlashcards(user.id, SEED_WORDS.slice(0, 100), defaultDeckId);
          if (cancelled) return;
          const updated = await fetchFlashcards(user.id, selectedDeckId ?? undefined);
          if (!cancelled) setCards(updated);
        } else {
          setCards(deckCards);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, router, selectedDeckId]);

  useEffect(() => {
    if (filteredCards.length === 0) return;
    setCurrentIndex((i) => Math.min(i, filteredCards.length - 1));
  }, [filteredCards.length]);

  const handleAddCard = useCallback(
    async (word: string, meaning: string) => {
      if (!user) return;
      let targetDeckId = selectedDeckId ?? decks[0]?.id;
      if (!targetDeckId && decks.length === 0) {
        const defaultDeck = await createDeck(user.id, "Default");
        setDecks((prev) => [...prev, defaultDeck]);
        targetDeckId = defaultDeck.id;
      }
      setIsSubmitting(true);
      try {
        const newCard = await insertFlashcard({
          user_id: user.id,
          deck_id: targetDeckId ?? null,
          word,
          meaning,
        });
        setCards((prev) => [newCard, ...prev]);
        setCurrentIndex(0);
        setSuccessMessage("Card added");
        setTimeout(() => setSuccessMessage(null), 2500);
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, selectedDeckId, decks]
  );

  const handleUpdateCard = useCallback(
    async (id: string, word: string, meaning: string, deckId?: string | null) => {
      setActionBusy(true);
      try {
        const updated = await updateFlashcard(id, { word, meaning, deck_id: deckId ?? undefined });
        setCards((prev) => prev.map((c) => (c.id === id ? updated : c)));
      } finally {
        setActionBusy(false);
      }
    },
    []
  );

  const handleDeleteCard = useCallback(async (id: string) => {
    setActionBusy(true);
    try {
      await deleteFlashcard(id);
      setCards((prev) => {
        const next = prev.filter((c) => c.id !== id);
        setCurrentIndex((i) => (next.length === 0 ? 0 : Math.min(i, next.length - 1)));
        return next;
      });
    } finally {
      setActionBusy(false);
    }
  }, []);

  const currentCard = filteredCards[effectiveIndex];
  const hasCards = cards.length > 0;
  const hasFilteredCards = filteredCards.length > 0;

  const goPrev = () =>
    setCurrentIndex((i) => (i <= 0 ? filteredCards.length - 1 : i - 1));
  const goNext = () =>
    setCurrentIndex((i) => (i >= filteredCards.length - 1 ? 0 : i + 1));
  const goRandom = () =>
    setCurrentIndex(Math.floor(Math.random() * filteredCards.length));

  const handleCreateDeck = useCallback(async () => {
    const name = newDeckName.trim();
    if (!name || !user) return;
    setIsCreatingDeck(true);
    try {
      const deck = await createDeck(user.id, name);
      setDecks((prev) => [...prev, deck]);
      setSelectedDeckId(deck.id);
      setNewDeckName("");
      setShowNewDeckInput(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingDeck(false);
    }
  }, [user, newDeckName]);

  const startRenameDeck = useCallback((deck: Deck) => {
    setOpenMenuDeckId(null);
    setEditingDeckId(deck.id);
    setEditingDeckName(deck.name);
  }, []);

  const handleSaveRenameDeck = useCallback(async () => {
    const name = editingDeckName.trim();
    if (!editingDeckId || !name) return;
    setIsDeckActionBusy(true);
    try {
      const updated = await updateDeck(editingDeckId, { name });
      setDecks((prev) => prev.map((d) => (d.id === editingDeckId ? updated : d)));
      setEditingDeckId(null);
      setEditingDeckName("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeckActionBusy(false);
    }
  }, [editingDeckId, editingDeckName]);

  const handleDeleteDeck = useCallback(
    async (deck: Deck) => {
      if (!window.confirm(`Delete deck "${deck.name}"? Cards in it will become uncategorized.`)) return;
      setOpenMenuDeckId(null);
      setIsDeckActionBusy(true);
      try {
        await deleteDeck(deck.id);
        setDecks((prev) => prev.filter((d) => d.id !== deck.id));
        if (selectedDeckId === deck.id) {
          setSelectedDeckId(null);
        }
        const fresh = await fetchFlashcards(user!.id, selectedDeckId === deck.id ? undefined : selectedDeckId ?? undefined);
        setCards(fresh);
      } catch (e) {
        console.error(e);
      } finally {
        setIsDeckActionBusy(false);
      }
    },
    [selectedDeckId, user]
  );

  const handleExport = useCallback(async () => {
    if (!user) return;
    setIsExporting(true);
    try {
      const data = await fetchFlashcards(user.id, selectedDeckId ?? undefined);
      const exportCards = data.map((c) => ({
        word: c.word,
        meaning: c.meaning,
        deckName: decks.find((d) => d.id === c.deck_id)?.name ?? "",
      }));
      const csv = "\uFEFF" + cardsToCsv(exportCards);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = selectedDeckId ? `flashcards-${decks.find((d) => d.id === selectedDeckId)?.name ?? "deck"}.csv` : "flashcards.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  }, [user, selectedDeckId, decks]);

  const handleImportFile = useCallback(
    async (file: File) => {
      if (!user) return;
      setIsImporting(true);
      setImportMessage(null);
      try {
        const text = await file.text();
        const lower = file.name.toLowerCase();
        let items: ParsedImportItem[];
        if (lower.endsWith(".json")) {
          const data = JSON.parse(text) as unknown;
          items = parseJsonImport(data);
        } else {
          items = parseCsv(text);
        }
        if (items.length === 0) {
          setImportMessage("No valid rows to import.");
          return;
        }
        let defaultDeckId = decks[0]?.id;
        if (!defaultDeckId) {
          const defaultDeck = await createDeck(user.id, "Default");
          defaultDeckId = defaultDeck.id;
        }
        const deckIds = new Set(decks.map((d) => d.id));
        const withDeckId: { word: string; meaning: string; deckId: string | null }[] = items.map((item) => {
          let deckId: string | null = null;
          if (item.deck_id != null && item.deck_id !== "" && deckIds.has(item.deck_id)) deckId = item.deck_id;
          else if (item.deck) {
            const found = decks.find((d) => d.name.toLowerCase() === item.deck!.toLowerCase());
            deckId = found?.id ?? defaultDeckId;
          } else deckId = selectedDeckId ?? defaultDeckId;
          return { word: item.word, meaning: item.meaning, deckId };
        });
        const byDeck = new Map<string | null, { word: string; meaning: string }[]>();
        for (const row of withDeckId) {
          const list = byDeck.get(row.deckId) ?? [];
          list.push({ word: row.word, meaning: row.meaning });
          byDeck.set(row.deckId, list);
        }
        const CHUNK = 50;
        let total = 0;
        for (const [deckId, list] of byDeck) {
          for (let i = 0; i < list.length; i += CHUNK) {
            const chunk = list.slice(i, i + CHUNK);
            total += await insertFlashcards(user.id, chunk, deckId ?? undefined);
          }
        }
        const [deckList, deckCards] = await Promise.all([
          fetchDecks(user.id),
          fetchFlashcards(user.id, selectedDeckId ?? undefined),
        ]);
        setDecks(deckList);
        setCards(deckCards);
        setImportMessage(`Imported ${total} card${total !== 1 ? "s" : ""}.`);
        setTimeout(() => setImportMessage(null), 4000);
      } catch (e) {
        console.error(e);
        setImportMessage(e instanceof Error ? e.message : "Import failed.");
      } finally {
        setIsImporting(false);
      }
    },
    [user, decks, selectedDeckId]
  );

  const selectedDeckName =
    selectedDeckId === null ? "All" : decks.find((d) => d.id === selectedDeckId)?.name ?? "All";
  const addCardTargetDeckName =
    selectedDeckId != null
      ? decks.find((d) => d.id === selectedDeckId)?.name
      : decks[0]?.name ?? "Default";

  useEffect(() => {
    if (!hasFilteredCards) return;
    const len = filteredCards.length;
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setCurrentIndex((i) => (i <= 0 ? len - 1 : i - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setCurrentIndex((i) => (i >= len - 1 ? 0 : i + 1));
          break;
        case " ":
          e.preventDefault();
          break;
        case "r":
        case "R":
          e.preventDefault();
          setCurrentIndex(() => Math.floor(Math.random() * len));
          break;
        default:
          break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [hasFilteredCards, filteredCards.length]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Nav />
        <div className="flex min-h-[60vh] items-center justify-center">
          <p className="text-slate-500">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen page-bg">
      <Nav />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 sm:text-3xl">
              Your flashcards
            </h1>
            {hasCards && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {cards.length} card{cards.length !== 1 ? "s" : ""}
                {selectedDeckId && filteredCards.length !== cards.length ? ` · ${filteredCards.length} in this deck` : ""}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              Quiz mode
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {/* Deck selector + actions */}
        <div className="mb-4 rounded-2xl border border-[var(--card-border)] bg-slate-50/60 px-4 py-3 dark:border-slate-600 dark:bg-slate-800/40">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Deck</span>
            <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDeckId(null)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedDeckId === null
                  ? "bg-[var(--accent)] text-white dark:bg-indigo-500"
                  : "border border-[var(--card-border)] bg-[var(--card)] text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              }`}
            >
              All{selectedDeckId === null && hasCards ? ` (${cards.length})` : ""}
            </button>
            {decks.map((d) =>
              editingDeckId === d.id ? (
                <span
                  key={d.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--accent)] bg-[var(--card)] pl-3 pr-1.5 py-1.5 dark:border-indigo-400 dark:bg-slate-800"
                >
                  <input
                    type="text"
                    value={editingDeckName}
                    onChange={(e) => setEditingDeckName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveRenameDeck();
                      if (e.key === "Escape") {
                        setEditingDeckId(null);
                        setEditingDeckName("");
                      }
                    }}
                    className="w-28 rounded bg-transparent py-0.5 text-sm text-slate-800 focus:outline-none dark:text-slate-100"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveRenameDeck}
                    disabled={!editingDeckName.trim() || isDeckActionBusy}
                    className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-50 dark:bg-indigo-500"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeckId(null);
                      setEditingDeckName("");
                    }}
                    className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-700"
                    aria-label="Cancel"
                  >
                    ×
                  </button>
                </span>
              ) : (
                <span key={d.id} className="relative inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedDeckId(d.id)}
                    className={`rounded-l-full rounded-r px-4 py-2 text-sm font-medium transition ${
                      selectedDeckId === d.id
                        ? "bg-[var(--accent)] text-white dark:bg-indigo-500"
                        : "border border-[var(--card-border)] border-r-0 bg-[var(--card)] text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {d.name}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuDeckId((prev) => (prev === d.id ? null : d.id));
                    }}
                    className={`rounded-r-full border border-[var(--card-border)] bg-[var(--card)] p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 ${
                      selectedDeckId === d.id ? "border-l-indigo-400/50 dark:border-l-indigo-400/50" : ""
                    }`}
                    aria-label="Deck options"
                    aria-expanded={openMenuDeckId === d.id}
                  >
                    <EllipsisIcon className="h-4 w-4" />
                  </button>
                  {openMenuDeckId === d.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        aria-hidden
                        onClick={() => setOpenMenuDeckId(null)}
                      />
                      <div className="absolute left-0 top-full z-20 mt-1 min-w-[120px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startRenameDeck(d);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDeck(d);
                          }}
                          disabled={isDeckActionBusy}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </span>
              )
            )}
            {showNewDeckInput ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--card-border)] bg-[var(--card)] pl-3 pr-2 py-1.5 dark:border-slate-600">
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateDeck();
                    if (e.key === "Escape") setShowNewDeckInput(false);
                  }}
                  placeholder="Deck name"
                  className="w-28 rounded bg-transparent py-1 text-sm text-slate-800 placeholder-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder-slate-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim() || isCreatingDeck}
                  className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold text-white disabled:opacity-50 dark:bg-indigo-500"
                >
                  {isCreatingDeck ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewDeckInput(false); setNewDeckName(""); }}
                  className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-700"
                  aria-label="Cancel"
                >
                  ×
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewDeckInput(true)}
                className="rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-medium text-slate-500 transition hover:border-[var(--accent)] hover:text-[var(--accent)] dark:border-slate-600 dark:text-slate-400 dark:hover:border-indigo-400 dark:hover:text-indigo-400"
              >
                + New deck
              </button>
            )}
            </div>
            <div className="mx-2 h-6 w-px bg-slate-200 dark:bg-slate-600" aria-hidden />
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting || !hasCards}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                {isExporting ? "Exporting…" : "Export"}
              </button>
              <label className="cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200 disabled:pointer-events-none disabled:opacity-50">
                <input
                  type="file"
                  accept=".csv,.json"
                  className="sr-only"
                  disabled={isImporting}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportFile(file);
                    e.target.value = "";
                  }}
                />
                {isImporting ? "Importing…" : "Import"}
              </label>
            </div>
          </div>
        </div>
        {(importMessage || successMessage) && (
          <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" role="status">
            {importMessage ?? successMessage}
          </p>
        )}

        {hasCards && (
          <div className="mb-5">
            <div className="relative max-w-md">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                <SearchIcon className="h-5 w-5" />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by word or meaning…"
                className="w-full rounded-xl border border-[var(--card-border)] bg-[var(--card)] py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 shadow-[var(--shadow)] transition focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-500"
              />
            </div>
            {searchQuery.trim() && (
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {filteredCards.length} of {cards.length} cards
              </p>
            )}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Card viewer + navigation */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card)] shadow-[var(--shadow)] dark:border-slate-600">
                <p className="text-slate-500 dark:text-slate-400">Loading cards…</p>
              </div>
            ) : !hasCards ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-10 text-center shadow-[var(--shadow)] dark:border-slate-600">
                <p className="text-slate-600 dark:text-slate-300">
                  {selectedDeckId && decks.length > 0
                    ? "No cards in this deck. Add one below."
                    : "No cards yet. Add your first card below."}
                </p>
              </div>
            ) : !hasFilteredCards ? (
              <div className="flex min-h-[280px] flex-col items-center justify-center rounded-3xl border border-[var(--card-border)] bg-[var(--card)] p-10 text-center shadow-[var(--shadow)] dark:border-slate-600">
                <p className="text-slate-600 dark:text-slate-300">No cards match your search.</p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-3 text-sm font-semibold text-[var(--accent)] hover:underline dark:text-indigo-400"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 flex items-center justify-center gap-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Show first:</span>
                  <button
                    type="button"
                    onClick={toggleReverseMode}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      !reverseMode
                        ? "bg-[var(--accent)] text-white dark:bg-indigo-500"
                        : "border border-[var(--card-border)] bg-[var(--card)] text-slate-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    Word
                  </button>
                  <button
                    type="button"
                    onClick={toggleReverseMode}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      reverseMode
                        ? "bg-[var(--accent)] text-white dark:bg-indigo-500"
                        : "border border-[var(--card-border)] bg-[var(--card)] text-slate-600 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    Meaning
                  </button>
                </div>
                <div className="min-h-[260px]">
                  <FlashCard card={currentCard} reverse={reverseMode} />
                </div>
                <CardActions
                  card={currentCard}
                  decks={decks}
                  onUpdate={handleUpdateCard}
                  onDelete={handleDeleteCard}
                  isBusy={actionBusy}
                />
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={goPrev}
                    className="min-h-[44px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-slate-700 shadow-[var(--shadow)] transition hover:bg-slate-50 hover:shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
                  >
                    ← Previous
                  </button>
                  <span className="min-h-[44px] min-w-[80px] flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    {effectiveIndex + 1} <span className="mx-1 text-slate-400 dark:text-slate-500">/</span> {filteredCards.length}
                  </span>
                  <button
                    type="button"
                    onClick={goNext}
                    className="min-h-[44px] rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-5 py-2.5 text-sm font-medium text-slate-700 shadow-[var(--shadow)] transition hover:bg-slate-50 hover:shadow-[var(--shadow-md)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:ring-offset-2 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus:ring-offset-slate-900"
                  >
                    Next →
                  </button>
                  <button
                    type="button"
                    onClick={goRandom}
                    className="min-h-[44px] rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:bg-slate-600 dark:hover:bg-slate-500 dark:focus:ring-offset-slate-900"
                  >
                    Random
                  </button>
                </div>
                <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium dark:border-slate-600 dark:bg-slate-800">←</span>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium dark:border-slate-600 dark:bg-slate-800">→</span>
                  <span>navigate</span>
                  <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-medium dark:border-slate-600 dark:bg-slate-800">R</span>
                  <span>random</span>
                  <span>·</span>
                  <span>click card to flip</span>
                </p>
              </>
            )}
          </div>
          {/* Add card form */}
          <div>
            <AddCardForm
              onSubmit={handleAddCard}
              isSubmitting={isSubmitting}
              addingToDeckName={addCardTargetDeckName}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
