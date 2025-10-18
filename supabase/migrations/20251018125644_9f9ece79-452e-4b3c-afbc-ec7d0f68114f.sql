-- Create storage bucket for card files
INSERT INTO storage.buckets (id, name, public)
VALUES ('card-files', 'card-files', true);

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'card-files');

-- Anyone can view files
CREATE POLICY "Anyone can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'card-files');

-- Users can delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'card-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update cards table to store file metadata
ALTER TABLE public.cards 
ADD COLUMN IF NOT EXISTS files jsonb DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.cards.files IS 'Array of file objects with name, url, type, size';