import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";

/**
 * The BackgroundMusicPlayer must NEVER unmount (so the YT iframe survives
 * route changes). We mount it once at app root, then portal it into the
 * Header's #header-music-slot when that slot is present in the DOM.
 * If the slot doesn't exist (e.g. Auth page), the player renders as a
 * discreet floating control in the top-right.
 */
export const FloatingMusicPlayer = () => {
  const location = useLocation();
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Re-resolve the slot whenever the route changes (header may be
    // re-rendered) and on a small interval until found.
    let attempts = 0;
    const tick = () => {
      const el = document.getElementById("header-music-slot");
      setSlot(el);
      if (!el && attempts++ < 20) {
        setTimeout(tick, 100);
      }
    };
    tick();
  }, [location.pathname]);

  if (location.pathname.startsWith("/auth")) return null;

  if (slot) {
    return createPortal(<BackgroundMusicPlayer />, slot);
  }

  return (
    <div className="fixed top-3 right-4 z-[60] flex items-center bg-card/90 backdrop-blur rounded-full border shadow-md">
      <BackgroundMusicPlayer />
    </div>
  );
};
