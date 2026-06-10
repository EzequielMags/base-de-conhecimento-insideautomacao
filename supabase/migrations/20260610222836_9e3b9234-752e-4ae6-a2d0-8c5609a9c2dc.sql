
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_verified = true
WHERE lower(email) IN ('henrique@insideautomacao.com.br', 'ezequielmagoga07@gmail.com');

CREATE OR REPLACE FUNCTION public.is_account_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_verified FROM public.profiles WHERE id = _user_id), false)
$$;

REVOKE EXECUTE ON FUNCTION public.is_account_verified(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_account_verified(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_account_verified(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.is_account_verified(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.admin_verify_user(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;
  UPDATE public.profiles SET is_verified = true WHERE id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_verify_user(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, is_verified)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    lower(NEW.email) IN ('henrique@insideautomacao.com.br', 'ezequielmagoga07@gmail.com')
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.admin_list_users();

CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE(id uuid, email text, name text, role app_role, avatar_url text, is_verified boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text AS email,
    COALESCE(p.name, split_part(u.email::text, '@', 1)) AS name,
    COALESCE(public.get_user_role(u.id), 'read'::public.app_role) AS role,
    p.avatar_url,
    COALESCE(p.is_verified, false) AS is_verified
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.email;
END;
$$;

-- Content write policies require verified accounts
DROP POLICY IF EXISTS "Editors and admins can create cards" ON public.cards;
CREATE POLICY "Verified editors and admins can create cards"
  ON public.cards FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Owners or admins can update cards" ON public.cards;
CREATE POLICY "Verified owners or admins can update cards"
  ON public.cards FOR UPDATE TO authenticated
  USING (
    public.is_account_verified(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR ((auth.uid() = user_id) AND public.has_role(auth.uid(), 'user'::public.app_role))
    )
  )
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR ((auth.uid() = user_id) AND public.has_role(auth.uid(), 'user'::public.app_role))
    )
  );

DROP POLICY IF EXISTS "Editors and admins can insert repository_files" ON public.repository_files;
CREATE POLICY "Verified editors and admins can insert repository_files"
  ON public.repository_files FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Owners or admins can update repository_files" ON public.repository_files;
CREATE POLICY "Verified owners or admins can update repository_files"
  ON public.repository_files FOR UPDATE TO authenticated
  USING (
    public.is_account_verified(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR ((auth.uid() = user_id) AND public.has_role(auth.uid(), 'user'::public.app_role))
    )
  )
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR ((auth.uid() = user_id) AND public.has_role(auth.uid(), 'user'::public.app_role))
    )
  );

DROP POLICY IF EXISTS "Editors and admins create demands" ON public.demands;
CREATE POLICY "Verified editors and admins create demands"
  ON public.demands FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Editors and admins update demands" ON public.demands;
CREATE POLICY "Verified editors and admins update demands"
  ON public.demands FOR UPDATE TO authenticated
  USING (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  )
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Editors and admins can insert printer_files" ON public.printer_files;
CREATE POLICY "Verified editors and admins can insert printer_files"
  ON public.printer_files FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Editors and admins can insert autopen_drivers" ON public.autopen_drivers;
CREATE POLICY "Verified editors and admins can insert autopen_drivers"
  ON public.autopen_drivers FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Editors and admins can insert store_bank_files" ON public.store_bank_files;
CREATE POLICY "Verified editors and admins can insert store_bank_files"
  ON public.store_bank_files FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );

DROP POLICY IF EXISTS "Owners or admins can update store_bank_files" ON public.store_bank_files;
CREATE POLICY "Verified owners or admins can update store_bank_files"
  ON public.store_bank_files FOR UPDATE TO authenticated
  USING (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() = user_id))
  )
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR (auth.uid() = user_id))
  );

DROP POLICY IF EXISTS "Editors and admins can insert technical_pdfs" ON public.technical_pdfs;
CREATE POLICY "Verified editors and admins can insert technical_pdfs"
  ON public.technical_pdfs FOR INSERT TO authenticated
  WITH CHECK (
    public.is_account_verified(auth.uid())
    AND (public.has_role(auth.uid(), 'admin'::public.app_role) OR public.has_role(auth.uid(), 'user'::public.app_role))
  );
