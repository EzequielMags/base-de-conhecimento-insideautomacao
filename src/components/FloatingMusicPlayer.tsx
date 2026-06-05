import { useLocation } from "react-router-dom";
import { BackgroundMusicPlayer } from "./BackgroundMusicPlayer";
import { useIntegriChat } from "./IntegriChatContext";
import { useSintegra } from "./SintegraContext";

/**
 * Floating music player is mounted ONCE at the app root so its iframe survives
 * route changes. When a side panel (Sintegra / Integgri) is open we shift it
 * left so it stays visible OVER the main site, not on top of the panel.
 */
export const FloatingMusicPlayer = () => {
  const location = useLocation();
  const isAuth = location.pathname.startsWith("/auth");
  const { open: integriOpen } = useIntegriChat();
  const { open: sintegraOpen } = useSintegra();
  const panelOpen = integriOpen || sintegraOpen;

  return (
    <div
      className={`fixed bottom-5 z-[60] flex items-center bg-card/95 backdrop-blur rounded-full border shadow-lg transition-[right] duration-300 ease-in-out ${
        panelOpen ? "right-[calc(40vw+1.25rem)]" : "right-5"
      }`}
      style={{ display: isAuth ? "none" : undefined }}
    >
      <BackgroundMusicPlayer />
    </div>
  );
};
