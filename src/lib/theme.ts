export type ThemeId = "dark" | "light" | "sakura" | "ocean";

export const THEMES: {
  id: ThemeId;
  label: string;
  swatch: [string, string, string];
}[] = [
  { id: "dark", label: "Nuit", swatch: ["#14161f", "#c8ff4d", "#1b1e2b"] },
  { id: "light", label: "Jour", swatch: ["#f4f2ec", "#3d7a1c", "#ffffff"] },
  { id: "sakura", label: "Sakura", swatch: ["#1a1218", "#ff8fab", "#241820"] },
  { id: "ocean", label: "Océan", swatch: ["#0c1520", "#4fd1c5", "#132033"] },
];

const STORAGE_KEY = "tsuzuku-theme";

export function getStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "dark";
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "light" || v === "sakura" || v === "ocean" || v === "dark") return v;
  return "dark";
}

export function applyTheme(id: ThemeId) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem(STORAGE_KEY, id);
}
