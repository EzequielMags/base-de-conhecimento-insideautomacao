import { useLocation } from "react-router-dom";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";

/**
 * The BackgroundMusicPlayer is mounted ONCE at the app root in a fixed
 * floating container. It is never unmounted (or moved between portals)
 * so the YouTube iframe survives any route or category change and the
 * music keeps playing.
 */
export const FloatingMusicPlayer = () => {
  const location = useLocation();
  const isAuth = location.pathname.startsWith("/auth");

  return (
    <div
      className="fixed top-3 right-[7.5rem] z-[60] flex items-center bg-card/90 backdrop-blur rounded-full border shadow-md"
      style={{ display: isAuth ? "none" : undefined }}
    >
      <BackgroundMusicPlayer />
    </div>
  );
};
