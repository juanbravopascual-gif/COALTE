-- Crear tabla para reservas de sala de reuniones
CREATE TABLE public.meeting_room_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_company TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  booking_type TEXT NOT NULL CHECK (booking_type IN ('hourly', 'daily')),
  hours INTEGER,
  total_price DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('transfer', 'pending')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.meeting_room_bookings ENABLE ROW LEVEL SECURITY;

-- Política para permitir inserción pública (reservas sin autenticación)
CREATE POLICY "Anyone can create bookings"
ON public.meeting_room_bookings
FOR INSERT
WITH CHECK (true);

-- Política para ver reservas (solo lectura pública para comprobar disponibilidad)
CREATE POLICY "Anyone can view bookings for availability"
ON public.meeting_room_bookings
FOR SELECT
USING (true);

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_booking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para actualizar timestamps
CREATE TRIGGER update_meeting_room_bookings_updated_at
BEFORE UPDATE ON public.meeting_room_bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_booking_updated_at();