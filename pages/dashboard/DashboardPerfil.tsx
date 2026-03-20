import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Save } from 'lucide-react';

export default function DashboardPerfil() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    nif_cif: '',
    address: '',
    city: '',
    postal_code: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data) setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          company: data.company || '',
          nif_cif: data.nif_cif || '',
          address: data.address || '',
          city: data.city || '',
          postal_code: data.postal_code || '',
        });
      });
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.from('profiles').update(profile).eq('user_id', user!.id);
    setLoading(false);
    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Perfil actualizado correctamente' });
    }
  };

  const fields = [
    { key: 'full_name', label: 'Nombre completo', type: 'text' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Teléfono', type: 'tel' },
    { key: 'company', label: 'Empresa', type: 'text' },
    { key: 'nif_cif', label: 'NIF/CIF', type: 'text' },
    { key: 'address', label: 'Dirección', type: 'text' },
    { key: 'city', label: 'Ciudad', type: 'text' },
    { key: 'postal_code', label: 'Código postal', type: 'text' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Mi Perfil</h1>
          <p className="text-muted-foreground mt-1">Actualiza tus datos personales y de facturación</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-accent" />
              Datos personales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((f) => (
                <div key={f.key}>
                  <Label>{f.label}</Label>
                  <Input
                    type={f.type}
                    value={(profile as any)[f.key]}
                    onChange={(e) => setProfile(prev => ({ ...prev, [f.key]: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            <Button onClick={handleSave} className="mt-6" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
