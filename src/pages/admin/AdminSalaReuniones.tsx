import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User, CheckCircle, XCircle, Plus, AlertTriangle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

export default function AdminSalaReuniones() {
  const { toast } = useToast();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newBooking, setNewBooking] = useState({
    client_name: '', client_email: '', client_phone: '', booking_date: '',
    start_time: '', end_time: '', notes: '', total_price: '0',
  });

  useEffect(() => { fetchBookings(); }, []);

  const fetchBookings = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meeting_room_bookings')
      .select('*')
      .order('booking_date', { ascending: false })
      .limit(200);
    setBookings(data || []);
    setLoading(false);
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled');

  const handleConfirm = async (id: string) => {
    setActionId(id);
    const { error } = await supabase.from('meeting_room_bookings').update({ status: 'confirmed' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reserva confirmada', description: 'La reserva ahora aparece en el calendario.' });
      await fetchBookings();
    }
    setActionId(null);
  };

  const handleReject = async (id: string) => {
    if (!confirm('¿Rechazar esta reserva? Se eliminará definitivamente.')) return;
    setActionId(id);
    const { error } = await supabase.from('meeting_room_bookings').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reserva rechazada' });
      await fetchBookings();
    }
    setActionId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Cancelar esta reserva confirmada?')) return;
    setActionId(id);
    const { error } = await supabase.from('meeting_room_bookings').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reserva cancelada' });
      await fetchBookings();
    }
    setActionId(null);
  };

  const handleCreate = async () => {
    if (!newBooking.client_name || !newBooking.booking_date || !newBooking.start_time || !newBooking.end_time) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' });
      return;
    }
    setCreateLoading(true);
    const startHour = parseInt(newBooking.start_time.split(':')[0]);
    const endHour = parseInt(newBooking.end_time.split(':')[0]);
    if (endHour <= startHour) {
      toast({ title: 'La hora de fin debe ser posterior', variant: 'destructive' });
      setCreateLoading(false);
      return;
    }
    const { error } = await supabase.from('meeting_room_bookings').insert({
      client_name: newBooking.client_name,
      client_email: newBooking.client_email || 'admin@coalte.es',
      client_phone: newBooking.client_phone || '',
      booking_date: newBooking.booking_date,
      start_time: newBooking.start_time,
      end_time: newBooking.end_time,
      booking_type: 'hourly',
      hours: endHour - startHour,
      total_price: parseFloat(newBooking.total_price) || 0,
      payment_method: 'transfer',
      status: 'confirmed',
      notes: newBooking.notes || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Reserva creada' });
      setShowCreateForm(false);
      setNewBooking({ client_name: '', client_email: '', client_phone: '', booking_date: '', start_time: '', end_time: '', notes: '', total_price: '0' });
      await fetchBookings();
    }
    setCreateLoading(false);
  };

  const BookingCard = ({ b, actions }: { b: any; actions: React.ReactNode }) => (
    <Card key={b.id}>
      <CardContent className="py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium">{new Date(b.booking_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" /> {b.start_time} - {b.end_time} ({b.hours}h)
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" />{b.client_name}</p>
              <p className="text-xs text-muted-foreground">{b.client_email}</p>
            </div>
            {b.user_id ? (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">Cliente</span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Externo</span>
            )}
            <span className="font-bold">{b.total_price}€</span>
            {actions}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold">Gestión de Sala de Reuniones</h1>
            <p className="text-muted-foreground mt-1">Control total de reservas</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />{showCreateForm ? 'Cerrar' : 'Crear reserva'}
          </Button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <Card>
            <CardHeader><CardTitle>Crear reserva manual</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input value={newBooking.client_name} onChange={e => setNewBooking(p => ({ ...p, client_name: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={newBooking.client_email} onChange={e => setNewBooking(p => ({ ...p, client_email: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input value={newBooking.client_phone} onChange={e => setNewBooking(p => ({ ...p, client_phone: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Fecha *</Label>
                  <Input type="date" value={newBooking.booking_date} onChange={e => setNewBooking(p => ({ ...p, booking_date: e.target.value }))} className="mt-1" />
                </div>
                <div>
                  <Label>Hora inicio *</Label>
                  <Select value={newBooking.start_time} onValueChange={v => setNewBooking(p => ({ ...p, start_time: v, end_time: '' }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{timeSlots.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora fin *</Label>
                  <Select value={newBooking.end_time} onValueChange={v => setNewBooking(p => ({ ...p, end_time: v }))} disabled={!newBooking.start_time}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{timeSlots.filter(t => t > newBooking.start_time).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Precio (€)</Label>
                  <Input type="number" value={newBooking.total_price} onChange={e => setNewBooking(p => ({ ...p, total_price: e.target.value }))} className="mt-1" />
                </div>
                <div className="sm:col-span-2">
                  <Label>Notas</Label>
                  <Input value={newBooking.notes} onChange={e => setNewBooking(p => ({ ...p, notes: e.target.value }))} className="mt-1" />
                </div>
              </div>
              <Button onClick={handleCreate} disabled={createLoading} className="mt-4">
                {createLoading ? 'Creando...' : 'Crear reserva confirmada'}
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        ) : (
          <Tabs defaultValue="pending">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="pending" className="relative">
                Pendientes
                {pendingBookings.length > 0 && (
                  <span className="ml-2 bg-yellow-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{pendingBookings.length}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="confirmed">Confirmadas ({confirmedBookings.length})</TabsTrigger>
              <TabsTrigger value="cancelled">Canceladas ({cancelledBookings.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {pendingBookings.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay reservas pendientes de validación</CardContent></Card>
              ) : (
                <>
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {pendingBookings.length} reserva(s) de usuarios externos esperando validación
                    </p>
                  </div>
                  {pendingBookings.map(b => (
                    <BookingCard key={b.id} b={b} actions={
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleConfirm(b.id)} disabled={actionId === b.id} className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-1" />Validar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleReject(b.id)} disabled={actionId === b.id}>
                          <XCircle className="h-4 w-4 mr-1" />Rechazar
                        </Button>
                      </div>
                    } />
                  ))}
                </>
              )}
            </TabsContent>

            <TabsContent value="confirmed" className="space-y-3 mt-4">
              {confirmedBookings.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay reservas confirmadas</CardContent></Card>
              ) : (
                confirmedBookings.map(b => (
                  <BookingCard key={b.id} b={b} actions={
                    <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(b.id)} disabled={actionId === b.id}>
                      <Trash2 className="h-4 w-4 mr-1" />Cancelar
                    </Button>
                  } />
                ))
              )}
            </TabsContent>

            <TabsContent value="cancelled" className="space-y-3 mt-4">
              {cancelledBookings.length === 0 ? (
                <Card><CardContent className="py-8 text-center text-muted-foreground">No hay reservas canceladas</CardContent></Card>
              ) : (
                cancelledBookings.map(b => (
                  <BookingCard key={b.id} b={b} actions={
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">Cancelada</span>
                  } />
                ))
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}
