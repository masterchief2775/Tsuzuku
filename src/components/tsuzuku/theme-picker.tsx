import { useEffect, useRef, useState } from "react";
import { Palette } from "lucide-react";
import { applyTheme, getStoredTheme, THEMES, type ThemeId } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemePicker() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeId>("dark");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = getStoredTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onDoc(ev: MouseEvent) {
      if (!rootRef.current?.contains(ev.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (id: ThemeId) => {
    setTheme(id);
    applyTheme(id);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-[8px] border border-line bg-raised p-2"
        aria-label="Changer le thème"
        title="Thème"
        aria-expanded={open}
      >
        <Palette className="size-4" />
      </button>
      {open ? (
        <div className="absolute top-11 right-0 z-[80] w-48 rounded-[12px] border border-line bg-raised p-2 shadow-xl">
          <div className="mb-1.5 px-2 text-[10.5px] font-semibold tracking-wide text-dim uppercase">
            Thème
          </div>
          <div className="flex flex-col gap-0.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => pick(t.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-[8px] px-2.5 py-2 text-left text-[13px] font-semibold",
                  theme === t.id ? "bg-bg text-ink" : "text-dim hover:bg-bg hover:text-ink",
                )}
              >
                <span className="flex gap-0.5">
                  {t.swatch.map((c) => (
                    <span
                      key={c}
                      className="size-3 rounded-full border border-line/50"
                      style={{ background: c }}
                    />
                  ))}
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
