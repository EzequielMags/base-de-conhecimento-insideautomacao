import { useLocation } from "react-router-dom";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";

/**
 * Renders the background music player as a fixed floating control,
 * mounted once at app root so the audio survives route changes.
 * Hidden on the Auth page.
 */
export const FloatingMusicPlayer = () => {
  const location = useLocation();
  if (location.pathname.startsWith("/auth")) return null;

  return (
    <div className="fixed top-3 right-20 z-[60] flex items-center bg-card/80 backdrop-blur rounded-full border shadow-sm">
      <BackgroundMusicPlayer />
    </div>
  );
};
