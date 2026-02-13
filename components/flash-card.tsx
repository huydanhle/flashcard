"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/supabase/types";
import { speakWord } from "@/lib/speak";

interface FlashCardProps {
  card: Flashcard;
  onFlip?: () => void;
  /** When true, front = meaning, back = word (recall the word from meaning). */
  reverse?: boolean;
}

/**
 * Animated flip card: front = word, back = meaning (or swapped when reverse). Click to flip.
 */
export function FlashCard({ card, onFlip, reverse = false }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  function handleClick() {
    setIsFlipped((prev) => !prev);
    onFlip?.();
  }

  const showWordOnFront = !reverse;
  const frontLabel = showWordOnFront ? "Word" : "Meaning";
  const backLabel = showWordOnFront ? "Meaning" : "Word";

  return (
    <div
      className="flash-card-container cursor-pointer perspective-1000"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={isFlipped ? (showWordOnFront ? "Show word" : "Show meaning") : (showWordOnFront ? "Show meaning" : "Show word")}
    >
      <div
        className={`flash-card-inner relative h-full w-full transition-transform duration-500 preserve-3d ${
          isFlipped ? "rotate-y-180" : ""
        }`}
      >
        {/* Front face */}
        <div className="flash-card-face flash-card-front absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-slate-200/60 bg-[var(--card)] p-8 shadow-[var(--shadow-lg)] backface-hidden dark:border-slate-600/60">
          {showWordOnFront && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(card.word);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              aria-label="Speak word"
            >
              <SpeakerIcon className="h-5 w-5" />
            </button>
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {frontLabel}
          </span>
          {showWordOnFront ? (
            <>
              <p className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl dark:text-slate-100">
                {card.word}
              </p>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Tap to flip</p>
            </>
          ) : (
            <>
              <p className="mt-4 text-center text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-slate-200">
                {card.meaning}
              </p>
              <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">Tap to flip</p>
            </>
          )}
        </div>
        {/* Back face */}
        <div className="flash-card-face flash-card-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-indigo-200/60 bg-gradient-to-br from-indigo-50/80 to-slate-50/80 p-8 shadow-[var(--shadow-lg)] backface-hidden rotate-y-180 dark:border-indigo-500/30 dark:from-indigo-950/50 dark:to-slate-900/80">
          {!showWordOnFront && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                speakWord(card.word);
              }}
              className="absolute right-4 top-4 rounded-full p-2 text-indigo-500/80 transition hover:bg-indigo-100/50 hover:text-indigo-700 dark:hover:bg-indigo-500/20 dark:hover:text-indigo-300"
              aria-label="Speak word"
            >
              <SpeakerIcon className="h-5 w-5" />
            </button>
          )}
          <span className="text-xs font-semibold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
            {backLabel}
          </span>
          {showWordOnFront ? (
            <>
              <p className="mt-4 text-center text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-slate-200">
                {card.meaning}
              </p>
              {card.review_count > 0 && (
                <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Reviewed {card.review_count}×
                </p>
              )}
            </>
          ) : (
            <>
              <p className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl dark:text-slate-100">
                {card.word}
              </p>
              {card.review_count > 0 && (
                <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Reviewed {card.review_count}×
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
    </svg>
  );
}
