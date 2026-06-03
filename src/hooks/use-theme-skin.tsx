import { useEffect, useState } from "react";

export type ThemeSkin = "default" | "aurora";

const STORAGE_KEY = "app:theme-skin";
const EVENT = "app:theme-skin-change";
const SKINS: ThemeSkin[] = ["default", "aurora"];

function applySkin(skin: ThemeSkin) {
  const root = document.documentElement;
  SKINS.forEach((s) => root.classList.remove(`theme-${s}`));
  root.classList.add(`theme-${skin}`);
}

function getInitial(): ThemeSkin {
  if (typeof window === "undefined") return "default";
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeSkin | null;
  return saved && SKINS.includes(saved) ? saved : "default";
}

if (typeof window !== "undefined") {
  applySkin(getInitial());
}

export function useThemeSkin() {
  const [skin, setSkinState] = useState<ThemeSkin>(getInitial);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<ThemeSkin>).detail;
      if (SKINS.includes(detail)) setSkinState(detail);
    };
    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  const setSkin = (s: ThemeSkin) => {
    localStorage.setItem(STORAGE_KEY, s);
    applySkin(s);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: s }));
  };

  return { skin, setSkin, skins: SKINS };
}
