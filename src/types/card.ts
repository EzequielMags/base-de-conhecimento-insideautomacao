export type CardCategory = 
  | "Impressora" 
  | "XD Orders" 
  | "Sat" 
  | "NFCE" 
  | "Dados Fiscais" 
  | "Sistema"
  | "Tablet"
  | "Extras";

export interface CardFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  category: CardCategory;
  images: string[];
  files: CardFile[];
  created_at: string;
  updated_at: string;
  user_id: string;
}