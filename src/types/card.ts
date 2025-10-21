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

export interface CardVideo {
  type: 'upload' | 'embed';
  url: string;
  name?: string;
  thumbnail?: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  category: CardCategory;
  images: string[];
  files: CardFile[];
  videos: CardVideo[];
  created_at: string;
  updated_at: string;
  user_id: string;
}