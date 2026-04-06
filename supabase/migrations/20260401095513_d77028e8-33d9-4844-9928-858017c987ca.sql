
-- Allow authenticated users to insert their own access codes
CREATE POLICY "Users can create their own access codes"
ON public.access_codes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
