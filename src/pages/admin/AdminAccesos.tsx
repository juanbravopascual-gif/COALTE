import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Key, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function AdminAccesos() {
  const { toast } = useToast();
  const [codes, setCodes] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [codesRes, profilesRes] = await Promise.all([
      supabase.from('access_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, full_name, email'),
    ]);
    setCodes(codesRes.data || []);
    setProfiles(profilesRes.data || []);
  };

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const toggleActive = async (id: string, isActive: boolean) => {
    await supabase.from('access_codes').update({ is_active: !isActive }).eq('id', id);
    toast({ title: isActive ? 'Código desactivado' : 'Código activado' });
    fetchData();
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Gestión de Accesos</h1>
          <p className="text-muted-foreground mt-1">Códigos de acceso generados</p>
        </div>

        {codes.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No hay códigos generados</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {codes.map((c) => {
              const profile = getProfile(c.user_id);
              const now = new Date();
              const isValid = c.is_active && new Date(c.valid_from) <= now && new Date(c.valid_until) >= now;
              return (
                <Card key={c.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isValid ? 'bg-accent/10' : 'bg-muted'}`}>
                          <Key className={`h-5 w-5 ${isValid ? 'text-accent' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-mono text-xl font-bold">{c.code}</p>
                          <p className="text-sm text-muted-foreground">{profile?.full_name || profile?.email || 'Desconocido'}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(c.valid_from).toLocaleString('es-ES')} → {new Date(c.valid_until).toLocaleString('es-ES')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isValid ? 'bg-accent/10 text-accent' : c.is_active ? 'bg-yellow-100 text-yellow-800' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {isValid ? 'Válido' : c.is_active ? 'Expirado' : 'Desactivado'}
                        </span>
                        <Button variant="outline" size="sm" onClick={() => toggleActive(c.id, c.is_active)}>
                          {c.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                      </div>
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
