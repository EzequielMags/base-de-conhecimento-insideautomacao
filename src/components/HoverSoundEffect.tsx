import { useEffect, useRef } from "react";

const SFX_URL = "/assets/audio/wind-hover.mp3";
const SFX_VOLUME = 0.15;

// Selectors for elements that should trigger the wind sound on hover
const HOVER_SELECTORS = [
  "button",
  "a[href]",
  "[role='button']",
  "[data-sfx-hover]",
  "[data-sidebar='menu-button']",
  ".card-hover",
];

export const HoverSoundEffect = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayRef = useRef(0);

  useEffect(() => {
    const audio = new Audio(SFX_URL);
    audio.preload = "auto";
    audio.volume = SFX_VOLUME;
    audioRef.current = audio;

    const playSfx = () => {
      const a = audioRef.current;
      if (!a) return;
      const now = Date.now();
      // Throttle to avoid spam (min 60ms between plays)
      if (now - lastPlayRef.current < 60) return;
      lastPlayRef.current = now;
      try {
        a.currentTime = 0;
        a.volume = SFX_VOLUME;
        a.play().catch(() => {
          // Autoplay blocked until user interacts; will work after first click
        });
      } catch {
        // ignore
      }
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || !target.closest) return;
      const matched = HOVER_SELECTORS.some((sel) => target.closest(sel));
      if (!matched) return;
      // Use relatedTarget to fire only on actual enter
      const related = (e as any).relatedTarget as Element | null;
      const matchedEl = HOVER_SELECTORS
        .map((sel) => target.closest(sel))
        .find(Boolean) as Element | null;
      if (matchedEl && related && matchedEl.contains(related)) return;
      playSfx();
    };

    document.addEventListener("mouseover", handleMouseOver, true);
    return () => {
      document.removeEventListener("mouseover", handleMouseOver, true);
      audio.pause();
      audio.src = "";
    };
  }, []);

  return null;
};
