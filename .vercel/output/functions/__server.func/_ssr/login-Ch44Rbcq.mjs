import { o as __toESM } from "../_runtime.mjs";
import { B as require_react, b as require_jsx_runtime, v as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { r as signIn, t as authClient } from "./client-B40BzJxt.mjs";
import { t as GROK_PROVIDERS } from "./server-wLyIB-c9.mjs";
import { t as cn } from "./utils-C_uf36nf.mjs";
import { n as useCurrentUserState } from "./use-current-user-DG6UNzh9.mjs";
import { C as Eye, _ as LoaderCircle, g as LogIn, j as ArrowRight, n as UserPlus, w as EyeOff } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-Ch44Rbcq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const { user, isPending } = useCurrentUserState();
	const [mode, setMode] = (0, import_react.useState)("login");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [message, setMessage] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		setError(null);
		setMessage(null);
	}, [mode]);
	if (!isPending && user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	async function submit(ev) {
		ev.preventDefault();
		if (busy) return;
		setError(null);
		setMessage(null);
		const normalizedEmail = email.trim().toLowerCase();
		if (!normalizedEmail || !password) {
			setError("Entre ton adresse e-mail et ton mot de passe.");
			return;
		}
		if (mode === "signup") {
			if (!name.trim()) {
				setError("Entre ton nom ou ton pseudo.");
				return;
			}
			if (password.length < 8) {
				setError("Le mot de passe doit contenir au moins 8 caractères.");
				return;
			}
			if (password !== confirmPassword) {
				setError("Les mots de passe ne correspondent pas.");
				return;
			}
		}
		setBusy(true);
		try {
			if (mode === "signup") {
				const { error: signUpError } = await authClient.signUp.email({
					name: name.trim(),
					email: normalizedEmail,
					password
				});
				if (signUpError) throw new Error(signUpError.message ?? "Inscription impossible");
				setMessage("Compte créé. Connexion en cours…");
			} else {
				const { error: signInError } = await authClient.signIn.email({
					email: normalizedEmail,
					password,
					callbackURL: "/"
				});
				if (signInError) throw new Error(signInError.message ?? "Connexion impossible");
			}
			window.location.assign("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Une erreur est survenue.");
			setBusy(false);
		}
	}
	async function handleProvider(providerId) {
		if (busy) return;
		setBusy(true);
		setError(null);
		try {
			await signIn(providerId, { callbackURL: "/" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connexion impossible.");
			setBusy(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
		className: "grid min-h-dvh place-items-center bg-bg px-4 py-8 text-ink",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-7 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mx-auto mb-4 flex size-12 items-center justify-center rounded-sm bg-lime font-serif text-2xl font-semibold text-bg",
						children: "尋"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-serif text-3xl font-semibold tracking-tight",
						children: "Tsuzuku"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-dim",
						children: "Ta watchlist, en continu."
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "rounded-[18px] border border-line bg-raised p-5 shadow-sm sm:p-7",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-5 grid grid-cols-2 rounded-[10px] bg-bg p-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setMode("login"),
							className: cn("flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition", mode === "login" ? "bg-ink text-bg" : "text-dim hover:text-ink"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "size-4" }), " Connexion"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setMode("signup"),
							className: cn("flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition", mode === "signup" ? "bg-ink text-bg" : "text-dim hover:text-ink"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-4" }), " Inscription"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: GROK_PROVIDERS.map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: busy,
							onClick: () => void handleProvider(provider.providerId),
							className: "flex w-full items-center justify-between rounded-[10px] border border-line bg-bg px-4 py-3 text-sm font-semibold transition hover:border-ink/30 hover:bg-ink/5 disabled:cursor-wait disabled:opacity-60",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Continuer avec ", provider.label] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4" })]
						}, provider.providerId))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "my-5 flex items-center gap-3 text-xs text-dim",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-line" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ou avec ton e-mail" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-line" })
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "space-y-3.5",
						onSubmit: (ev) => void submit(ev),
						children: [
							mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-semibold text-dim",
									children: "Nom ou pseudo"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: name,
									onChange: (ev) => setName(ev.target.value),
									autoComplete: "name",
									className: "w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 text-sm outline-none transition focus:border-ink/40",
									placeholder: "Ton pseudo"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-semibold text-dim",
									children: "E-mail"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: email,
									onChange: (ev) => setEmail(ev.target.value),
									type: "email",
									autoComplete: "email",
									className: "w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 text-sm outline-none transition focus:border-ink/40",
									placeholder: "toi@example.com",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-semibold text-dim",
									children: "Mot de passe"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: password,
										onChange: (ev) => setPassword(ev.target.value),
										type: showPassword ? "text" : "password",
										autoComplete: mode === "login" ? "current-password" : "new-password",
										className: "w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 pr-11 text-sm outline-none transition focus:border-ink/40",
										placeholder: "••••••••",
										required: true
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setShowPassword((value) => !value),
										className: "absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-dim hover:text-ink",
										"aria-label": showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe",
										children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
									})]
								})]
							}),
							mode === "signup" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs font-semibold text-dim",
									children: "Confirmer le mot de passe"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: confirmPassword,
									onChange: (ev) => setConfirmPassword(ev.target.value),
									type: showPassword ? "text" : "password",
									autoComplete: "new-password",
									className: "w-full rounded-[10px] border border-line bg-bg px-3.5 py-3 text-sm outline-none transition focus:border-ink/40",
									placeholder: "••••••••",
									required: true
								})]
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-[10px] border border-red-500/20 bg-red-500/5 px-3.5 py-3 text-sm text-red-700",
								children: error
							}),
							message && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-[10px] border border-lime/30 bg-lime/10 px-3.5 py-3 text-sm",
								children: message
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "submit",
								disabled: busy,
								className: "flex w-full items-center justify-center gap-2 rounded-[10px] bg-ink px-4 py-3 text-sm font-semibold text-bg transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60",
								children: [busy ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : mode === "login" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserPlus, { className: "size-4" }), mode === "login" ? "Se connecter" : "Créer mon compte"]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-5 text-center text-xs leading-5 text-dim",
						children: [mode === "login" ? "Pas encore de compte ? " : "Tu as déjà un compte ? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMode(mode === "login" ? "signup" : "login"),
							className: "font-semibold text-ink underline underline-offset-4",
							children: mode === "login" ? "Inscris-toi" : "Connecte-toi"
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { LoginPage as component };
