ALTER TABLE public.store_bank_files 
ADD COLUMN file_category text NOT NULL DEFAULT 'cardapio' 
CHECK (file_category IN ('cardapio', 'banco'));