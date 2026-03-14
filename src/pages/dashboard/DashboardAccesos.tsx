import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Key, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function DashboardAccesos() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('access_codes').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setCodes(data || []));
  }, [user]);

  const isValid = (code: any) => {
    const now = new Date();
    return code.is_active && new Date(code.valid_from) <= now && new Date(code.valid_until) >= now;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Códigos de Acceso</h1>
          <p className="text-muted-foreground mt-1">Tus códigos para acceder a la sala de reuniones</p>
        </div>

        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Key className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="font-medium">¿Cómo funcionan los códigos?</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cada vez que reservas la sala de reuniones, se genera un código único temporal. 
                  Este código es válido solo durante el horario de tu reserva.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {codes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Sin códigos</h3>
              <p className="text-muted-foreground">Reserva la sala de reuniones para obtener un código de acceso.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {codes.map((code) => {
              const valid = isValid(code);
              return (
                <Card key={code.id} className={valid ? 'border-accent/50' : ''}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${valid ? 'bg-accent/10' : 'bg-muted'}`}>
                          {valid ? <CheckCircle className="h-5 w-5 text-accent" /> : <XCircle className="h-5 w-5 text-muted-foreground" />}
                        </div>
                        <div>
                          <p className="font-mono text-2xl font-bold tracking-wider">{code.code}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                              {new Date(code.valid_from).toLocaleDateString('es-ES')} · {new Date(code.valid_from).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {new Date(code.valid_until).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        valid ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                      }`}>
                        {valid ? 'Válido ahora' : code.is_active ? 'Expirado' : 'Desactivado'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
