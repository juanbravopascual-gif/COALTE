import { useEffect, useState } from 'react';
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
import { Calendar as CalIcon, Clock, Key } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const timeSlots = Array.from({ length: 13 }, (_, i) => {
  const hour = i + 8;
  return `${hour.toString().padStart(2, '0')}:00`;
});

export default function DashboardSalaReuniones() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [monthBookingsCount, setMonthBookingsCount] = useState(0);
  const [freeHours, setFreeHours] = useState(2);

  useEffect(() => {
    if (!user) return;
    fetchBookings();
    fetchService();
  }, [user]);

  const fetchBookings = async () => {
    const { data } = await supabase
      .from('meeting_room_bookings')
      .select('*')
      .eq('user_id', user!.id)
      .order('booking_date', { ascending: false });
    setBookings(data || []);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    const thisMonth = (data || []).filter(b => b.booking_date >= monthStart && b.booking_date <= monthEnd);
    setMonthBookingsCount(thisMonth.length);
  };

  const fetchService = async () => {
    const { data } = await supabase
      .from('client_services')
      .select('free_meeting_hours')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .maybeSingle();
    if (data) setFreeHours(data.free_meeting_hours);
  };

  const handleBook = async () => {
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
    const bookingDate = format(selectedDate, 'yyyy-MM-dd');
    const hours = endHour - startHour;
    const totalPrice = monthBookingsCount >= freeHours ? hours * 10 : 0;

    // Generate access code
    const accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase.from('meeting_room_bookings').insert({
      user_id: user!.id,
      booking_date: bookingDate,
      start_time: startTime,
      end_time: endTime,
      hours,
      total_price: totalPrice,
      booking_type: 'client',
      client_name: user!.user_metadata?.full_name || user!.email || '',
      client_email: user!.email || '',
      client_phone: '',
      payment_method: totalPrice > 0 ? 'transfer' : 'gratuita',
      status: 'confirmed',
      access_code: accessCode,
      notes,
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Error al reservar', description: error.message, variant: 'destructive' });
    } else {
      // Create access code record
      const validFrom = new Date(`${bookingDate}T${startTime}:00`);
      const validUntil = new Date(`${bookingDate}T${endTime}:00`);
      await supabase.from('access_codes').insert({
        user_id: user!.id,
        code: accessCode,
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      });

      toast({ title: '¡Reserva confirmada!', description: `Código de acceso: ${accessCode}` });
      setSelectedDate(undefined);
      setStartTime('');
      setEndTime('');
      setNotes('');
      fetchBookings();
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Sala de Reuniones</h1>
          <p className="text-muted-foreground mt-1">Reserva y gestiona tus reuniones</p>
        </div>

        {/* Counter */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalIcon className="h-5 w-5 text-accent" />
                <span className="font-medium">Reservas totales este mes:</span>
              </div>
              <span className="text-lg font-bold text-accent">
                {monthBookingsCount}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card>
          <CardHeader>
            <CardTitle>Nueva reserva</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <Label className="mb-2 block">Selecciona fecha</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  disabled={(date) => date < new Date() || date.getDay() === 0}
                  className="rounded-lg border"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Hora de inicio</Label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora de fin</Label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {timeSlots.filter(t => t > startTime).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notas (opcional)</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalles de la reunión" className="mt-1" />
                </div>
                <Button onClick={handleBook} disabled={loading} className="w-full" size="lg">
                  {loading ? 'Reservando...' : 'Confirmar reserva'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de reservas</CardTitle>
          </CardHeader>
          <CardContent>
            {bookings.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tienes reservas todavía</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b) => (
                  <div key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-secondary rounded-lg gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{new Date(b.booking_date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <p className="text-sm text-muted-foreground">{b.start_time} - {b.end_time} · {b.hours}h</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {b.access_code && (
                        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-1.5">
                          <Key className="h-4 w-4 text-accent" />
                          <span className="font-mono font-bold text-sm">{b.access_code}</span>
                        </div>
                      )}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.total_price === 0 ? 'bg-accent/10 text-accent' : 'bg-primary/10 text-primary'
                      }`}>
                        {b.total_price === 0 ? 'Gratuita' : `${b.total_price}€`}
                      </span>
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
