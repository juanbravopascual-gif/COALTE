CREATE OR REPLACE FUNCTION public.get_booking_availability(p_date date DEFAULT NULL::date)
 RETURNS TABLE(booking_date date, start_time time without time zone, end_time time without time zone, status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT mrb.booking_date, mrb.start_time, mrb.end_time, mrb.status
  FROM public.meeting_room_bookings mrb
  WHERE (p_date IS NULL OR mrb.booking_date = p_date)
    AND mrb.status = 'confirmed';
$function$;