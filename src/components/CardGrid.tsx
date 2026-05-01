import { Card as CardType } from "@/types/card";
import { SolutionCard } from "./SolutionCard";

interface CardGridProps {
  cards: CardType[];
  onEdit: (card: CardType) => void;
  onDelete: (id: string) => void;
  onView: (card: CardType) => void;
  currentUserId?: string;
  isAdmin?: boolean;
  isVisitor?: boolean;
  compact?: boolean;
}

export const CardGrid = ({ cards, onEdit, onDelete, onView, currentUserId, isAdmin, isVisitor, compact }: CardGridProps) => {
  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Nenhum card encontrado.
        </p>
      </div>
    );
  }

  const gridCols = compact
    ? "grid grid-cols-1 md:grid-cols-2 gap-6"
    : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";

  return (
    <div className={gridCols}>
      {cards.map((card) => {
        const canEdit = isAdmin || (!isVisitor && card.user_id === currentUserId);
        const canDelete = !!isAdmin;
        return (
          <SolutionCard
            key={card.id}
            card={card}
            onEdit={onEdit}
            onDelete={onDelete}
            onView={onView}
            canEdit={canEdit}
            canDelete={canDelete}
          />
        );
      })}
    </div>
  );
};
