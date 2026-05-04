import { useState } from "react";
import { Pin, Check, Search, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card as CardType } from "@/types/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Props {
  cards: CardType[];
  pinned: string[];
  max: number;
  onToggle: (id: string) => { ok: boolean; reason?: string };
}

export const PinCardsDialog = ({ cards, pinned, max, onToggle }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { toast } = useToast();

  const filtered = cards.filter((c) =>
    c.title.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleToggle = (id: string) => {
    const res = onToggle(id);
    if (!res.ok && res.reason) {
      toast({ title: "Limite atingido", description: res.reason, variant: "destructive" });
    }
  };

  const getCover = (c: CardType): string | null => {
    const anyC = c as any;
    if (anyC.cover_image) return anyC.cover_image;
    if (c.images && c.images.length) return c.images[0];
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pin className="h-4 w-4" />
          Fixar ({pinned.length}/{max})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Fixar cards no topo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 min-h-0 flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar card..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Selecione até <strong>{max}</strong> cards. Os selecionados ocupam <strong>{pinned.length}/{max}</strong> slots.
          </p>

          <div className="overflow-y-auto pr-1 flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filtered.map((card) => {
                const isPinned = pinned.includes(card.id);
                const cover = getCover(card);
                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => handleToggle(card.id)}
                    className={`group relative flex flex-col rounded-lg border-2 overflow-hidden text-left transition-all hover:shadow-md ${
                      isPinned
                        ? "border-primary bg-primary/10 shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]"
                        : "border-border hover:border-primary/40 bg-card"
                    }`}
                  >
                    <div className="relative aspect-video w-full bg-muted overflow-hidden">
                      {cover ? (
                        <img
                          src={cover}
                          alt={card.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      {isPinned && (
                        <span className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow">
                          <Check className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 space-y-1.5">
                      <p
                        className="text-sm font-semibold leading-tight line-clamp-2 break-words"
                        title={card.title}
                      >
                        {card.title}
                      </p>
                      <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                        {card.category}
                      </Badge>
                    </div>
                  </button>
                );
              })}
            </div>
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-10">Nenhum card encontrado.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
