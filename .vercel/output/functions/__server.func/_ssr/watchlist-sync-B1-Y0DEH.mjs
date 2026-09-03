import { r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-CLcydPFF.mjs";
import { t as authMiddleware } from "./middleware-BxCdRLFd.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watchlist-sync-B1-Y0DEH.js
var fetchWatchlistState_createServerFn_handler = createServerRpc({
	id: "eec0d2b013a7e176d83faed85fa739e1a468e2318635be72fc899414aa366c5a",
	name: "fetchWatchlistState",
	filename: "src/lib/watchlist-sync.ts"
}, (opts) => fetchWatchlistState.__executeServer(opts));
var fetchWatchlistState = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(fetchWatchlistState_createServerFn_handler, async ({ context }) => {
	return (await (await getSql())`
      select "entries" from "watchlist_state" where "user_id" = ${context.userId}
    `)[0]?.entries ?? null;
});
var saveWatchlistState_createServerFn_handler = createServerRpc({
	id: "026b9bb8d87a6b239b4cf35e31792c9ce1e9350c1590126723494ff80f5d3f04",
	name: "saveWatchlistState",
	filename: "src/lib/watchlist-sync.ts"
}, (opts) => saveWatchlistState.__executeServer(opts));
var saveWatchlistState = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((input) => {
	const entries = input?.entries;
	if (!Array.isArray(entries)) throw new Error("Invalid watchlist payload: 'entries' must be an array");
	return { entries };
}).handler(saveWatchlistState_createServerFn_handler, async ({ data, context }) => {
	await (await getSql())`
      insert into "watchlist_state" ("user_id", "entries", "updated_at")
      values (${context.userId}, ${JSON.stringify(data.entries)}::jsonb, current_timestamp)
      on conflict ("user_id")
      do update set "entries" = excluded."entries", "updated_at" = excluded."updated_at"
    `;
	return { ok: true };
});
//#endregion
export { fetchWatchlistState_createServerFn_handler, saveWatchlistState_createServerFn_handler };
