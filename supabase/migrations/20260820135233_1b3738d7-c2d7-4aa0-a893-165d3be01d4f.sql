CREATE OR REPLACE FUNCTION public.is_account_verified(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT is_verified FROM public.profiles WHERE id = _user_id),
    false
  ) OR public.has_role(_user_id, 'admin'::public.app_role)
$function$;

UPDATE public.profiles SET is_verified = true WHERE created_at < now();