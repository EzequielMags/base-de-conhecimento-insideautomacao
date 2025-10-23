-- Remove all restrictive policies on cards table
DROP POLICY IF EXISTS "Authenticated users can view all cards" ON public.cards;
DROP POLICY IF EXISTS "Authenticated users can create cards" ON public.cards;
DROP POLICY IF EXISTS "Users can update their own cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete their own cards" ON public.cards;

-- Create open policies for all authenticated users
CREATE POLICY "Anyone authenticated can view cards"
ON public.cards
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone authenticated can create cards"
ON public.cards
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone authenticated can update any card"
ON public.cards
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone authenticated can delete any card"
ON public.cards
FOR DELETE
TO authenticated
USING (true);