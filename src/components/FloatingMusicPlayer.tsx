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
    <div className="fixed bottom-4 right-4 z-[60] flex items-center bg-card/90 backdrop-blur rounded-full border shadow-lg">
      <BackgroundMusicPlayer />
    </div>
  );
};
