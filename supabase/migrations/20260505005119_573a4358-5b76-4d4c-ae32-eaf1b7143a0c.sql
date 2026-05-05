
-- Multi-preview columns
ALTER TABLE public.repository_files
  ADD COLUMN IF NOT EXISTS preview_urls text[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preview_paths text[] DEFAULT '{}'::text[];

-- Restrict deletes to admins only
DROP POLICY IF EXISTS "Owners or admins can delete repository_files" ON public.repository_files;
CREATE POLICY "Only admins can delete repository_files"
ON public.repository_files FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners or admins can delete printer_files" ON public.printer_files;
CREATE POLICY "Only admins can delete printer_files"
ON public.printer_files FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Owners or admins can delete autopen_drivers" ON public.autopen_drivers;
CREATE POLICY "Only admins can delete autopen_drivers"
ON public.autopen_drivers FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can delete technical_pdfs" ON public.technical_pdfs;
CREATE POLICY "Only admins can delete technical_pdfs"
ON public.technical_pdfs FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated can delete store_bank_files" ON public.store_bank_files;
CREATE POLICY "Only admins can delete store_bank_files"
ON public.store_bank_files FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
