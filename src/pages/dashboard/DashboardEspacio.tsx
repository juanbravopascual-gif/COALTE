import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building, CalendarDays, FileCheck, CreditCard } from 'lucide-react';

export default function DashboardEspacio() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('client_services').select('*').eq('user_id', user.id)
      .then(({ data }) => setServices(data || []));
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Precio mensual</p>
                      <p className="font-medium">{s.monthly_price}€ + IVA</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileCheck className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Horas sala gratis/mes</p>
                      <p className="font-medium">{s.free_meeting_hours}h</p>
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
