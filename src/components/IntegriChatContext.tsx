import { createContext, useContext, useState, ReactNode } from "react";

interface IntegriChatContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const IntegriChatContext = createContext<IntegriChatContextValue | undefined>(undefined);

export const IntegriChatProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <IntegriChatContext.Provider
      value={{
        open,
        toggle: () => setOpen((v) => !v),
        close: () => setOpen(false),
      }}
    >
      {children}
    </IntegriChatContext.Provider>
  );
};

export const useIntegriChat = () => {
  const ctx = useContext(IntegriChatContext);
  if (!ctx) throw new Error("useIntegriChat must be used within IntegriChatProvider");
  return ctx;
};
