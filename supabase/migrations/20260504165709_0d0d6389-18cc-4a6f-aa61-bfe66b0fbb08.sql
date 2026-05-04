
ALTER TABLE public.repository_files
  ADD COLUMN IF NOT EXISTS observation text,
  ADD COLUMN IF NOT EXISTS preview_url text,
  ADD COLUMN IF NOT EXISTS preview_path text;

-- Allow updates to repository_files (currently no UPDATE policy)
CREATE POLICY "Owners or admins can update repository_files"
ON public.repository_files
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR ((auth.uid() = user_id) AND has_role(auth.uid(), 'user'::app_role))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  OR ((auth.uid() = user_id) AND has_role(auth.uid(), 'user'::app_role))
);

-- Storage bucket for doclayouts preview images
INSERT INTO storage.buckets (id, name, public)
VALUES ('doclayouts-previews', 'doclayouts-previews', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Doclayouts previews are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'doclayouts-previews');

CREATE POLICY "Editors and admins can upload doclayouts previews"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'doclayouts-previews'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role))
);

CREATE POLICY "Editors and admins can update doclayouts previews"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'doclayouts-previews'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role))
);

CREATE POLICY "Editors and admins can delete doclayouts previews"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'doclayouts-previews'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role))
);
