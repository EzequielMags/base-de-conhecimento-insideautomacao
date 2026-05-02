import { ReactNode } from "react";
import { useIntegriChat } from "./IntegriChatContext";
import { useLocation } from "react-router-dom";

/**
 * Wraps every routed page so that when the Integgri Chat is open,
 * the main content shrinks to ~60% (margin-right 40vw on md+),
 * keeping the chat persistent across navigation.
 * The Auth page is excluded.
 */
export const AppShell = ({ children }: { children: ReactNode }) => {
  const { open } = useIntegriChat();
  const location = useLocation();
  const isAuth = location.pathname.startsWith("/auth");

  if (isAuth) return <>{children}</>;

  return (
    <div
      className={`transition-all duration-300 ease-in-out ${
        open ? "md:mr-[40vw]" : ""
      }`}
    >
      {children}
    </div>
  );
};
