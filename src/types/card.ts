export type CardCategory = 
  | "Impressora" 
  | "XD Orders" 
  | "Sat" 
  | "NFCE" 
  | "Dados Fiscais" 
  | "Sistema";

export interface Card {
  id: string;
  title: string;
  description: string;
  category: CardCategory;
  images: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}