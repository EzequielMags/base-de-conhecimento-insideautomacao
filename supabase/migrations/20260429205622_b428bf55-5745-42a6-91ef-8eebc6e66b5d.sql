CREATE TABLE public.autopen_drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version TEXT NOT NULL,
  link TEXT NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.autopen_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view autopen_drivers"
  ON public.autopen_drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Editors and admins can insert autopen_drivers"
  ON public.autopen_drivers FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role));

CREATE POLICY "Owners or admins can delete autopen_drivers"
  ON public.autopen_drivers FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR ((auth.uid() = user_id) AND has_role(auth.uid(), 'user'::app_role)));