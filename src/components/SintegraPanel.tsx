import { useEffect, useRef, useState } from "react";
import { useSintegra } from "./SintegraContext";
import { X, FileSearch, ExternalLink, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const SINTEGRA_URL =
  "https://www.cadesp.fazenda.sp.gov.br/Pages/Cadastro/Consultas/ConsultaPublica/ConsultaPublica.aspx";

export const SintegraPanel = () => {
  const { open, close } = useSintegra();
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (!open) {
      setLoaded(false);
      setBlocked(false);
      return;
    }
    // If onload doesn't fire within 6s the site likely blocked the iframe.
    const t = setTimeout(() => {
      if (!loaded) setBlocked(true);
    }, 6000);
    return () => clearTimeout(t);
  }, [open, loaded]);

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="sintegra-panel"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 right-0 z-40 h-screen border-l bg-card shadow-2xl flex flex-col
                     w-full md:w-[40vw] md:min-w-[360px]"
        >
          <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
            <div className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold">Sintegra SP</span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" asChild aria-label="Abrir em nova aba">
                <a href={SINTEGRA_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" onClick={close} aria-label="Fechar Sintegra">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 relative bg-white">
            <iframe
              ref={iframeRef}
              src={SINTEGRA_URL}
              title="Sintegra SP"
              className="absolute inset-0 w-full h-full border-0 bg-white"
              onLoad={() => setLoaded(true)}
              referrerPolicy="no-referrer"
            />
            {blocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-card text-center p-6">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
                <div>
                  <p className="font-semibold">O Sintegra bloqueia visualização embutida</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    O portal da Fazenda/SP não permite ser exibido dentro de outros sites.
                    Abra em uma nova aba para utilizá-lo normalmente.
                  </p>
                </div>
                <Button asChild className="gap-2">
                  <a href={SINTEGRA_URL} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" /> Abrir Sintegra em nova aba
                  </a>
                </Button>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
