-- Storage buckets para os novos repositórios
INSERT INTO storage.buckets (id, name, public) VALUES ('scripts-files', 'scripts-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('skins-files', 'skins-files', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('doclayouts-files', 'doclayouts-files', true) ON CONFLICT (id) DO NOTHING;

-- Storage policies (públicas para visualização, autenticados podem upload/delete)
CREATE POLICY "Public read scripts-files" ON storage.objects FOR SELECT USING (bucket_id = 'scripts-files');
CREATE POLICY "Auth upload scripts-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'scripts-files');
CREATE POLICY "Auth delete scripts-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'scripts-files');

CREATE POLICY "Public read skins-files" ON storage.objects FOR SELECT USING (bucket_id = 'skins-files');
CREATE POLICY "Auth upload skins-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'skins-files');
CREATE POLICY "Auth delete skins-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'skins-files');

CREATE POLICY "Public read doclayouts-files" ON storage.objects FOR SELECT USING (bucket_id = 'doclayouts-files');
CREATE POLICY "Auth upload doclayouts-files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'doclayouts-files');
CREATE POLICY "Auth delete doclayouts-files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'doclayouts-files');

-- Tabela genérica para os 3 repositórios
CREATE TABLE public.repository_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  repository TEXT NOT NULL CHECK (repository IN ('scripts','skins','doclayouts')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.repository_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view repository_files" ON public.repository_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Editors and admins can insert repository_files" ON public.repository_files FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role));
CREATE POLICY "Owners or admins can delete repository_files" ON public.repository_files FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = user_id AND has_role(auth.uid(), 'user'::app_role)));

CREATE INDEX idx_repository_files_repo ON public.repository_files(repository);