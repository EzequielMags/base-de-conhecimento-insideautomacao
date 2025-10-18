import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card as CardType } from "@/types/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CardDetailProps {
  card: CardType | null;
  open: boolean;
  onClose: () => void;
}

export const CardDetail = ({ card, open, onClose }: CardDetailProps) => {
  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge>{card.category}</Badge>
            <span className="text-xs text-muted-foreground">
              {format(new Date(card.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </span>
          </div>
          <DialogTitle className="text-2xl">{card.title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-10rem)]">
          <div className="space-y-4 pr-4">
            {card.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {card.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`${card.title} - Imagem ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ))}
              </div>
            )}

            <div className="prose prose-sm max-w-none dark:prose-invert">
              <h3 className="text-lg font-semibold mb-2">Solução</h3>
              <p className="whitespace-pre-wrap text-muted-foreground">
                {card.description}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};