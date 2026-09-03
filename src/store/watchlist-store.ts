import { create } from "zustand";
import {
  type StatusKey,
  type WatchlistEntry,
  type AniListMedia,
  clampProgress,
  downloadWatchlistJson,
  entryFromMedia,
  fetchMediaById,
  fetchMediaByIds,
  isNextAiringStale,
  loadEntries,
  persistEntries,
  shouldAutoComplete,
  technicalFieldsFromMedia,
  toggleValue,
} from "@/lib/watchlist";
import { fetchWatchlistState, saveWatchlistState } from "@/lib/watchlist-sync";

export type ViewId = "dashboard" | "list" | "search" | "season";
export type LayoutId = "grid" | "list";
export type SortId = "updated" | "title" | "rating" | "progress";

type ToastState = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
} | null;

type DeletedSnapshot = { entry: WatchlistEntry; index: number };

type WatchlistState = {
  entries: WatchlistEntry[];
  hydrated: boolean;
  view: ViewId;
  layout: LayoutId;
  statusFilter: StatusKey | "Tous";
  sortBy: SortId;
  listQuery: string;
  genreFilters: string[];
  yearFilters: number[];
  studioFilters: string[];
  tagFilters: string[];
  peopleFilters: string[];
  activeEntryId: string | null;
  toast: ToastState;
  lastDeleted: DeletedSnapshot | null;
  refreshingId: string | null;
  userId: string | null;
  hydrate: (userId: string) => void;
  setView: (view: ViewId) => void;
  setLayout: (layout: LayoutId) => void;
  setStatusFilter: (filter: StatusKey | "Tous") => void;
  setSortBy: (sort: SortId) => void;
  setListQuery: (query: string) => void;
  toggleGenreFilter: (genre: string) => void;
  toggleYearFilter: (year: number) => void;
  toggleStudioFilter: (studio: string) => void;
  toggleTagFilter: (tag: string) => void;
  togglePeopleFilter: (person: string) => void;
  applyGenreAndOpenList: (genre: string) => void;
  clearAdvancedFilters: () => void;
  setActiveEntryId: (id: string | null) => void;
  showToast: (toast: Exclude<ToastState, null>) => void;
  clearToast: () => void;
  addEntry: (media: AniListMedia) => boolean;
  updateEntry: (id: string, changes: Partial<WatchlistEntry>) => void;
  bumpProgress: (id: string, delta: number) => void;
  setProgress: (id: string, progress: number) => void;
  removeEntry: (id: string) => void;
  undoRemove: () => void;
  exportJson: () => void;
  refreshFromAniList: (id: string) => Promise<void>;
  /** Non-blocking: refresh nextAiring for Watching entries whose cache is > 6h old */
  refreshNextAirings: () => Promise<void>;
  /** Merge a batch of new entries (import) — skips anilistId already present */
  applyImportedEntries: (incoming: WatchlistEntry[]) => void;
  // ---- Bulk selection (list view) ----
  selectionMode: boolean;
  selectedIds: string[];
  setSelectionMode: (on: boolean) => void;
  toggleSelected: (id: string) => void;
  selectAllVisible: (ids: string[]) => void;
  clearSelection: () => void;
  bulkSetStatus: (status: StatusKey) => void;
  bulkRemove: () => void;
  bulkAddTag: (tag: string) => void;
  // ---- Offline ----
  online: boolean;
  setOnline: (online: boolean) => void;
};

let toastTimer: ReturnType<typeof setTimeout> | null = null;

// ---- Server sync ---------------------------------------------------------
// localStorage stays the instant, offline-safe write; the server call is
// debounced and fire-and-forget so typing a comment or nudging progress
// never waits on the network. A failed push is logged and surfaced once via
// toast — it does NOT roll back the local change, since the local copy (and
// the next successful push) remains the source of truth.
const SYNC_DEBOUNCE_MS = 700;
let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncInFlight: Promise<unknown> | null = null;
let syncQueued = false;

