import { supabase } from "@/lib/supabase/client";
import type { Deck } from "@/lib/supabase/types";

const TABLE = "decks";

/** Fetch all decks for the current user (order: created_at asc). */
export async function fetchDecks(userId: string): Promise<Deck[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as Deck[];
}

/** Create a new deck. */
export async function createDeck(userId: string, name: string): Promise<Deck> {
  const { data, error } = await supabase
    .from(TABLE)
    .insert({ user_id: userId, name })
    .select()
    .single();

  if (error) throw error;
  return data as Deck;
}

/** Update a deck (e.g. rename). */
export async function updateDeck(
  id: string,
  payload: { name: string }
): Promise<Deck> {
  const { data, error } = await supabase
    .from(TABLE)
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Deck;
}

/** Delete a deck. Cards in this deck will have deck_id set to null (FK on delete set null). */
export async function deleteDeck(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw error;
}
