
-- 1. Create a security definer function for availability checks (only returns date/time)
CREATE OR REPLACE FUNCTION public.get_booking_availability(p_date date DEFAULT NULL)
RETURNS TABLE(booking_date date, start_time time, end_time time, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT mrb.booking_date, mrb.start_time, mrb.end_time, mrb.status
  FROM public.meeting_room_bookings mrb
  WHERE (p_date IS NULL OR mrb.booking_date = p_date)
    AND mrb.status IN ('confirmed', 'pending');
$$;

-- 2. Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view bookings for availability" ON public.meeting_room_bookings;

-- 3. Add policy: authenticated users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.meeting_room_bookings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Add policy: admins can view all bookings
CREATE POLICY "Admins can manage all bookings"
ON public.meeting_room_bookings
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