function scheduleSync(get: () => WatchlistState) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => void pushToServer(get), SYNC_DEBOUNCE_MS);
}

async function pushToServer(get: () => WatchlistState) {
  if (syncInFlight) {
    // A push is already running: mark that another one is needed once it
    // settles, instead of racing two writes for the same user.
    syncQueued = true;
    return;
  }
  const entries = get().entries;
  syncInFlight = saveWatchlistState({ data: { entries } })
    .catch((err) => {
      console.error("[watchlist] server sync failed", err);
      get().showToast({
        message: "Synchronisation impossible — enregistré sur cet appareil seulement",
      });
    })
    .finally(() => {
      syncInFlight = null;
      if (syncQueued) {
        syncQueued = false;
        void pushToServer(get);
      }
    });
  await syncInFlight;
}

function applyPersist(
  entries: WatchlistEntry[],
  userId: string | null,
  get: () => WatchlistState,
) {
  persistEntries(entries, userId);
  scheduleSync(get);
  return entries;
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  entries: [],
  hydrated: false,
  view: "dashboard",
  layout: "grid",
  statusFilter: "Tous",
  sortBy: "updated",
  listQuery: "",
  genreFilters: [],
  yearFilters: [],
  studioFilters: [],
  tagFilters: [],
  peopleFilters: [],
  activeEntryId: null,
  toast: null,
  lastDeleted: null,
  refreshingId: null,
  userId: null,
  selectionMode: false,
  selectedIds: [],
  online: typeof navigator !== "undefined" ? navigator.onLine : true,

  hydrate: (userId) => {
    if (get().hydrated && get().userId === userId) return;
    // Show the local copy immediately (instant, works offline) — the server
    // fetch below only ever refines this, it never blocks first paint.
    const local = loadEntries(userId);
    set({ entries: local, hydrated: true, userId });
    void (async () => {
      try {
        const remote = await fetchWatchlistState();
        if (get().userId !== userId) return; // user changed while this was in flight
        if (remote == null) {
          // No server record yet for this account: seed it from the local
          // copy (covers "first sign-in after using the app signed out" and
          // brand-new accounts alike; a no-op if local is also empty).
          if (local.length > 0) scheduleSync(get);
        } else {
          set({ entries: remote });
          persistEntries(remote, userId);
        }
      } catch (err) {
        // Offline or the server call failed: keep working off the local
        // copy, no toast on this one — it fires on every sign-in and would
        // be noisy for a purely transient/offline case.
        console.error("[watchlist] initial sync failed", err);
      }
      // After local (and optional server) data is shown, refresh airing dates
      // in the background — previous values stay visible until this completes.
      if (get().userId === userId) void get().refreshNextAirings();
    })();
  },

  setView: (view) => set({ view }),
  setLayout: (layout) => set({ layout }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
  setSortBy: (sortBy) => set({ sortBy }),
  setListQuery: (listQuery) => set({ listQuery }),
  toggleGenreFilter: (genre) =>
    set({ genreFilters: toggleValue(get().genreFilters, genre) }),
  toggleYearFilter: (year) =>
    set({ yearFilters: toggleValue(get().yearFilters, year) }),
  toggleStudioFilter: (studio) =>
    set({ studioFilters: toggleValue(get().studioFilters, studio) }),
  toggleTagFilter: (tag) => set({ tagFilters: toggleValue(get().tagFilters, tag) }),
  togglePeopleFilter: (person) =>
    set({ peopleFilters: toggleValue(get().peopleFilters, person) }),
  applyGenreAndOpenList: (genre) =>
    set({
      genreFilters: [genre],
      view: "list",
      statusFilter: "Tous",
      listQuery: "",
      yearFilters: [],
      studioFilters: [],
      tagFilters: [],
      peopleFilters: [],
    }),
  clearAdvancedFilters: () =>
    set({
      listQuery: "",
      genreFilters: [],
      yearFilters: [],
      studioFilters: [],
      tagFilters: [],
      peopleFilters: [],
    }),
  setActiveEntryId: (activeEntryId) => set({ activeEntryId }),

  showToast: (toast) => {
    if (toastTimer) clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => {
      set({ toast: null });
      toastTimer = null;
    }, 4200);
  },

  clearToast: () => {
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    set({ toast: null });
  },

  addEntry: (media) => {
    const { entries, showToast } = get();
    if (entries.some((e) => e.anilistId === media.id)) {
      showToast({ message: "Déjà dans ta watchlist" });
      return false;
    }
    const entry = entryFromMedia(media);
    set({ entries: applyPersist([entry, ...entries], get().userId, get) });
    showToast({ message: `« ${entry.title} » ajouté` });
    return true;
  },

  updateEntry: (id, changes) => {
    const { entries, showToast } = get();
    let autoCompletedTitle: string | null = null;
    let becameWatching = false;
    const next = entries.map((e) => {
      if (e.id !== id) return e;
      const prevStatus = e.status;
      const merged: WatchlistEntry = {
        ...e,
        ...changes,
        updatedAt: new Date().toISOString(),
      };
      merged.progress = clampProgress(merged.progress, merged.totalEpisodes);
      if (shouldAutoComplete(merged.status, merged.progress, merged.totalEpisodes)) {
        merged.status = "Completed";
        autoCompletedTitle = merged.title;
      }
      if (merged.status === "Watching" && prevStatus !== "Watching") {
        becameWatching = true;
        merged.nextAiring = null; // force AniList refresh
      }
      return merged;
    });
    set({ entries: applyPersist(next, get().userId, get) });
    if (autoCompletedTitle) {
      showToast({ message: `« ${autoCompletedTitle} » marqué comme terminé` });
    }
    if (becameWatching) void get().refreshNextAirings();
  },

  bumpProgress: (id, delta) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    get().updateEntry(id, { progress: entry.progress + delta });
  },

  setProgress: (id, progress) => {
    get().updateEntry(id, { progress });
  },

  removeEntry: (id) => {
    const { entries, showToast } = get();
    const index = entries.findIndex((e) => e.id === id);
    if (index < 0) return;
    const entry = entries[index];
    const next = entries.filter((e) => e.id !== id);
    set({
      entries: applyPersist(next, get().userId, get),
      activeEntryId: null,
      lastDeleted: { entry, index },
    });
    showToast({
      message: `« ${entry.title} » retiré`,
      actionLabel: "Annuler",
      onAction: () => get().undoRemove(),
    });
  },

  undoRemove: () => {
    const { lastDeleted, entries, showToast } = get();
    if (!lastDeleted) return;
    const next = [...entries];
    const idx = Math.min(lastDeleted.index, next.length);
    next.splice(idx, 0, lastDeleted.entry);
    set({
      entries: applyPersist(next, get().userId, get),
      lastDeleted: null,
      activeEntryId: lastDeleted.entry.id,
    });
    showToast({ message: "Suppression annulée" });
  },

  exportJson: () => {
    downloadWatchlistJson(get().entries);
    get().showToast({ message: "Watchlist exportée" });
  },

  refreshFromAniList: async (id) => {
    const entry = get().entries.find((e) => e.id === id);
    if (!entry) return;
    set({ refreshingId: id });
    try {
      const media = await fetchMediaById(entry.anilistId);
      get().updateEntry(id, technicalFieldsFromMedia(media));
      get().showToast({ message: "Infos AniList mises à jour" });
    } catch (err) {
      get().showToast({
        message: "Mise à jour impossible : " + (err as Error).message,
      });
    } finally {
      set({ refreshingId: null });
    }
  },

  refreshNextAirings: async () => {
    const watching = get().entries.filter(
      (e) => e.status === "Watching" && isNextAiringStale(e),
    );
    if (watching.length === 0) return;
    try {
      const mediaList = await fetchMediaByIds(watching.map((e) => e.anilistId));
      if (mediaList.length === 0) return;
      const byId = new Map(mediaList.map((m) => [m.id, m]));
      const now = new Date().toISOString();
      const { entries, userId } = get();
      const next = entries.map((e) => {
        if (e.status !== "Watching") return e;
        const media = byId.get(e.anilistId);
        if (!media) return e;
        // airingAt: 0 + episode: 0 = "no upcoming ep", but fetchedAt stamps
        // the cache so isNextAiringStale stays false for 6h.
        return {
          ...e,
          totalEpisodes: media.episodes ?? e.totalEpisodes,
          nextAiring: media.nextAiringEpisode
            ? {
                airingAt: media.nextAiringEpisode.airingAt,
                episode: media.nextAiringEpisode.episode,
                fetchedAt: now,
              }
            : { airingAt: 0, episode: 0, fetchedAt: now },
        };
      });
      set({ entries: applyPersist(next, userId, get) });
    } catch (err) {
      console.error("[watchlist] nextAiring refresh failed", err);
    }
  },

  applyImportedEntries: (incoming) => {
    if (incoming.length === 0) return;
    const { entries, userId } = get();
    const existing = new Set(entries.map((e) => e.anilistId));
    const fresh = incoming.filter((e) => !existing.has(e.anilistId));
    if (fresh.length === 0) return;
    set({ entries: applyPersist([...fresh, ...entries], userId, get) });
    // Refresh airing dates for newly imported Watching titles
    void get().refreshNextAirings();
  },

  setSelectionMode: (on) =>
    set({ selectionMode: on, selectedIds: on ? get().selectedIds : [] }),
  toggleSelected: (id) => {
    const cur = get().selectedIds;
    set({
      selectedIds: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    });
  },
  selectAllVisible: (ids) => set({ selectedIds: [...new Set(ids)] }),
  clearSelection: () => set({ selectedIds: [], selectionMode: false }),

  bulkSetStatus: (status) => {
    const { selectedIds, entries, userId, showToast } = get();
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const now = new Date().toISOString();
    const next = entries.map((e) =>
      idSet.has(e.id) ? { ...e, status, updatedAt: now } : e,
    );
    set({
      entries: applyPersist(next, userId, get),
      selectedIds: [],
      selectionMode: false,
    });
    showToast({
      message: `${selectedIds.length} titre${selectedIds.length > 1 ? "s" : ""} mis à jour`,
    });
  },

  bulkRemove: () => {
    const { selectedIds, entries, userId, showToast } = get();
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const next = entries.filter((e) => !idSet.has(e.id));
    const n = selectedIds.length;
    set({
      entries: applyPersist(next, userId, get),
      selectedIds: [],
      selectionMode: false,
      activeEntryId: null,
    });
    showToast({ message: `${n} titre${n > 1 ? "s" : ""} supprimé${n > 1 ? "s" : ""}` });
  },

  bulkAddTag: (tag) => {
    const t = tag.trim();
    if (!t) return;
    const { selectedIds, entries, userId, showToast } = get();
    if (selectedIds.length === 0) return;
    const idSet = new Set(selectedIds);
    const now = new Date().toISOString();
    const next = entries.map((e) => {
      if (!idSet.has(e.id)) return e;
      if (e.tags.includes(t)) return e;
      return { ...e, tags: [...e.tags, t], updatedAt: now };
    });
    set({
      entries: applyPersist(next, userId, get),
      selectedIds: [],
      selectionMode: false,
    });
    showToast({ message: `Tag « ${t} » ajouté` });
  },

  setOnline: (online) => {
    set({ online });
    if (online) {
      // Flush local changes that may have piled up while offline
      void saveWatchlistState({ data: { entries: get().entries } }).catch((err) => {
        console.error("[watchlist] reconnect sync failed", err);
      });
    }
  },
}));
