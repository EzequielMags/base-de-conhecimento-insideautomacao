import { Badge } from "@/components/ui/badge";

const categories = [
  "Todas",
  "Impressora",
  "XD Orders",
  "Sat",
  "NFCE",
  "Dados Fiscais",
  "Sistema",
  "Tablet",
  "Extras"
] as const;

export type Category = typeof categories[number];

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <Badge
          key={category}
          variant={selected === category ? "default" : "outline"}
          className="cursor-pointer px-4 py-2 transition-all hover:scale-105"
          onClick={() => onSelect(category)}
        >
          {category}
        </Badge>
      ))}
    </div>
  );
};