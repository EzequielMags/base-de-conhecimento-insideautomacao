import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

/**
 * One-time release notes dialog.
 * Bump APP_VERSION when shipping a new round of changes — every device/user
 * will see the popup the first time they load the app after the bump.
 *
 * Persistence is per-device via localStorage (key includes version), so each
 * version is shown exactly once per browser.
 */
const APP_VERSION = "2026.06.05";

const STORAGE_KEY = "app:last-seen-update";

const NOTES: { title: string; items: string[] }[] = [
  {
    title: "Atualização " + APP_VERSION,
    items: [
      "Menu lateral agora lembra se você o deixou aberto ou recolhido entre páginas.",
      "Guia de Permissões recolhe junto com o menu, ficando só o ícone quando o menu está fechado.",
      "Painel do Sintegra (SP) agora divide a tela corretamente, sem cobrir os botões do topo nem o player de música.",
      "Player de música permanece visível sobre o site quando o Sintegra ou Integgri estão abertos.",
      "Adicionada a faixa 'Me Leva - Latino' ao player de música de fundo.",
      "Dois novos temas em Configurações → Temas: Blood (vermelho + preto) e Midnight (preto + azul marinho).",
      "Notas de atualização aparecem automaticamente a cada nova versão do site.",
    ],
  },
];

export const UpdateNotes = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.startsWith("/auth")) return;
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      if (seen !== APP_VERSION) {
        // Slight delay so it doesn't fight with initial render animations
        const t = setTimeout(() => setOpen(true), 600);
        return () => clearTimeout(t);
      }
    } catch {
      /* ignore */
    }
  }, [location.pathname]);

  const dismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, APP_VERSION);
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? dismiss() : setOpen(o))}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Novidades desta atualização
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {NOTES.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-sm font-semibold text-primary">{section.title}</h3>
              <ul className="space-y-1.5 text-sm text-foreground/90">
                {section.items.map((it, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{it}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={dismiss} className="w-full sm:w-auto">
            Entendi, continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
