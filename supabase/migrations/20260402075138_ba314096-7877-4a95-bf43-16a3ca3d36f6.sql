CREATE POLICY "Users can cancel their own bookings"
ON public.meeting_room_bookings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);