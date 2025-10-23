-- Remove policies that require roles and create simpler ones
DROP POLICY IF EXISTS "Admin and User can create cards" ON public.cards;
DROP POLICY IF EXISTS "Authenticated users can view cards" ON public.cards;
DROP POLICY IF EXISTS "Users can delete own cards, Admins can delete all" ON public.cards;
DROP POLICY IF EXISTS "Users can update own cards, Admins can update all" ON public.cards;

-- Create simple policies without role checks
CREATE POLICY "Authenticated users can view all cards"
ON public.cards
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create cards"
ON public.cards
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
ON public.cards
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
ON public.cards
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);