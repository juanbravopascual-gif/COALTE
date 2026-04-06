import { useEffect, useState, useCallback } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalIcon, Clock, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function DashboardSalaReuniones() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingBookings, setFetchingBookings] = useState(true);
  const [monthBookingsCount, setMonthBookingsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [allBookingDates, setAllBookingDates] = useState<Date[]>([]);

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) return;
    setCancellingId(bookingId);
    try {
      const { error: cancelError } = await supabase
        .from('meeting_room_bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user!.id);

      if (cancelError) {
        toast({ title: 'Error al cancelar', description: cancelError.message, variant: 'destructive' });
      } else {
        toast({ title: 'Reserva cancelada', description: 'La reserva ha sido cancelada correctamente.' });
        await fetchBookings();
      }
    } catch {
      toast({ title: 'Error inesperado', variant: 'destructive' });
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => {
    if (!user || !session) return;
    fetchBookings();
    fetchAllBookingDates();
  }, [user, session]);

  const fetchAllBookingDates = async () => {
    const { data } = await supabase
      .from('meeting_room_bookings')
      .select('booking_date')
      .eq('status', 'confirmed');
    if (data) {
      const uniqueDates = [...new Set(data.map(b => b.booking_date))];
      setAllBookingDates(uniqueDates.map(d => new Date(d + 'T00:00:00')));
    }
  };

  const fetchBookings = useCallback(async () => {
    if (!user) return;
    setFetchingBookings(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('meeting_room_bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });

      if (fetchError) {
        setError('No se pudieron cargar las reservas');
        return;
      }

      setBookings(data || []);
      setError(null);

      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      const thisMonth = (data || []).filter(b => b.booking_date >= monthStart && b.booking_date <= monthEnd && b.status !== 'cancelled');
      setMonthBookingsCount(thisMonth.length);
    } catch {
      setError('Error inesperado al cargar reservas');
    } finally {
      setFetchingBookings(false);
    }
  }, [user]);

  const checkAvailability = async (bookingDate: string, start: string, end: string): Promise<boolean> => {
    try {
      const { data } = await supabase.rpc('get_booking_availability', { p_date: bookingDate });
      if (!data) return true;
      const startHour = parseInt(start.split(':')[0]);
      const endHour = parseInt(end.split(':')[0]);
      for (const booking of data) {
        const bStart = parseInt(String(booking.start_time).split(':')[0]);
        const bEnd = parseInt(String(booking.end_time).split(':')[0]);
        if (startHour < bEnd && endHour > bStart) return false;
      }
      return true;
    } catch {
      return true;
    }
  };

  const handleBook = async () => {
    if (!user || !session) {
      toast({ title: 'Sesión expirada', description: 'Vuelve a iniciar sesión', variant: 'destructive' });
      return;
    }
    if (!selectedDate || !startTime || !endTime) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' });
      return;
    }
    const startHour = parseInt(startTime.split(':')[0]);
    const endHour = parseInt(endTime.split(':')[0]);
    if (endHour <= startHour) {
      toast({ title: 'La hora de fin debe ser posterior a la de inicio', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const bookingDate = format(selectedDate, 'yyyy-MM-dd');
      const available = await checkAvailability(bookingDate, startTime, endTime);
      if (!available) {
        toast({ title: 'Horario no disponible', description: 'Ya existe una reserva en ese horario.', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const hours = endHour - startHour;
      const { error: bookingError } = await supabase
        .from('meeting_room_bookings')
        .insert({
          user_id: user.id,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime,
          hours,
          total_price: 0,
          booking_type: 'hourly',
          client_name: user.user_metadata?.full_name || user.email || '',
          client_email: user.email || '',
          client_phone: '',
          payment_method: 'pending',
          status: 'confirmed',
          notes: notes.trim().substring(0, 500) || null,
        });

      if (bookingError) {
        if (bookingError.message?.includes('row-level security')) {
          toast({ title: 'Error de permisos', description: 'Contacta al administrador.', variant: 'destructive' });
        } else {
          toast({ title: 'Error al reservar', description: bookingError.message, variant: 'destructive' });
        }
        return;
      }

      toast({ title: '¡Reserva confirmada!', description: 'Tu reserva gratuita ha sido registrada.' });
      setSelectedDate(undefined);
      setStartTime('');
      setEndTime('');
      setNotes('');
      await fetchBookings();
      await fetchAllBookingDates();
    } catch {
      toast({ title: 'Error inesperado', description: 'Inténtalo de nuevo más tarde', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 px-1 sm:px-0">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold">Sala de Reuniones</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Reserva gratuita para clientes del coworking</p>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalIcon className="h-5 w-5 text-accent" />
                <span className="font-medium">Reservas este mes:</span>
              </div>
              <span className="text-lg font-bold text-accent">{fetchingBookings ? '...' : monthBookingsCount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Hacer buen uso de la sala, cuidar el material.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nueva reserva (gratuita)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <Label className="mb-2 block font-semibold text-sm sm:text-base">Selecciona fecha</Label>
                <div className="flex justify-center overflow-x-auto">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    modifiers={{ booked: allBookingDates }}
                    modifiersClassNames={{ booked: 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 text-yellow-800 dark:text-yellow-300' }}
                    className="rounded-lg border w-full max-w-[350px]"
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Hora de inicio</Label>
                  <Select value={startTime} onValueChange={(v) => { setStartTime(v); setEndTime(''); }}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora de fin</Label>
                  <Select value={endTime} onValueChange={setEndTime} disabled={!startTime}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter(t => t > startTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value.substring(0, 500))} placeholder="Detalles de la reunión" className="mt-1" maxLength={500} />
                  <p className="text-xs text-muted-foreground mt-1">{notes.length}/500</p>
                </div>
                <Button onClick={handleBook} disabled={loading || !selectedDate || !startTime || !endTime} className="w-full min-h-[48px] text-base" size="lg">
                  {loading ? 'Reservando...' : 'Confirmar reserva gratuita'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historial de reservas</CardTitle></CardHeader>
          <CardContent>
            {fetchingBookings ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
            ) : bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tienes reservas todavía</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className={`flex flex-col gap-3 p-3 sm:p-4 rounded-lg ${b.status === 'cancelled' ? 'bg-muted opacity-60' : 'bg-secondary'}`}>
                    <div className="flex items-start sm:items-center gap-3 sm:gap-4">
                      <div className="shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm sm:text-base truncate">{new Date(b.booking_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className="text-xs sm:text-sm text-muted-foreground">{b.start_time} - {b.end_time} · {b.hours}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {b.status === 'cancelled' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">Cancelada</span>
                      ) : (
                        <>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">Gratuita</span>
                          {new Date(b.booking_date + 'T' + b.start_time) > new Date() && (
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleCancelBooking(b.id)} disabled={cancellingId === b.id}>
                              <XCircle className="h-4 w-4 mr-1" />
                              {cancellingId === b.id ? 'Cancelando...' : 'Cancelar'}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
