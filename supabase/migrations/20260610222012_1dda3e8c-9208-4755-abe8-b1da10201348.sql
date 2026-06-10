
-- 1) Lock down has_role: callable only by SECURITY DEFINER context (RLS uses it as definer)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

-- 2) store_bank_files INSERT/UPDATE tighten
DROP POLICY IF EXISTS "Authenticated can insert store_bank_files" ON public.store_bank_files;
DROP POLICY IF EXISTS "Authenticated can update store_bank_files" ON public.store_bank_files;

CREATE POLICY "Editors and admins can insert store_bank_files"
  ON public.store_bank_files
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'user'::public.app_role)
  );

CREATE POLICY "Owners or admins can update store_bank_files"
  ON public.store_bank_files
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (auth.uid() = user_id)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (auth.uid() = user_id)
  );

-- 3) technical_pdfs INSERT tighten
DROP POLICY IF EXISTS "Authenticated can insert technical_pdfs" ON public.technical_pdfs;

CREATE POLICY "Editors and admins can insert technical_pdfs"
  ON public.technical_pdfs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'user'::public.app_role)
  );

-- 4) Storage: store-bank delete restricted to owner-folder or admin
DROP POLICY IF EXISTS "Authenticated can delete store bank" ON storage.objects;

CREATE POLICY "Owners or admins can delete store bank"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-bank'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

-- 5) Storage: technical-pdfs delete restricted to owner-folder or admin
DROP POLICY IF EXISTS "Authenticated can delete technical pdfs" ON storage.objects;

CREATE POLICY "Owners or admins can delete technical pdfs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'technical-pdfs'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR (auth.uid())::text = (storage.foldername(name))[1]
    )
  );

-- 6) Realtime: restrict cards channel subscription to authenticated users
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can subscribe to cards channel" ON realtime.messages;

CREATE POLICY "Authenticated can subscribe to cards channel"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (realtime.topic() = 'cards')
    AND (auth.uid() IS NOT NULL)
  );
