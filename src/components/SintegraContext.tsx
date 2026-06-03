import { createContext, useContext, useState, ReactNode } from "react";

interface SintegraContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
  openPanel: () => void;
}

const Ctx = createContext<SintegraContextValue | undefined>(undefined);

export const SintegraProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  return (
    <Ctx.Provider
      value={{
        open,
        toggle: () => setOpen((v) => !v),
        close: () => setOpen(false),
        openPanel: () => setOpen(true),
      }}
    >
      {children}
    </Ctx.Provider>
  );
};

export const useSintegra = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSintegra must be used within SintegraProvider");
  return ctx;
};
