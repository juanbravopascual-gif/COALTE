import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Users, Search, Plus, Eye, CreditCard, Filter } from 'lucide-react';

const serviceLabels: Record<string, string> = {
  puesto_flexible: 'Puesto flexible',
  puesto_fijo: 'Puesto fijo',
  despacho_individual: 'Despacho individual',
  despacho_doble: 'Despacho doble',
  despacho_completo: 'Despacho completo',
  sede_fiscal: 'Sede fiscal',
};

export default function AdminUsuarios() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [userNotes, setUserNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newService, setNewService] = useState({
    user_id: '',
    service_type: '',
    monthly_price: '',
    free_meeting_hours: '2',
  });
  const [newPayment, setNewPayment] = useState({
    user_id: '',
    amount: '',
    payment_method: 'transfer',
    reference: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [profRes, servRes, payRes, invRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('client_services').select('*'),
      supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('invoices').select('*'),
    ]);
    setProfiles(profRes.data || []);
    setServices(servRes.data || []);
    setPayments(payRes.data || []);
    setInvoices(invRes.data || []);
  };

  const getUserService = (userId: string) => services.find(s => s.user_id === userId && s.status === 'active');
  const getUserPayments = (userId: string) => payments.filter(p => p.user_id === userId);
  const getUserInvoices = (userId: string) => invoices.filter(i => i.user_id === userId);

  const getPaymentStatus = (userId: string): 'ok' | 'pending' | 'overdue' => {
    const userInvoices = getUserInvoices(userId);
    const overdue = userInvoices.some(i => i.status === 'pending' && i.due_date && new Date(i.due_date) < new Date());
    if (overdue) return 'overdue';
    const pending = userInvoices.some(i => i.status === 'pending');
    if (pending) return 'pending';
    return 'ok';
  };

  const filtered = profiles.filter(p => {
    const matchSearch = !search ||
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase()) ||
      p.company?.toLowerCase().includes(search.toLowerCase());

    const service = getUserService(p.user_id);
    const matchService = filterService === 'all' || (service && service.service_type === filterService) || (!service && filterService === 'none');
    
    const payStatus = getPaymentStatus(p.user_id);
    const matchPayment = filterPayment === 'all' || filterPayment === payStatus;

    return matchSearch && matchService && matchPayment;
  });

  const openUserDetail = async (profile: any) => {
    setSelectedUser(profile);
    // Fetch notes
    const { data } = await supabase.from('admin_notes').select('*').eq('user_id', profile.user_id).order('created_at', { ascending: false });
    setUserNotes(data || []);
    setNewNote('');
    setSheetOpen(true);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedUser || !user) return;
    await supabase.from('admin_notes').insert({
      user_id: selectedUser.user_id,
      author_id: user.id,
      content: newNote.trim(),
    });
    toast({ title: 'Nota añadida' });
    setNewNote('');
    const { data } = await supabase.from('admin_notes').select('*').eq('user_id', selectedUser.user_id).order('created_at', { ascending: false });
    setUserNotes(data || []);
  };

  const handleAssignService = async () => {
    if (!newService.user_id || !newService.service_type || !newService.monthly_price) {
      toast({ title: 'Completa todos los campos', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('client_services').insert({
      user_id: newService.user_id,
      service_type: newService.service_type,
      monthly_price: Number(newService.monthly_price),
      free_meeting_hours: Number(newService.free_meeting_hours),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Servicio asignado' });
      fetchData();
      setNewService({ user_id: '', service_type: '', monthly_price: '', free_meeting_hours: '2' });
    }
  };

  const handleRegisterPayment = async () => {
    if (!newPayment.user_id || !newPayment.amount) {
      toast({ title: 'Completa los campos obligatorios', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('payments').insert({
      user_id: newPayment.user_id,
      amount: Number(newPayment.amount),
      payment_method: newPayment.payment_method,
      reference: newPayment.reference,
      status: 'confirmed',
      payment_date: new Date().toISOString().split('T')[0],
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Pago registrado' });
      fetchData();
      setNewPayment({ user_id: '', amount: '', payment_method: 'transfer', reference: '' });
    }
  };

  const paymentStatusBadge = (status: string) => {
    if (status === 'overdue') return <Badge variant="destructive" className="text-xs">Impago</Badge>;
    if (status === 'pending') return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Pendiente</Badge>;
    return <Badge className="bg-emerald-100 text-emerald-800 text-xs">Al día</Badge>;
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground mt-1">{profiles.length} usuarios · {filtered.length} mostrados</p>
          </div>
        </div>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nombre, email o empresa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterService} onValueChange={setFilterService}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los planes</SelectItem>
              <SelectItem value="none">Sin servicio</SelectItem>
              {Object.entries(serviceLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPayment} onValueChange={setFilterPayment}>
            <SelectTrigger className="w-[160px]">
              <CreditCard className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Estado pago" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ok">Al día</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="overdue">Impago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* User list */}
        <div className="space-y-2">
          {filtered.map((p) => {
            const service = getUserService(p.user_id);
            const payStatus = getPaymentStatus(p.user_id);
            return (
              <Card key={p.id} className="hover:shadow-sm transition-shadow">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-primary font-semibold text-sm">
                          {p.full_name?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || '??'}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.full_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {service && (
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                          {serviceLabels[service.service_type]} · {service.monthly_price}€
                        </Badge>
                      )}
                      {paymentStatusBadge(payStatus)}
                      <Button variant="ghost" size="sm" onClick={() => openUserDetail(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => {
                            setNewService(prev => ({ ...prev, user_id: p.user_id }));
                            setNewPayment(prev => ({ ...prev, user_id: p.user_id }));
                          }}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Acciones — {p.full_name}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-6">
                            {/* Assign service */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Asignar servicio</h4>
                              <Select value={newService.service_type} onValueChange={(v) => setNewService(prev => ({ ...prev, service_type: v }))}>
                                <SelectTrigger><SelectValue placeholder="Tipo de servicio" /></SelectTrigger>
                                <SelectContent>
                                  {Object.entries(serviceLabels).map(([k, v]) => (
                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <Label className="text-xs">Precio €/mes</Label>
                                  <Input type="number" value={newService.monthly_price} onChange={(e) => setNewService(prev => ({ ...prev, monthly_price: e.target.value }))} />
                                </div>
                                <div>
                                  <Label className="text-xs">Horas sala gratis</Label>
                                  <Input type="number" value={newService.free_meeting_hours} onChange={(e) => setNewService(prev => ({ ...prev, free_meeting_hours: e.target.value }))} />
                                </div>
                              </div>
                              <Button size="sm" onClick={handleAssignService} className="w-full">Asignar servicio</Button>
                            </div>
                            <hr />
                            {/* Register payment */}
                            <div className="space-y-3">
                              <h4 className="font-semibold text-sm">Registrar pago</h4>
                              <Input type="number" placeholder="Importe €" value={newPayment.amount} onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))} />
                              <Select value={newPayment.payment_method} onValueChange={(v) => setNewPayment(prev => ({ ...prev, payment_method: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="transfer">Transferencia</SelectItem>
                                  <SelectItem value="cash">Efectivo</SelectItem>
                                  <SelectItem value="card">Tarjeta</SelectItem>
                                  <SelectItem value="bizum">Bizum</SelectItem>
                                </SelectContent>
                              </Select>
                              <Input placeholder="Referencia (opcional)" value={newPayment.reference} onChange={(e) => setNewPayment(prev => ({ ...prev, reference: e.target.value }))} />
                              <Button size="sm" onClick={handleRegisterPayment} className="w-full">Registrar pago</Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No se encontraron usuarios</CardContent></Card>
          )}
        </div>

        {/* User detail sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            {selectedUser && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-display">{selectedUser.full_name || 'Sin nombre'}</SheetTitle>
                </SheetHeader>
                <div className="space-y-6 mt-6">
                  {/* Personal data */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Datos personales</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Email:</span><br/><span className="font-medium">{selectedUser.email}</span></div>
                      <div><span className="text-muted-foreground">Teléfono:</span><br/><span className="font-medium">{selectedUser.phone || '—'}</span></div>
                      <div><span className="text-muted-foreground">Empresa:</span><br/><span className="font-medium">{selectedUser.company || '—'}</span></div>
                      <div><span className="text-muted-foreground">NIF/CIF:</span><br/><span className="font-medium">{selectedUser.nif_cif || '—'}</span></div>
                      <div><span className="text-muted-foreground">Dirección:</span><br/><span className="font-medium">{selectedUser.address || '—'}</span></div>
                      <div><span className="text-muted-foreground">Antigüedad:</span><br/><span className="font-medium">{Math.floor((Date.now() - new Date(selectedUser.created_at).getTime()) / 86400000)} días</span></div>
                    </div>
                  </div>

                  {/* Service */}
                  {(() => {
                    const service = getUserService(selectedUser.user_id);
                    return service ? (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan contratado</h3>
                        <div className="bg-secondary rounded-lg p-3 text-sm space-y-1">
                          <p className="font-medium">{serviceLabels[service.service_type]}</p>
                          <p>{service.monthly_price}€/mes · {service.free_meeting_hours}h sala/mes</p>
                          <p className="text-muted-foreground">Desde {new Date(service.start_date).toLocaleDateString('es-ES')}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Plan</h3>
                        <p className="text-sm text-muted-foreground">Sin servicio activo</p>
                      </div>
                    );
                  })()}

                  {/* Payment history */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial de pagos</h3>
                    {getUserPayments(selectedUser.user_id).length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {getUserPayments(selectedUser.user_id).slice(0, 15).map(p => (
                          <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                            <div>
                              <span className="font-medium">{Number(p.amount).toLocaleString('es-ES')}€</span>
                              <span className="text-muted-foreground ml-2 text-xs">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('es-ES') : '—'}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">{p.payment_method}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Sin pagos</p>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notas internas</h3>
                    {userNotes.length > 0 && (
                      <div className="space-y-2 max-h-36 overflow-y-auto">
                        {userNotes.map(n => (
                          <div key={n.id} className="bg-secondary rounded-lg p-2.5 text-sm">
                            <p>{n.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('es-ES')}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Añadir nota interna..." className="min-h-[60px]" />
                      <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>Añadir</Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
