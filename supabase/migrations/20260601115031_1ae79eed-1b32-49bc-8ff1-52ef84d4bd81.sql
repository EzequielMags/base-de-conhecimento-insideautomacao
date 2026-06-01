
-- Add attachment columns to demands
ALTER TABLE public.demands
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audio_url text;

-- Storage bucket for demand media (images, videos, audio)
INSERT INTO storage.buckets (id, name, public)
VALUES ('demand-media', 'demand-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public read demand-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'demand-media');

CREATE POLICY "Editors and admins upload demand-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'demand-media'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'user'::app_role))
);

CREATE POLICY "Editors and admins update demand-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'demand-media'
  AND (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'user'::app_role))
);

CREATE POLICY "Admins delete demand-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'demand-media'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
