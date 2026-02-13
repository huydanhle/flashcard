export interface Deck {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Flashcard {
  id: string;
  user_id: string;
  deck_id: string | null;
  word: string;
  meaning: string;
  difficulty_level: "easy" | "medium" | "hard" | null;
  last_reviewed: string | null;
  review_count: number;
  next_review_at: string | null;
  created_at: string;
}

export interface FlashcardInsert {
  user_id: string;
  deck_id?: string | null;
  word: string;
  meaning: string;
  difficulty_level?: "easy" | "medium" | "hard" | null;
  last_reviewed?: string | null;
  review_count?: number;
  next_review_at?: string | null;
}

export interface FlashcardUpdate {
  word?: string;
  meaning?: string;
  difficulty_level?: "easy" | "medium" | "hard" | null;
  last_reviewed?: string | null;
  review_count?: number;
  next_review_at?: string | null;
  deck_id?: string | null;
}
