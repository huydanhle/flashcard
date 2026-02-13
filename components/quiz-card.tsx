"use client";

import { useState } from "react";
import type { Flashcard } from "@/lib/supabase/types";
import { speakWord } from "@/lib/speak";

interface QuizCardProps {
  card: Flashcard;
  onRate: (choice: "easy" | "medium" | "hard") => Promise<void>;
  isSubmitting?: boolean;
  /** When true, front = meaning (recall the word), back = word. */
  reverse?: boolean;
}

/**
 * Quiz mode card: flip to see meaning/word, then rate difficulty (easy / medium / hard) for spaced repetition.
 */
export function QuizCard({ card, onRate, isSubmitting = false, reverse = false }: QuizCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  function handleFlip() {
    setIsFlipped((prev) => !prev);
  }

  async function handleRate(choice: "easy" | "medium" | "hard") {
    await onRate(choice);
  }

  const showWordOnFront = !reverse;
  const frontPrompt = showWordOnFront ? "Tap to reveal meaning" : "Recall the word";
  const backPrompt = showWordOnFront ? "Tap to see word again" : "Tap to see meaning again";

  return (
    <div className="mx-auto max-w-md">
      {/* Flip card area */}
      <div
        className="flash-card-container cursor-pointer perspective-1000"
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleFlip();
          }
        }}
        aria-label={isFlipped ? (showWordOnFront ? "Tap to show word" : "Tap to show meaning") : (showWordOnFront ? "Tap to reveal meaning" : "Tap to reveal word")}
      >
        <div
          className={`flash-card-inner relative h-full w-full transition-transform duration-500 preserve-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          <div className="flash-card-face flash-card-front absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50 to-orange-50/80 p-8 shadow-[var(--shadow-lg)] backface-hidden dark:border-amber-700/40 dark:from-amber-950/40 dark:to-slate-800">
            {showWordOnFront && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(card.word);
                }}
                className="absolute right-4 top-4 rounded-full p-2 text-amber-600/80 transition hover:bg-amber-200/50 hover:text-amber-700 dark:text-amber-400/80 dark:hover:bg-amber-600/30 dark:hover:text-amber-300"
                aria-label="Speak word"
              >
                <SpeakerIcon className="h-5 w-5" />
              </button>
            )}
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              {showWordOnFront ? "Word" : "Meaning"}
            </span>
            {showWordOnFront ? (
              <>
                <p className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl dark:text-slate-100">
                  {card.word}
                </p>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{frontPrompt}</p>
              </>
            ) : (
              <>
                <p className="mt-4 text-center text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-slate-200">
                  {card.meaning}
                </p>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{frontPrompt}</p>
              </>
            )}
          </div>
          <div className="flash-card-face flash-card-back absolute inset-0 flex flex-col items-center justify-center rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-50/90 to-slate-50/90 p-8 shadow-[var(--shadow-lg)] backface-hidden rotate-y-180 dark:border-amber-600/40 dark:from-amber-950/50 dark:to-slate-800">
            {!showWordOnFront && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  speakWord(card.word);
                }}
                className="absolute right-4 top-4 rounded-full p-2 text-amber-600/80 transition hover:bg-amber-200/50 hover:text-amber-700 dark:text-amber-400/80 dark:hover:bg-amber-600/30 dark:hover:text-amber-300"
                aria-label="Speak word"
              >
                <SpeakerIcon className="h-5 w-5" />
              </button>
            )}
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              {showWordOnFront ? "Meaning" : "Word"}
            </span>
            {showWordOnFront ? (
              <>
                <p className="mt-4 text-center text-lg leading-relaxed text-slate-700 sm:text-xl dark:text-slate-200">
                  {card.meaning}
                </p>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{backPrompt}</p>
              </>
            ) : (
              <>
                <p className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl dark:text-slate-100">
                  {card.word}
                </p>
                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{backPrompt}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rate buttons: only show after flip */}
      {isFlipped && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => handleRate("hard")}
            disabled={isSubmitting}
            className="rounded-full border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-800/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            Hard
          </button>
          <button
            type="button"
            onClick={() => handleRate("medium")}
            disabled={isSubmitting}
            className="rounded-full border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => handleRate("easy")}
            disabled={isSubmitting}
            className="rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-950/50"
          >
            Easy
          </button>
        </div>
      )}
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
