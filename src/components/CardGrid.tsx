import { Card as CardType } from "@/types/card";
import { SolutionCard } from "./SolutionCard";

interface CardGridProps {
  cards: CardType[];
  onEdit: (card: CardType) => void;
  onDelete: (id: string) => void;
  onView: (card: CardType) => void;
}

export const CardGrid = ({ cards, onEdit, onDelete, onView }: CardGridProps) => {
  if (cards.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-lg text-muted-foreground">
          Nenhum card encontrado. Crie o primeiro!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card) => (
        <SolutionCard
          key={card.id}
          card={card}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      ))}
    </div>
  );
};