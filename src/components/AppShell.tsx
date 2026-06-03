import { ReactNode } from "react";
import { useIntegriChat } from "./IntegriChatContext";
import { useSintegra } from "./SintegraContext";
import { useLocation } from "react-router-dom";

/**
 * Wraps every routed page so that when the Integgri Chat or Sintegra panel is open,
 * the main content shrinks to ~60% (margin-right 40vw on md+),
 * keeping the panel persistent across navigation. Auth page is excluded.
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const { open: integriOpen } = useIntegriChat();
  const { open: sintegraOpen } = useSintegra();
  const location = useLocation();
  const isAuth = location.pathname.startsWith("/auth");

  if (isAuth) return <>{children}</>;

  const panelOpen = integriOpen || sintegraOpen;

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        panelOpen ? "md:mr-[40vw]" : ""
      }`}
    >
      {children}
    </div>
  );
};
