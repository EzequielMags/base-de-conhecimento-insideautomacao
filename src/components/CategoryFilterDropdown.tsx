import { Filter, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Category } from "./CategoryFilter";
import { Badge } from "@/components/ui/badge";

const categories: Category[] = [
  "Todas",
  "Impressora",
  "XD Orders",
  "Sat",
  "NFCE",
  "Dados Fiscais",
  "Sistema",
  "Tablet",
  "Extras",
];

interface CategoryFilterDropdownProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export const CategoryFilterDropdown = ({ selected, onSelect }: CategoryFilterDropdownProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Filtros</span>
          {selected !== "Todas" && (
            <Badge variant="secondary" className="ml-1">{selected}</Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover z-50">
        <DropdownMenuLabel>Filtrar por categoria</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {categories.map((category) => (
          <DropdownMenuItem
            key={category}
            onClick={() => onSelect(category)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{category}</span>
            {selected === category && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
