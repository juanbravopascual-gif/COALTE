import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building, Calendar, ArrowRight, Clock } from 'lucide-react';

export default function DashboardHome() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [bookingsCount, setBookingsCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [profileRes, serviceRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('client_services').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
        supabase.from('meeting_room_bookings').select('id').eq('user_id', user.id).gte('booking_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
      ]);

      setProfile(profileRes.data);
      setService(serviceRes.data);
      setBookingsCount(bookingsRes.data?.length || 0);
    };

    fetchData();
  }, [user]);

  const serviceLabels: Record<string, string> = {
    puesto_flexible: 'Puesto flexible',
    puesto_fijo: 'Puesto fijo',
    despacho_individual: 'Despacho individual',
    despacho_doble: 'Despacho doble',
    despacho_completo: 'Despacho completo',
    sede_fiscal: 'Sede fiscal',
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Hola, {profile?.full_name || 'Bienvenido'} 👋
          </h1>
          <p className="text-muted-foreground mt-1">Tu resumen en COALTE Coworking</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Mi Espacio</p>
                  <p className="font-semibold">{service ? serviceLabels[service.service_type] || service.service_type : 'Sin servicio'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sala de reuniones</p>
                  <p className="font-semibold text-sm">Haz buen uso de la sala y cuida el material</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-display text-xl font-semibold mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start" asChild>
              <Link to="/dashboard/sala-reuniones">
                <Calendar className="h-5 w-5 mr-3 text-accent" />
                <div className="text-left">
                  <p className="font-medium">Reservar sala</p>
                  <p className="text-xs text-muted-foreground">Reserva la sala de reuniones</p>
                </div>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>

          </div>
        </div>

        {/* Service Info */}
        {service && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-accent" />
                Información de tu contrato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Servicio</p>
                  <p className="font-medium">{serviceLabels[service.service_type] || service.service_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Fecha de inicio</p>
                  <p className="font-medium">{new Date(service.start_date).toLocaleDateString('es-ES')}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.status === 'active' ? 'bg-accent/10 text-accent' :
                    service.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {service.status === 'active' ? 'Activo' : service.status === 'pending' ? 'Pendiente' : 'Vencido'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
