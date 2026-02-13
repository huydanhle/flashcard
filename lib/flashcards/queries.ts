import { supabase } from "@/lib/supabase/client";
import type { Flashcard, FlashcardInsert, FlashcardUpdate } from "@/lib/supabase/types";

const TABLE = "flashcards";

/** Lightweight count of user's cards (for seed check). No row data transferred. */
export async function fetchFlashcardsCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw error;
  return count ?? 0;
}

/** Fetch all flashcards for the current user, optionally filtered by deck (order: created_at desc). */
export async function fetchFlashcards(
  userId: string,
  deckId?: string | null
): Promise<Flashcard[]> {
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (deckId != null && deckId !== "") {
    query = query.eq("deck_id", deckId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

/** Fetch cards due for review: next_review_at is null or <= now. Optional deck filter. */
export async function fetchDueCards(
  userId: string,
  deckId?: string | null
): Promise<Flashcard[]> {
  const now = new Date().toISOString();
  let query = supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .or(`next_review_at.is.null,next_review_at.lte.${now}`)
    .order("next_review_at", { ascending: true, nullsFirst: true });

  if (deckId != null && deckId !== "") {
    query = query.eq("deck_id", deckId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Flashcard[];
}

/** Insert a new flashcard. Sets next_review_at = now so it appears in quiz. */
export async function insertFlashcard(
  payload: Omit<FlashcardInsert, "next_review_at">
): Promise<Flashcard> {
  const nextReviewAt = new Date().toISOString();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ ...payload, next_review_at: nextReviewAt })
    .select()
    .single();

  if (error) throw error;
  return data as Flashcard;
}

/** Insert many flashcards for a user (e.g. seed). Optional deck_id. Returns count inserted. */
export async function insertFlashcards(
  userId: string,
  items: { word: string; meaning: string }[],
  deckId?: string | null
): Promise<number> {
  if (items.length === 0) return 0;
  const nextReviewAt = new Date().toISOString();
  const rows = items.map((item) => ({
    user_id: userId,
    deck_id: deckId ?? null,
    word: item.word,
    meaning: item.meaning,
    next_review_at: nextReviewAt,
  }));
  const { data, error } = await supabase.from(TABLE).insert(rows).select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

/** Update an existing flashcard (e.g. after quiz: last_reviewed, review_count, next_review_at). */
export async function updateFlashcard(
  id: string,
  payload: FlashcardUpdate
): Promise<Flashcard> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Flashcard;
}

/** Delete a flashcard. */
export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}

/**
 * Spaced repetition: compute next_review_at from user choice (easy / medium / hard).
 * - easy: +3 days
 * - medium: +1 day
 * - hard: +0 (same day, show again soon)
 */
export function getNextReviewAt(
  choice: "easy" | "medium" | "hard"
): string {
  const now = new Date();
  const days = choice === "easy" ? 3 : choice === "medium" ? 1 : 0;
  now.setDate(now.getDate() + days);
  return now.toISOString();
}
