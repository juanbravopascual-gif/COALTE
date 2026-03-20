import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, AlertCircle } from 'lucide-react';

export default function DashboardFacturas() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('invoices').select('*').eq('user_id', user.id).order('issue_date', { ascending: false })
      .then(({ data }) => setInvoices(data || []));
  }, [user]);

  const statusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    paid: { label: 'Pagada', className: 'bg-accent/10 text-accent' },
    overdue: { label: 'Vencida', className: 'bg-destructive/10 text-destructive' },
    cancelled: { label: 'Cancelada', className: 'bg-muted text-muted-foreground' },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Facturas</h1>
            <p className="text-muted-foreground mt-1">Consulta y descarga tus facturas</p>
          </div>
          <Button>
            <FileText className="h-4 w-4 mr-2" />
            Solicitar factura
          </Button>
        </div>

        {invoices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-display text-xl font-semibold mb-2">Sin facturas</h3>
              <p className="text-muted-foreground">No tienes facturas emitidas todavía.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <Card key={inv.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <p className="font-medium">{inv.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{inv.concept}</p>
                        <p className="text-xs text-muted-foreground">{new Date(inv.issue_date).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-lg">{inv.total_amount}€</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusLabels[inv.status]?.className || ''}`}>
                        {statusLabels[inv.status]?.label || inv.status}
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
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
