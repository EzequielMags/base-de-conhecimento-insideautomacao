import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, Play } from "lucide-react";
import { Card as CardType } from "@/types/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";

interface SolutionCardProps {
  card: CardType;
  onEdit: (card: CardType) => void;
  onDelete: (id: string) => void;
  onView: (card: CardType) => void;
  canEdit: boolean;
  canDelete: boolean;
}

export const SolutionCard = ({ card, onEdit, onDelete, onView, canEdit, canDelete }: SolutionCardProps) => {
  const firstImage = card.files?.find(f => f.type.startsWith('image/'));
  const firstVideo = card.videos?.[0];
  
  return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={{ y: -4 }}
      >
        <Card className="card-hover gradient-card overflow-hidden group">
          {firstVideo && (
            <div 
              className="relative h-48 overflow-hidden bg-black cursor-pointer"
              onClick={() => onView(card)}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Play className="h-12 w-12 text-white/80 group-hover:text-white transition-colors" />
              </div>
              {firstVideo.thumbnail && (
                <img
                  src={firstVideo.thumbnail}
                  alt={card.title}
                  className="w-full h-full object-cover opacity-50"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
          
          {!firstVideo && firstImage && (
            <div 
              className="relative h-48 overflow-hidden cursor-pointer"
              onClick={() => onView(card)}
            >
              <motion.img
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
                src={firstImage.url}
                alt={card.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
      
      <CardHeader className="space-y-2 cursor-pointer" onClick={() => onView(card)}>
        <div className="flex items-start justify-between gap-2">
          <Badge variant="secondary" className="mb-2">
            {card.category}
          </Badge>
        </div>
        <CardTitle className="line-clamp-2 break-words">{card.title}</CardTitle>
        <CardDescription className="line-clamp-3 break-words">
          {card.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="cursor-pointer" onClick={() => onView(card)}>
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
        {canEdit && (
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
        )}
        {canDelete && (
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
        )}
      </CardFooter>
        </Card>
      </motion.div>
  );
};