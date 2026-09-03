-- Public shareable watchlist link (read-only).
-- Token is unguessable; disabling share clears the token and invalidates old links.

create table if not exists "watchlist_share" (
  "user_id" text not null primary key references "user" ("id") on delete cascade,
  "token" text not null unique,
  "enabled" boolean not null default true,
  "created_at" timestamptz not null default current_timestamp,
  "updated_at" timestamptz not null default current_timestamp
);

create index if not exists "watchlist_share_token_idx" on "watchlist_share" ("token");
