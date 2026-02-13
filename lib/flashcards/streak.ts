/** Local date string YYYY-MM-DD (user's calendar day). */
function localDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Count how many cards were reviewed today (by last_reviewed date, in user's local date). */
export function countReviewedToday(lastReviewedDates: (string | null)[]): number {
  const today = localDateString(new Date());
  return lastReviewedDates.filter((d) => {
    if (d == null || d === "") return false;
    const local = localDateString(new Date(d));
    return local === today;
  }).length;
}

/**
 * Compute current review streak (consecutive days with at least one review) from last_reviewed timestamps.
 * Uses the user's local date so "today" and streak match their calendar.
 */
export function computeStreak(lastReviewedDates: (string | null)[]): number {
  const dates = lastReviewedDates
    .filter((d): d is string => d != null && d !== "")
    .map((d) => localDateString(new Date(d)))
    .filter((d, i, arr) => arr.indexOf(d) === i)
    .sort()
    .reverse();

  if (dates.length === 0) return 0;

  const today = localDateString(new Date());
  if (dates[0] !== today) return 0;

  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1] + "T12:00:00");
    prevDate.setDate(prevDate.getDate() - 1);
    const prevStr = localDateString(prevDate);
    if (prevStr === dates[i]) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}
