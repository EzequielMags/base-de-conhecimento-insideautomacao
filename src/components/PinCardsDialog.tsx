import { useState } from "react";
import { Pin, PinOff, Search } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Pin className="h-4 w-4" />
          Fixar ({pinned.length}/{max})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Fixar cards no topo</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
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
            Selecione até <strong>{max}</strong> cards. Eles aparecerão destacados no topo da lista.
          </p>

          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
            {filtered.map((card) => {
              const isPinned = pinned.includes(card.id);
              return (
                <button
                  type="button"
                  key={card.id}
                  onClick={() => handleToggle(card.id)}
                  className={`w-full flex items-center justify-between gap-3 p-3 rounded-lg border text-left transition-all ${
                    isPinned
                      ? "border-blue-500 bg-blue-500/10"
                      : "hover:bg-accent border-border"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{card.title}</p>
                    <Badge variant="secondary" className="mt-1 text-xs">{card.category}</Badge>
                  </div>
                  {isPinned ? (
                    <PinOff className="h-4 w-4 text-blue-500 shrink-0" />
                  ) : (
                    <Pin className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-6">Nenhum card encontrado.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
