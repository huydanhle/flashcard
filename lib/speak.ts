/**
 * Speak a word using the browser's Speech Synthesis API (TTS).
 * No-op if not in browser or API unavailable.
 */
export function speakWord(word: string, lang = "en-US"): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = lang;
    u.rate = 0.9;
    window.speechSynthesis.speak(u);
  } catch {
    // no-op
  }
}
