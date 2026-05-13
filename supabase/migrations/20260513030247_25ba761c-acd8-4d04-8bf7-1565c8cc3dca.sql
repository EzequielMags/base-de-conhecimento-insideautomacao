-- Demands (tickets) table
CREATE TYPE public.demand_status AS ENUM ('aguardando', 'concluido');
CREATE TYPE public.demand_priority AS ENUM ('baixa', 'media', 'alta');

CREATE TABLE public.demands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT,
  priority public.demand_priority NOT NULL DEFAULT 'media',
  deadline DATE,
  status public.demand_status NOT NULL DEFAULT 'aguardando',
  assignee_id UUID,
  assignee_name TEXT,
  created_by UUID NOT NULL,
  created_by_name TEXT,
  completed_at TIMESTAMPTZ,
  completed_by UUID,
  completed_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Auth view demands" ON public.demands
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Editors and admins create demands" ON public.demands
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role));

CREATE POLICY "Editors and admins update demands" ON public.demands
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'user'::app_role));

CREATE POLICY "Only admins delete demands" ON public.demands
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_demands_updated_at
  BEFORE UPDATE ON public.demands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_demands_status ON public.demands(status);
CREATE INDEX idx_demands_deadline ON public.demands(deadline);