-- Add videos column to cards table
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]'::jsonb;