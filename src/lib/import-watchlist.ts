import type { StatusKey } from "@/lib/watchlist";

/**
 * Status mapping MAL / AniList → Tsuzuku (5 statuses).
 * Ambiguous source values are flagged — never silently guessed.
 */
export const MAL_STATUS_MAP: Record<string, StatusKey | "ambiguous"> = {
  watching: "Watching",
  completed: "Completed",
  "on-hold": "On Hold",
  "on hold": "On Hold",
  onhold: "On Hold",
  dropped: "Dropped",
  "plan to watch": "Plan to Watch",
  plantowatch: "Plan to Watch",
  // Ambiguous
  rewatching: "ambiguous",
  "re-watching": "ambiguous",
};

export const ANILIST_STATUS_MAP: Record<string, StatusKey | "ambiguous"> = {
  current: "Watching",
  watching: "Watching",
  planning: "Plan to Watch",
  "plan to watch": "Plan to Watch",
  completed: "Completed",
  dropped: "Dropped",
  paused: "On Hold",
  "on hold": "On Hold",
  // Ambiguous
  repeating: "ambiguous",
  rewatching: "ambiguous",
};

export type ImportSource = "mal-xml" | "anilist-json" | "unknown";

export type ParsedImportItem = {
  title: string;
  malId: number | null;
  anilistId: number | null;
  status: StatusKey | null;
  rawStatus: string;
  statusAmbiguous: boolean;
  progress: number;
  score: number | null; // 1-10
  totalEpisodes: number | null;
};

export type ImportPreview = {
  source: ImportSource;
  items: ParsedImportItem[];
  counts: {
    total: number;
    byStatus: Record<string, number>;
    ambiguous: number;
    missingId: number;
  };
};

function textContent(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  if (!m) return "";
  return m[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function mapStatus(
  raw: string,
  table: Record<string, StatusKey | "ambiguous">,
): { status: StatusKey | null; ambiguous: boolean } {
  const key = raw.trim().toLowerCase();
  const mapped = table[key];
  if (!mapped) return { status: null, ambiguous: true };
  if (mapped === "ambiguous") return { status: null, ambiguous: true };
  return { status: mapped, ambiguous: false };
}

export function parseMalXml(xml: string): ParsedImportItem[] {
  const items: ParsedImportItem[] = [];
  const animeBlocks = xml.match(/<anime>[\s\S]*?<\/anime>/gi) || [];
  for (const block of animeBlocks) {
    const title =
      textContent(block, "series_title") ||
      textContent(block, "series_animedb_id") ||
      "Sans titre";
    const malIdRaw = textContent(block, "series_animedb_id");
    const malId = malIdRaw ? parseInt(malIdRaw, 10) : NaN;
    const rawStatus = textContent(block, "my_status") || "";
    const { status, ambiguous } = mapStatus(rawStatus, MAL_STATUS_MAP);
    const progress = parseInt(textContent(block, "my_watched_episodes") || "0", 10) || 0;
    const scoreRaw = parseInt(textContent(block, "my_score") || "0", 10);
    const totalRaw = parseInt(textContent(block, "series_episodes") || "0", 10);
    items.push({
      title,
      malId: Number.isFinite(malId) && malId > 0 ? malId : null,
      anilistId: null,
      status: status ?? (ambiguous ? null : "Plan to Watch"),
      rawStatus,
      statusAmbiguous: ambiguous || !status,
      progress: Math.max(0, progress),
      score: scoreRaw > 0 && scoreRaw <= 10 ? scoreRaw : null,
      totalEpisodes: totalRaw > 0 ? totalRaw : null,
    });
  }
  return items;
}

/** Accepts AniList-style JSON exports or arrays of media list entries */
export function parseAniListJson(text: string): ParsedImportItem[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("JSON invalide");
  }

  let list: unknown[] = [];
  if (Array.isArray(data)) {
    list = data;
  } else if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.lists)) {
      // { lists: [ { entries: [...] }, ... ] }
      for (const l of obj.lists as unknown[]) {
        if (l && typeof l === "object" && Array.isArray((l as { entries?: unknown[] }).entries)) {
          list.push(...((l as { entries: unknown[] }).entries));
        }
      }
    } else if (Array.isArray(obj.entries)) {
      list = obj.entries;
    } else if (Array.isArray(obj.mediaList)) {
      list = obj.mediaList;
    } else if (Array.isArray(obj.data)) {
      list = obj.data;
    }
  }

  const items: ParsedImportItem[] = [];
  for (const raw of list) {
    if (!raw || typeof raw !== "object") continue;
    const e = raw as Record<string, unknown>;
    const media = (e.media && typeof e.media === "object" ? e.media : e) as Record<string, unknown>;
    const titleObj = media.title as Record<string, string> | undefined;
    const title =
      (typeof media.title === "string" ? media.title : null) ||
      titleObj?.romaji ||
      titleObj?.english ||
      titleObj?.native ||
      (typeof e.title === "string" ? e.title : null) ||
      "Sans titre";
    const anilistId =
      num(media.id) ?? num(e.mediaId) ?? num(e.anilistId) ?? num(e.id) ?? null;
    const malId = num(media.idMal) ?? num(e.idMal) ?? null;
    const rawStatus = String(e.status ?? e.list_status ?? e.my_status ?? "");
    const { status, ambiguous } = mapStatus(rawStatus, ANILIST_STATUS_MAP);
    const progress = num(e.progress) ?? num(e.episodes_watched) ?? 0;
    const score10 =
      num(e.score) != null
        ? normalizeScore(num(e.score)!)
        : null;
    const total =
      num(media.episodes) ?? num(e.totalEpisodes) ?? num(e.episodes) ?? null;
    items.push({
      title: String(title),
      malId,
      anilistId: anilistId && anilistId > 0 ? anilistId : null,
      status: status ?? null,
      rawStatus,
      statusAmbiguous: ambiguous || !status,
      progress: Math.max(0, progress ?? 0),
      score: score10,
      totalEpisodes: total && total > 0 ? total : null,
    });
  }
  return items;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** AniList scores are often 0-100; MAL is 1-10. Normalize to 1-10 for Tsuzuku. */
