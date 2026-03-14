import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Building, Copy, CheckCircle } from 'lucide-react';

const BANK_DETAILS = {
  iban: 'ES37 0081 7301 3200 0187 2392',
  bank: 'Banco Sabadell',
  holder: 'COALTE COWORKING',
};

export default function DashboardPagos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<any[]>([]);
  const [service, setService] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from('payments').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('client_services').select('*').eq('user_id', user.id).eq('status', 'active').maybeSingle(),
    ]).then(([paymentsRes, serviceRes]) => {
      setPayments(paymentsRes.data || []);
      setService(serviceRes.data);
    });
  }, [user]);

  const copyIban = () => {
    navigator.clipboard.writeText(BANK_DETAILS.iban.replace(/\s/g, ''));
    setCopied(true);
    toast({ title: 'IBAN copiado al portapapeles' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNotifyPayment = async () => {
    if (!service) return;
    const { error } = await supabase.from('payments').insert({
      user_id: user!.id,
      amount: service.monthly_price,
      payment_method: 'transfer',
      status: 'pending',
      payment_date: new Date().toISOString().split('T')[0],
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Pago notificado', description: 'El administrador verificará tu transferencia.' });
      const { data } = await supabase.from('payments').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      setPayments(data || []);
    }
  };

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmado', className: 'bg-accent/10 text-accent' },
    rejected: { label: 'Rechazado', className: 'bg-destructive/10 text-destructive' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Pagos</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus pagos mensuales</p>
        </div>

        {/* Bank Transfer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-accent" />
              Datos para transferencia bancaria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">IBAN</p>
                  <p className="font-mono font-bold">{BANK_DETAILS.iban}</p>
                </div>
                <Button variant="outline" size="sm" onClick={copyIban}>
                  {copied ? <CheckCircle className="h-4 w-4 text-accent" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">Banco</p>
                  <p className="font-medium">{BANK_DETAILS.bank}</p>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">Titular</p>
                  <p className="font-medium">{BANK_DETAILS.holder}</p>
                </div>
              </div>
            </div>

            {service && (
              <div className="mt-6 p-4 border border-accent/30 bg-accent/5 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-medium">Tu mensualidad: <strong>{service.monthly_price}€ + IVA</strong></p>
                </div>
                <Button onClick={handleNotifyPayment} className="w-full" size="lg">
                  <CreditCard className="h-5 w-5 mr-2" />
                  He realizado la transferencia
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Al pulsar, notificarás al administrador para que verifique tu pago.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de pagos</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay pagos registrados</p>
            ) : (
              <div className="space-y-3">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div>
                      <p className="font-medium">{p.amount}€</p>
                      <p className="text-sm text-muted-foreground">
                        {p.payment_date ? new Date(p.payment_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                        {' · '}{p.payment_method === 'transfer' ? 'Transferencia' : p.payment_method}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[p.status]?.className || ''}`}>
                      {statusLabels[p.status]?.label || p.status}
                    </span>
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
