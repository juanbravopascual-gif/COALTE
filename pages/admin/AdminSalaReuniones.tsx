import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User } from 'lucide-react';

export default function AdminSalaReuniones() {
  const [bookings, setBookings] = useState<any[]>([]);

  useEffect(() => {
    supabase.from('meeting_room_bookings').select('*').order('booking_date', { ascending: false }).limit(100)
      .then(({ data }) => setBookings(data || []));
  }, []);

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Gestión de Sala de Reuniones</h1>
          <p className="text-muted-foreground mt-1">Todas las reservas</p>
        </div>

        {bookings.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No hay reservas</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <Card key={b.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{new Date(b.booking_date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5" /> {b.start_time} - {b.end_time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium flex items-center gap-1"><User className="h-3.5 w-3.5" />{b.client_name}</p>
                        <p className="text-xs text-muted-foreground">{b.client_email}</p>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        b.status === 'confirmed' ? 'bg-accent/10 text-accent' :
                        b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {b.status === 'confirmed' ? 'Confirmada' : b.status === 'pending' ? 'Pendiente' : b.status}
                      </span>
                      {b.access_code && <span className="font-mono text-sm bg-secondary px-2 py-1 rounded">{b.access_code}</span>}
                      <span className="font-bold">{b.total_price}€</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
