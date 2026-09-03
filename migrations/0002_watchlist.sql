-- App table: one JSON snapshot of a user's watchlist per user.
--
-- The whole list is kept as a single JSONB blob because that's exactly the
-- shape the client already works with (WatchlistEntry[] in
-- src/lib/watchlist.ts) — syncing becomes one read + one write instead of
-- mapping each field to its own column and reconciling arrays server-side.
-- Revisit with a normalized `watchlist_entries` table (one row per anime) if
-- the app ever needs server-side querying/filtering instead of just syncing
-- what the client already filters/sorts locally.

create table if not exists "watchlist_state" (
  "user_id" text not null primary key references "user" ("id") on delete cascade,
  "entries" jsonb not null default '[]'::jsonb,
  "updated_at" timestamptz not null default current_timestamp
);
