
-- RLS policies for user-folder bucket: each user owns the folder named with their uid
CREATE POLICY "user-folder: users read own"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'user-folder' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user-folder: users insert own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-folder' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user-folder: users update own"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'user-folder' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "user-folder: users delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'user-folder' AND (storage.foldername(name))[1] = auth.uid()::text);
