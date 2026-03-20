import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building, CalendarDays, FileCheck } from 'lucide-react';

export default function DashboardEspacio() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    supabase.from('client_services').select('*').eq('user_id', user.id)
      .then(({ data }) => setServices(data || []));

    // Get total bookings this month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    supabase
      .from('meeting_room_bookings')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('booking_date', startOfMonth)
      .lte('booking_date', endOfMonth)
      .then(({ count }) => {
        setBookingCounts({ total: count || 0 });
      });
  }, [user]);

  const serviceLabels: Record<string, string> = {
    puesto_flexible: 'Puesto flexible',
    puesto_fijo: 'Puesto fijo',
    despacho_individual: 'Despacho individual',
    despacho_doble: 'Despacho doble',
    despacho_completo: 'Despacho completo',
    sede_fiscal: 'Sede fiscal',
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    active: { label: 'Activo', className: 'bg-accent/10 text-accent' },
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    expired: { label: 'Vencido', className: 'bg-destructive/10 text-destructive' },
    cancelled: { label: 'Cancelado', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Mi Espacio</h1>
          <p className="text-muted-foreground mt-1">Información sobre tu servicio contratado</p>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Sin servicio activo</h3>
              <p className="text-muted-foreground">No tienes ningún servicio contratado actualmente. Contacta con nosotros para contratar tu espacio.</p>
            </CardContent>
          </Card>
        ) : (
          services.map((s) => (
            <Card key={s.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-accent" />
                    {serviceLabels[s.service_type] || s.service_type}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusLabels[s.status]?.className || ''}`}>
                    {statusLabels[s.status]?.label || s.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                      <p className="font-medium">{new Date(s.start_date).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha fin</p>
                      <p className="font-medium">{s.end_date ? new Date(s.end_date).toLocaleDateString('es-ES') : 'Indefinido'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Reservas totales este mes</p>
                      <p className="font-medium">{bookingCounts.total ?? 0}</p>
                    </div>
                  </div>
                </div>
                {s.notes && (
                  <div className="mt-4 p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">{s.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}