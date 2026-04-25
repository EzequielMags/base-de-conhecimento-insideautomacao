
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('technical-pdfs', 'technical-pdfs', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES ('store-bank', 'store-bank', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for technical-pdfs (PDFs Técnicos)
CREATE POLICY "Authenticated can view technical pdfs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'technical-pdfs');

CREATE POLICY "Authenticated can upload technical pdfs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'technical-pdfs');

CREATE POLICY "Authenticated can delete technical pdfs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'technical-pdfs');

-- Storage policies for store-bank (Banco de Lojas)
CREATE POLICY "Authenticated can view store bank"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'store-bank');

CREATE POLICY "Authenticated can upload store bank"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'store-bank');

CREATE POLICY "Authenticated can delete store bank"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'store-bank');

-- Table for technical PDFs metadata
CREATE TABLE public.technical_pdfs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.technical_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view technical_pdfs"
ON public.technical_pdfs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert technical_pdfs"
ON public.technical_pdfs FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete technical_pdfs"
ON public.technical_pdfs FOR DELETE TO authenticated USING (true);

-- Table for Banco de Lojas
CREATE TABLE public.store_bank_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  custom_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  thumbnail_url TEXT,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.store_bank_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view store_bank_files"
ON public.store_bank_files FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert store_bank_files"
ON public.store_bank_files FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can delete store_bank_files"
ON public.store_bank_files FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated can update store_bank_files"
ON public.store_bank_files FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
