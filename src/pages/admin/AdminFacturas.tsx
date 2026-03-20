import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FileText, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function AdminFacturas() {
  const { toast } = useToast();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [newInvoice, setNewInvoice] = useState({ user_id: '', concept: '', amount: '', tax_rate: '21' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [inv, prof] = await Promise.all([
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('user_id, full_name, email'),
    ]);
    setInvoices(inv.data || []);
    setProfiles(prof.data || []);
  };

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const handleCreate = async () => {
    if (!newInvoice.user_id || !newInvoice.concept || !newInvoice.amount) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' });
      return;
    }
    const amount = Number(newInvoice.amount);
    const taxRate = Number(newInvoice.tax_rate);
    const taxAmount = amount * (taxRate / 100);
    const totalAmount = amount + taxAmount;

    // Generate invoice number
    const { data: numData } = await supabase.rpc('generate_invoice_number');
    const invoiceNumber = numData || `COALTE-${new Date().getFullYear()}-0000`;

    const { error } = await supabase.from('invoices').insert({
      user_id: newInvoice.user_id,
      invoice_number: invoiceNumber,
      concept: newInvoice.concept,
      amount,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    });

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Factura creada correctamente' });
      fetchData();
      setNewInvoice({ user_id: '', concept: '', amount: '', tax_rate: '21' });
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
    const updates: any = { status: newStatus };
    if (newStatus === 'paid') updates.paid_date = new Date().toISOString().split('T')[0];
    await supabase.from('invoices').update(updates).eq('id', id);
    fetchData();
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Gestión de Facturas</h1>
            <p className="text-muted-foreground mt-1">{invoices.length} facturas emitidas</p>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Nueva factura</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear factura</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cliente</Label>
                  <Select value={newInvoice.user_id} onValueChange={(v) => setNewInvoice(prev => ({ ...prev, user_id: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                    <SelectContent>
                      {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name || p.email}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Concepto</Label>
                  <Input value={newInvoice.concept} onChange={(e) => setNewInvoice(prev => ({ ...prev, concept: e.target.value }))} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Base imponible (€)</Label>
                    <Input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice(prev => ({ ...prev, amount: e.target.value }))} className="mt-1" />
                  </div>
                  <div>
                    <Label>IVA (%)</Label>
                    <Input type="number" value={newInvoice.tax_rate} onChange={(e) => setNewInvoice(prev => ({ ...prev, tax_rate: e.target.value }))} className="mt-1" />
                  </div>
                </div>
                {newInvoice.amount && (
                  <p className="text-sm font-medium">Total: {(Number(newInvoice.amount) * (1 + Number(newInvoice.tax_rate) / 100)).toFixed(2)}€</p>
                )}
                <Button onClick={handleCreate} className="w-full">Crear factura</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-3">
          {invoices.map((inv) => {
            const profile = getProfile(inv.user_id);
            return (
              <Card key={inv.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <FileText className="h-5 w-5 text-accent" />
                      <div>
                        <p className="font-medium">{inv.invoice_number}</p>
                        <p className="text-sm text-muted-foreground">{inv.concept}</p>
                        <p className="text-xs text-muted-foreground">{profile?.full_name || profile?.email || 'Desconocido'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold">{inv.total_amount}€</p>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        inv.status === 'paid' ? 'bg-accent/10 text-accent' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {inv.status === 'paid' ? 'Pagada' : 'Pendiente'}
                      </span>
                      <Button variant="outline" size="sm" onClick={() => toggleStatus(inv.id, inv.status)}>
                        {inv.status === 'paid' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
