import { useLocation } from "react-router-dom";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";

/**
 * Mounted once at app root so the YT iframe instance survives route changes.
 * Positioned fixed at the top-right to visually live next to the header
 * (theme toggle / profile area), without being unmounted by route swaps.
 * Hidden on the Auth page.
 */
export const FloatingMusicPlayer = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/auth")) return null;

  return (
    <div className="fixed top-3 right-4 z-[60] flex items-center bg-card/90 backdrop-blur rounded-full border shadow-md">
      <BackgroundMusicPlayer />
    </div>
  );
};
