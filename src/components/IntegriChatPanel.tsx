import { useIntegriChat } from "./IntegriChatContext";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export const IntegriChatPanel = () => {
  const { open, close } = useIntegriChat();

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="integgri-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 right-0 z-40 h-screen border-l bg-card shadow-2xl flex flex-col
                     w-full md:w-[40vw] md:min-w-[360px]"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
                I
              </div>
              <span className="text-sm font-semibold">Integgri Chat</span>
            </div>
            <Button variant="ghost" size="icon" onClick={close} aria-label="Fechar Integgri Chat">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <iframe
            src="https://app.integgri.com.br"
            title="Integgri Chat"
            className="flex-1 w-full border-0"
            allow="clipboard-read; clipboard-write; microphone; camera"
          />
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
