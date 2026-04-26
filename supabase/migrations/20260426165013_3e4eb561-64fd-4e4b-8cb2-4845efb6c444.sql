
-- 1) Adicionar coluna email em profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 2) Backfill email a partir de auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3) Atualizar trigger handle_new_user_profile para incluir email
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$function$;

-- 4) Atualizar trigger handle_new_user_role para conceder admin a emails específicos
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  assigned_role public.app_role;
BEGIN
  IF lower(NEW.email) IN ('henrique@insideautomacao.com.br', 'ezequielmagoga07@gmail.com') THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, assigned_role)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 5) Garantir que os triggers existem em auth.users
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

DROP TRIGGER IF EXISTS on_auth_user_created_role ON auth.users;
CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 6) Garantir admin para os emails alvo, caso já existam
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::public.app_role
FROM auth.users u
WHERE lower(u.email) IN ('henrique@insideautomacao.com.br', 'ezequielmagoga07@gmail.com')
ON CONFLICT DO NOTHING;

-- Remover roles não-admin dos admins designados (mantém só admin)
DELETE FROM public.user_roles ur
USING auth.users u
WHERE ur.user_id = u.id
  AND lower(u.email) IN ('henrique@insideautomacao.com.br', 'ezequielmagoga07@gmail.com')
  AND ur.role <> 'admin';

-- 7) Atualizar policies de profiles para admin gerenciar tudo
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 8) Atualizar policies de cards para refletir RBAC
DROP POLICY IF EXISTS "Anyone authenticated can update any card" ON public.cards;
DROP POLICY IF EXISTS "Anyone authenticated can delete any card" ON public.cards;
DROP POLICY IF EXISTS "Anyone authenticated can create cards" ON public.cards;

-- Admins ou editores (user) podem criar
CREATE POLICY "Editors and admins can create cards"
ON public.cards FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'user')
);

-- Editores editam só os próprios; admin edita qualquer
CREATE POLICY "Owners or admins can update cards"
ON public.cards FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = user_id AND public.has_role(auth.uid(), 'user'))
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = user_id AND public.has_role(auth.uid(), 'user'))
);

-- Apenas admin pode deletar
CREATE POLICY "Only admins can delete cards"
ON public.cards FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