function normalizeScore(s: number): number | null {
  if (s <= 0) return null;
  if (s <= 10) return Math.round(s * 10) / 10;
  if (s <= 100) return Math.round((s / 10) * 10) / 10;
  return null;
}

export function buildPreview(items: ParsedImportItem[], source: ImportSource): ImportPreview {
  const byStatus: Record<string, number> = {};
  let ambiguous = 0;
  let missingId = 0;
  for (const it of items) {
    const label = it.statusAmbiguous
      ? `Ambigu (${it.rawStatus || "?"})`
      : it.status || "Inconnu";
    byStatus[label] = (byStatus[label] || 0) + 1;
    if (it.statusAmbiguous) ambiguous++;
    if (!it.anilistId && !it.malId) missingId++;
  }
  return {
    source,
    items,
    counts: { total: items.length, byStatus, ambiguous, missingId },
  };
}

export function detectAndParse(filename: string, text: string): ImportPreview {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".xml") || text.includes("<myanimelist") || text.includes("<anime>")) {
    const items = parseMalXml(text);
    if (items.length === 0) throw new Error("Aucun titre trouvé dans le XML MAL");
    return buildPreview(items, "mal-xml");
  }
  if (lower.endsWith(".json") || text.trim().startsWith("{") || text.trim().startsWith("[")) {
    const items = parseAniListJson(text);
    if (items.length === 0) throw new Error("Aucun titre trouvé dans le JSON");
    return buildPreview(items, "anilist-json");
  }
  // Try both
  if (text.includes("<anime>")) {
    return buildPreview(parseMalXml(text), "mal-xml");
  }
  try {
    return buildPreview(parseAniListJson(text), "anilist-json");
  } catch {
    throw new Error("Format non reconnu. Dépose un export XML MyAnimeList ou un JSON AniList.");
  }
}

/** Default resolution for ambiguous statuses when user confirms import */
export function resolveAmbiguousStatus(raw: string): StatusKey {
  const k = raw.trim().toLowerCase();
  if (k.includes("re")) return "Watching"; // rewatching → Watching
  return "Plan to Watch";
}
