/**
 * Export: build CSV from cards (word, meaning, deck name).
 * Import: parse CSV or JSON into { word, meaning } with optional deck info.
 */

export interface ExportCard {
  word: string;
  meaning: string;
  deckName?: string;
}

/** Escape a CSV field (wrap in quotes if contains comma or quote). */
function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/** Build CSV string from cards. Header: word,meaning,deck */
export function cardsToCsv(cards: ExportCard[]): string {
  const header = "word,meaning,deck";
  const rows = cards.map((c) =>
    [escapeCsvField(c.word), escapeCsvField(c.meaning), escapeCsvField(c.deckName ?? "")].join(",")
  );
  return [header, ...rows].join("\n");
}

/** Build JSON array for export (word, meaning, deck_id for re-import). */
export function cardsToJson(
  cards: { word: string; meaning: string; deck_id?: string | null }[]
): string {
  return JSON.stringify(
    cards.map((c) => ({ word: c.word, meaning: c.meaning, deck_id: c.deck_id ?? null })),
    null,
    2
  );
}

export interface ParsedImportItem {
  word: string;
  meaning: string;
  deck?: string;
  deck_id?: string | null;
}

/**
 * Parse CSV string. Expects header "word,meaning" or "word,meaning,deck".
 * Simple parser: split by newline, then by comma (no handling of commas inside quoted fields for now).
 */
export function parseCsv(csv: string): ParsedImportItem[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length === 0) return [];
  const header = lines[0].toLowerCase();
  const hasDeck = header.includes("deck");
  const result: ParsedImportItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = parseCsvLine(line);
    const word = (parts[0] ?? "").trim();
    const meaning = (parts[1] ?? "").trim();
    if (!word && !meaning) continue;
    const item: ParsedImportItem = { word: word || " ", meaning: meaning || " " };
    if (hasDeck && parts[2] !== undefined) item.deck = (parts[2] ?? "").trim() || undefined;
    result.push(item);
  }
  return result;
}

/** Parse a single CSV line, handling quoted fields. */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let end = i + 1;
      let s = "";
      while (end < line.length) {
        if (line[end] === '"') {
          if (line[end + 1] === '"') {
            s += '"';
            end += 2;
          } else {
            end++;
            break;
          }
        } else {
          s += line[end];
          end++;
        }
      }
      result.push(s);
      i = end;
      if (line[i] === ",") i++;
    } else {
      const comma = line.indexOf(",", i);
      if (comma === -1) {
        result.push(line.slice(i));
        break;
      }
      result.push(line.slice(i, comma));
      i = comma + 1;
    }
  }
  return result;
}

/**
 * Parse JSON import. Expects array of { word: string, meaning: string } or { word, meaning, deck_id }.
 */
export function parseJsonImport(data: unknown): ParsedImportItem[] {
  if (!Array.isArray(data)) return [];
  const result: ParsedImportItem[] = [];
  for (const row of data) {
    if (row == null || typeof row !== "object") continue;
    const word = typeof (row as { word?: unknown }).word === "string" ? (row as { word: string }).word : "";
    const meaning = typeof (row as { meaning?: unknown }).meaning === "string" ? (row as { meaning: string }).meaning : "";
    if (!word && !meaning) continue;
    const item: ParsedImportItem = { word: word || " ", meaning: meaning || " " };
    const did = (row as { deck_id?: unknown }).deck_id;
    if (did === null || (typeof did === "string" && did !== "")) item.deck_id = did ?? undefined;
    result.push(item);
  }
  return result;
}
