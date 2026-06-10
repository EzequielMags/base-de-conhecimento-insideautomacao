import { useEffect, useMemo, useState } from "react";
import { Bell, Sparkles } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NoteSection { title: string; items: string[]; }

const NOTES: NoteSection[] = [
  {
    title: "Atualização 2026.06.10",
    items: [
      "Verificação de conta: novos usuários precisam de aprovação do administrador.",
      "Player de música agora aceita qualquer link do YouTube e mantém histórico.",
      "Otimização geral: carregamento por rota, animações mais leves e bundles separados.",
      "Sino de notificações no topo substitui o pop-up de atualizações.",
    ],
  },
  {
    title: "Atualização 2026.06.05",
    items: [
      "Menu lateral lembra se você o deixou aberto ou recolhido entre páginas.",
      "Painel do Sintegra (SP) não cobre mais o topo nem o player de música.",
      "Dois temas novos: Blood (vermelho + preto) e Midnight (preto + azul marinho).",
    ],
  },
];

const STORAGE_KEY = "app:last-seen-notification";
const LATEST_VERSION = NOTES[0]?.title ?? "";

export const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);

  useEffect(() => {
    try { setLastSeen(localStorage.getItem(STORAGE_KEY)); } catch { /* ignore */ }
  }, []);

  const unreadCount = useMemo(() => {
    if (!lastSeen) return NOTES.length;
    const idx = NOTES.findIndex((n) => n.title === lastSeen);
    return idx < 0 ? NOTES.length : idx;
  }, [lastSeen]);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o && LATEST_VERSION) {
      try { localStorage.setItem(STORAGE_KEY, LATEST_VERSION); } catch { /* ignore */ }
      setLastSeen(LATEST_VERSION);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full" aria-label="Notificações">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full",
                "bg-destructive text-destructive-foreground text-[10px] font-bold",
                "flex items-center justify-center border-2 border-background"
              )}
            >
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="p-4 border-b flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <p className="font-semibold text-sm">Novidades</p>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {NOTES.map((section) => (
            <div key={section.title} className="space-y-2">
              <h3 className="text-xs font-semibold text-primary uppercase tracking-wider">
                {section.title}
              </h3>
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
      </PopoverContent>
    </Popover>
  );
};
