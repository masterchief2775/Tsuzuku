import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import type { WatchlistEntry } from "@/lib/watchlist";

/**
 * Watchlist sync server functions. NOT named `*.server.ts` on purpose: that
 * suffix is TanStack Start's hard "never let this file's code reach the
 * client bundle" guard, but `createServerFn` already does that split itself
 * — the client only ever gets an RPC stub for `.handler()`'s body. Reserve
 * `.server.ts` for modules meant to be dynamically imported from inside a
 * `.server()` middleware/loader callback only (see @/lib/auth/verify.server
 * and how @/lib/auth/middleware.ts imports it) — importing one of those
 * statically from client code, like this file used to be, is what raised
 * "[import-protection] Import denied in client environment".
 *
 * Mirrors the client's own
 * localStorage read/write (src/lib/watchlist.ts loadEntries/persistEntries)
 * but scoped to the verified session user (see @/lib/auth/middleware and
 * migrations/0002_watchlist.sql) instead of the browser's storage.
 *
 * The client is the source of truth on every write: it keeps localStorage as
 * an instant, offline-safe cache and pushes the full `entries` array here
 * after each change (debounced — see scheduleSync/pushToServer in
 * src/store/watchlist-store.ts). `fetchWatchlistState` returns `null` when
 * the user has no server record yet
 * (first sign-in on a new device, or migrating from a purely-local install),
 * which the store treats as "nothing to overwrite the local copy with".
 */

export const fetchWatchlistState = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<WatchlistEntry[] | null> => {
    const sql = await getSql();
    const rows = await sql<{ entries: WatchlistEntry[] }>`
      select "entries" from "watchlist_state" where "user_id" = ${context.userId}
    `;
    return rows[0]?.entries ?? null;
  });

export const saveWatchlistState = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => {
    const entries = (input as { entries?: unknown } | null)?.entries;
    if (!Array.isArray(entries)) {
      throw new Error("Invalid watchlist payload: 'entries' must be an array");
    }
    return { entries: entries as WatchlistEntry[] };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const sql = await getSql();
    await sql`
      insert into "watchlist_state" ("user_id", "entries", "updated_at")
      values (${context.userId}, ${JSON.stringify(data.entries)}::jsonb, current_timestamp)
      on conflict ("user_id")
      do update set "entries" = excluded."entries", "updated_at" = excluded."updated_at"
    `;
    return { ok: true };
  });
