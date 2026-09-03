import { r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-CLcydPFF.mjs";
import { t as authMiddleware } from "./middleware-BxCdRLFd.mjs";
import { t as createServerRpc } from "./createServerRpc-CcvdN_gc.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/share-D9BE2K-G.js
function toPublic(entries) {
	return entries.map((e) => ({
		anilistId: e.anilistId,
		title: e.title,
		image: e.image,
		totalEpisodes: e.totalEpisodes,
		format: e.format,
		status: e.status,
		progress: e.progress,
		rating: e.rating,
		year: e.year
	}));
}
function newToken() {
	const bytes = /* @__PURE__ */ new Uint8Array(24);
	crypto.getRandomValues(bytes);
	return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
var getShareSettings_createServerFn_handler = createServerRpc({
	id: "a406be802f531d94a4d6c7756b764a19d71ecbeb0f99cf6bfbd2532cf4be6a76",
	name: "getShareSettings",
	filename: "src/lib/share.ts"
}, (opts) => getShareSettings.__executeServer(opts));
var getShareSettings = createServerFn({ method: "GET" }).middleware([authMiddleware]).handler(getShareSettings_createServerFn_handler, async ({ context }) => {
	const row = (await (await getSql())`
      select "token", "enabled" from "watchlist_share" where "user_id" = ${context.userId}
    `)[0];
	if (!row) return {
		enabled: false,
		token: null
	};
	return {
		enabled: row.enabled,
		token: row.enabled ? row.token : null
	};
});
var enableShare_createServerFn_handler = createServerRpc({
	id: "85427cee208dae1873c3af85d91839ababad9cc77c432e20eb9480c0d0a7fc59",
	name: "enableShare",
	filename: "src/lib/share.ts"
}, (opts) => enableShare.__executeServer(opts));
var enableShare = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(enableShare_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const token = newToken();
	await sql`
      insert into "watchlist_share" ("user_id", "token", "enabled", "updated_at")
      values (${context.userId}, ${token}, true, current_timestamp)
      on conflict ("user_id")
      do update set "token" = excluded."token", "enabled" = true, "updated_at" = current_timestamp
    `;
	return {
		enabled: true,
		token
	};
});
var disableShare_createServerFn_handler = createServerRpc({
	id: "04bfda89ec268e17fde0a8063afd8de25eaa902658be4068fb190923019b00f4",
	name: "disableShare",
	filename: "src/lib/share.ts"
}, (opts) => disableShare.__executeServer(opts));
var disableShare = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(disableShare_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const dead = newToken();
	await sql`
      insert into "watchlist_share" ("user_id", "token", "enabled", "updated_at")
      values (${context.userId}, ${dead}, false, current_timestamp)
      on conflict ("user_id")
      do update set "token" = excluded."token", "enabled" = false, "updated_at" = current_timestamp
    `;
	return {
		enabled: false,
		token: null
	};
});
var fetchPublicShare_createServerFn_handler = createServerRpc({
	id: "efc2fe1668c6b4f89393dcea43497810ad83250c61cb9696c4d6b2c5f1aa0076",
	name: "fetchPublicShare",
	filename: "src/lib/share.ts"
}, (opts) => fetchPublicShare.__executeServer(opts));
var fetchPublicShare = createServerFn({ method: "GET" }).validator((input) => {
	const token = input?.token;
	if (!token || typeof token !== "string" || token.length < 16) throw new Error("Token invalide");
	return { token };
}).handler(fetchPublicShare_createServerFn_handler, async ({ data }) => {
	const sql = await getSql();
	const share = (await sql`
      select "user_id", "enabled" from "watchlist_share" where "token" = ${data.token}
    `)[0];
	if (!share || !share.enabled) return null;
	const pub = toPublic((await sql`
      select "entries" from "watchlist_state" where "user_id" = ${share.user_id}
    `)[0]?.entries ?? []);
	return {
		entries: pub,
		count: pub.length
	};
});
//#endregion
export { disableShare_createServerFn_handler, enableShare_createServerFn_handler, fetchPublicShare_createServerFn_handler, getShareSettings_createServerFn_handler };
