/**
 * theme_toggle.tsx
 * 主题切换组件(太阳/月亮)
 * - 浅色模式(默认)
 * - 深色模式
 * - 使用 CSS class 切换
 */

"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  function applyTheme(t: "light" | "dark") {
    const root = document.documentElement;
    if (t === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  useEffect(() => {
    const syncTheme = () => {
      const saved = localStorage.getItem("trai-theme") as "light" | "dark" | null;
      const initial = saved ?? "light";
      applyTheme(initial);
      setTheme(initial);
    };

    syncTheme();
    window.addEventListener("storage", syncTheme);
    return () => window.removeEventListener("storage", syncTheme);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    applyTheme(next);
    localStorage.setItem("trai-theme", next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={theme === "light" ? "切换到深色模式" : "切换到浅色模式"}
      className="relative w-9 h-9 rounded-none flex items-center justify-center transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10"
    >
      <Sun
        className={`h-4.5 w-4.5 transition-all duration-300 ${
          theme === "dark"
            ? "text-slate-400 rotate-90 scale-0"
            : "text-cyan-500 rotate-0 scale-100"
        }`}
        style={{ position: theme === "dark" ? "absolute" : "relative" }}
      />
      <Moon
        className={`h-4.5 w-4.5 transition-all duration-300 ${
          theme === "light"
            ? "text-slate-400 -rotate-90 scale-0"
            : "text-blue-400 rotate-0 scale-100"
        }`}
        style={{ position: theme === "light" ? "absolute" : "relative" }}
      />
    </button>
  );
}
