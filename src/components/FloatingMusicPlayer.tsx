import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";

/**
 * The BackgroundMusicPlayer is mounted ONCE at the app root and rendered via
 * a portal. The portal target switches between the Header's #header-music-slot
 * (when present) and a fixed default container appended to <body>. Because the
 * createPortal call is always rendered with the same children, React preserves
 * the component instance — and therefore the YouTube iframe — across route
 * changes. This guarantees the music never stops while navigating.
 */
export const FloatingMusicPlayer = () => {
  const location = useLocation();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  // Default floating container — created once and reused forever.
  const defaultContainer = useMemo(() => {
    if (typeof document === "undefined") return null;
    const el = document.createElement("div");
    el.className =
      "fixed top-3 right-4 z-[60] flex items-center bg-card/90 backdrop-blur rounded-full border shadow-md";
    return el;
  }, []);

  useEffect(() => {
    if (!defaultContainer) return;
    document.body.appendChild(defaultContainer);
    return () => {
      try {
        document.body.removeChild(defaultContainer);
      } catch {}
    };
  }, [defaultContainer]);

  // Re-resolve the header slot whenever route changes.
  useEffect(() => {
    let attempts = 0;
    let timer: number | undefined;
    const tick = () => {
      const el = document.getElementById("header-music-slot");
      setSlot(el);
      if (!el && attempts++ < 20) {
        timer = window.setTimeout(tick, 100);
      }
    };
    tick();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [location.pathname]);

  // Hide visually on the auth page (but keep mounted so audio survives).
  const isAuth = location.pathname.startsWith("/auth");

  useEffect(() => {
    if (!defaultContainer) return;
    defaultContainer.style.display = isAuth ? "none" : "";
  }, [isAuth, defaultContainer]);

  // Hide the floating fallback when the header slot is in use.
  useEffect(() => {
    if (!defaultContainer) return;
    if (slot && !isAuth) {
      defaultContainer.style.display = "none";
    } else if (!isAuth) {
      defaultContainer.style.display = "";
    }
  }, [slot, isAuth, defaultContainer]);

  const target = slot ?? defaultContainer;
  if (!target) return null;

  return createPortal(<BackgroundMusicPlayer />, target);
};
