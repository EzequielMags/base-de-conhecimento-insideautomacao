-- Create storage bucket for printer files
INSERT INTO storage.buckets (id, name, public) VALUES ('printer-files', 'printer-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create printer_files table
CREATE TABLE public.printer_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL CHECK (brand IN ('EPSON','TANCA','BEMATECH','ELGIN','POS','TOMATE','CONTROL ID')),
  type TEXT NOT NULL CHECK (type IN ('DRIVER','UTILITARIO')),
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.printer_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view printer_files" ON public.printer_files
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors and admins can insert printer_files" ON public.printer_files
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role));

CREATE POLICY "Owners or admins can delete printer_files" ON public.printer_files
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = user_id) AND has_role(auth.uid(), 'user'::app_role)));

-- Storage policies for printer-files bucket
CREATE POLICY "Public can view printer files" ON storage.objects
  FOR SELECT USING (bucket_id = 'printer-files');

CREATE POLICY "Editors and admins can upload printer files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'printer-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role)));

CREATE POLICY "Editors and admins can delete printer files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'printer-files' AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role)));
