GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_account_verified(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_user(uuid) TO authenticated;

ALTER TABLE public.cards
  ADD COLUMN IF NOT EXISTS delete_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS delete_requested_by uuid;

DROP POLICY IF EXISTS "Only admins can delete cards" ON public.cards;
CREATE POLICY "Admins delete anytime, editors after 2h grace"
ON public.cards
FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (
    public.is_account_verified(auth.uid())
    AND public.has_role(auth.uid(), 'user'::public.app_role)
    AND auth.uid() = user_id
    AND delete_requested_at IS NOT NULL
    AND delete_requested_at <= now() - interval '2 hours'
  )
);