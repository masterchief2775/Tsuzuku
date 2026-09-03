import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route$1 } from "./router-B6BhLZiK.mjs";
import { k as progressText, n as STATUSES, t as Cover, v as fetchPublicShare } from "./share-aoZ0XyU7.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/share._token-CNSgjaIl.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function PublicSharePage() {
	const { token } = Route$1.useParams();
	const [entries, setEntries] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const [loading, setLoading] = (0, import_react.useState)(true);
	(0, import_react.useEffect)(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			try {
				const data = await fetchPublicShare({ data: { token } });
				if (cancelled) return;
				if (!data) {
					setError("Ce lien de partage est invalide ou a été désactivé.");
					setEntries(null);
				} else {
					setEntries(data.entries);
					setError("");
				}
			} catch (err) {
				if (!cancelled) setError(err.message);
			} finally {
				if (!cancelled) setLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [token]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-ink",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
			className: "border-b border-line px-4 py-5 sm:px-7",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-[1100px] items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "flex size-[38px] items-center justify-center rounded-sm bg-lime font-serif text-xl font-semibold text-bg",
					children: "尋"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "font-serif text-xl font-semibold",
					children: "Tsuzuku"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-dim",
					children: "Liste partagée · lecture seule"
				})] })]
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-[1100px] px-4 py-6 sm:px-7",
			children: [
				loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5",
					children: Array.from({ length: 8 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-lg border border-line bg-raised" }, i))
				}) : null,
				error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-20 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-dim",
						children: error
					})
				}) : null,
				entries && !error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mb-5 text-sm text-dim",
					children: [
						entries.length,
						" titre",
						entries.length > 1 ? "s" : ""
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3.5",
					children: entries.map((e) => {
						const meta = STATUSES.find((s) => s.key === e.status);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "overflow-hidden rounded-lg border border-line bg-raised",
							style: { ["--accent"]: meta?.color },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cover, {
								src: e.image,
								title: e.title,
								className: "h-[200px] w-full"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-3 pt-2.5 pb-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mb-1 min-h-[34px] text-[13px] leading-snug font-bold",
										children: e.title
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-[11.5px] text-dim",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[var(--accent)]",
											children: meta?.label ?? e.status
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: progressText({
											progress: e.progress,
											totalEpisodes: e.totalEpisodes,
											format: e.format
										}) })]
									}),
									e.rating != null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-1 text-[11.5px] text-lime",
										children: [e.rating, " ★"]
									}) : null
								]
							})]
						}, e.anilistId);
					})
				})] }) : null
			]
		})]
	});
}
//#endregion
export { PublicSharePage as component };
