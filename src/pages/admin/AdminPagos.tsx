import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, CheckCircle, XCircle } from 'lucide-react';

export default function AdminPagos() {
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [pay, prof] = await Promise.all([
      supabase.from('payments').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, full_name, email'),
    ]);
    setPayments(pay.data || []);
    setProfiles(prof.data || []);
  };

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('payments').update({ status }).eq('id', id);
    toast({ title: `Pago ${status === 'confirmed' ? 'confirmado' : 'rechazado'}` });
    fetchData();
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmado', className: 'bg-accent/10 text-accent' },
    rejected: { label: 'Rechazado', className: 'bg-destructive/10 text-destructive' },
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Gestión de Pagos</h1>
          <p className="text-muted-foreground mt-1">{payments.length} pagos registrados</p>
        </div>

        {payments.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No hay pagos</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const profile = getProfile(p.user_id);
              return (
                <Card key={p.id}>
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-5 w-5 text-accent" />
                        <div>
                          <p className="font-medium">{p.amount}€</p>
                          <p className="text-sm text-muted-foreground">{profile?.full_name || profile?.email || 'Desconocido'}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.payment_date ? new Date(p.payment_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                            {' · '}{p.payment_method === 'transfer' ? 'Transferencia' : p.payment_method}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[p.status]?.className || ''}`}>
                          {statusLabels[p.status]?.label || p.status}
                        </span>
                        {p.status === 'pending' && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'confirmed')} className="text-accent">
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => updateStatus(p.id, 'rejected')} className="text-destructive">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
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
