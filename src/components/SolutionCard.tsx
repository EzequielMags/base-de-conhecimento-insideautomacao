import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import { Card as CardType } from "@/types/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SolutionCardProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (id: string) => void;
  onView: (card: CardType) => void;
}

export const SolutionCard = ({ card, onEdit, onDelete, onView }: SolutionCardProps) => {
  const firstImage = card.files?.find(f => f.type.startsWith('image/'));
  
  return (
    <Card className="card-hover gradient-card overflow-hidden group cursor-pointer animate-scale-in" onClick={() => onView(card)}>
      {firstImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={firstImage.url}
            alt={card.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      )}
      
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="mb-2">
            {card.category}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2">{card.title}</CardTitle>
        <CardDescription className="line-clamp-3">
          {card.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <p className="text-xs text-muted-foreground">
          Criado em {format(new Date(card.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </CardContent>
      
      <CardFooter className="gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onView(card);
          }}
          className="flex-1 gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};