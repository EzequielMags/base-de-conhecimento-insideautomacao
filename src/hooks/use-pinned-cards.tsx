import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "pinnedCardIds";
const MAX_PINS = 3;

export const usePinnedCards = () => {
  const [pinned, setPinned] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pinned));
    } catch {}
  }, [pinned]);

  const toggle = useCallback((id: string): { ok: boolean; reason?: string } => {
    let result: { ok: boolean; reason?: string } = { ok: true };
    setPinned((prev) => {
      if (prev.includes(id)) {
        return prev.filter((p) => p !== id);
      }
      if (prev.length >= MAX_PINS) {
        result = { ok: false, reason: `Você só pode fixar até ${MAX_PINS} cards.` };
        return prev;
      }
      return [...prev, id];
    });
    return result;
  }, []);

  const isPinned = useCallback((id: string) => pinned.includes(id), [pinned]);

  const clear = useCallback(() => setPinned([]), []);

  return { pinned, toggle, isPinned, clear, max: MAX_PINS };
};
