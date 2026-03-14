import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { MapPin } from 'lucide-react';

interface DeskData {
  id: string;
  label: string;
  type: 'puesto_fijo' | 'puesto_flexible' | 'despacho_individual' | 'despacho_doble' | 'despacho_completo' | 'sede_fiscal';
  x: number;
  y: number;
  width: number;
  height: number;
}

// Desk layout matching the real Coalte floor plan
const DESKS: DeskData[] = [
  // Zona trabajo abierta (left side)
  { id: 'pf1', label: 'P1', type: 'puesto_fijo', x: 5, y: 15, width: 12, height: 10 },
  { id: 'pf2', label: 'P2', type: 'puesto_fijo', x: 5, y: 28, width: 12, height: 10 },
  { id: 'pf3', label: 'P3', type: 'puesto_fijo', x: 5, y: 41, width: 12, height: 10 },
  { id: 'pf4', label: 'P4', type: 'puesto_fijo', x: 5, y: 54, width: 12, height: 10 },
  { id: 'pf5', label: 'P5', type: 'puesto_flexible', x: 20, y: 15, width: 12, height: 10 },
  { id: 'pf6', label: 'P6', type: 'puesto_flexible', x: 20, y: 28, width: 12, height: 10 },
  { id: 'pf7', label: 'P7', type: 'puesto_flexible', x: 20, y: 41, width: 12, height: 10 },
  { id: 'pf8', label: 'P8', type: 'puesto_flexible', x: 20, y: 54, width: 12, height: 10 },
  // Despachos (right side)
  { id: 'di1', label: 'D1', type: 'despacho_individual', x: 55, y: 15, width: 18, height: 14 },
  { id: 'di2', label: 'D2', type: 'despacho_individual', x: 55, y: 33, width: 18, height: 14 },
  { id: 'dd1', label: 'D3', type: 'despacho_doble', x: 55, y: 51, width: 18, height: 14 },
  { id: 'dc1', label: 'D4', type: 'despacho_completo', x: 77, y: 15, width: 18, height: 14 },
  { id: 'dc2', label: 'D5', type: 'despacho_completo', x: 77, y: 33, width: 18, height: 14 },
  // Sala reuniones (top right)
  { id: 'sr', label: 'Sala', type: 'puesto_flexible', x: 77, y: 51, width: 18, height: 14 },
  // Extra
  { id: 'pf9', label: 'P9', type: 'puesto_fijo', x: 38, y: 15, width: 12, height: 10 },
];

const serviceTypeForDesk: Record<string, string> = {
  puesto_fijo: 'puesto_fijo',
  puesto_flexible: 'puesto_flexible',
  despacho_individual: 'despacho_individual',
  despacho_doble: 'despacho_doble',
  despacho_completo: 'despacho_completo',
};

interface UserSidebar {
  profile: any;
  service: any;
  payments: any[];
  notes: any[];
  meetingHours: number;
}

export default function AdminMapa() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedDesk, setSelectedDesk] = useState<DeskData | null>(null);
  const [sidebarData, setSidebarData] = useState<UserSidebar | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [servRes, profRes, payRes, invRes] = await Promise.all([
      supabase.from('client_services').select('*').eq('status', 'active'),
      supabase.from('profiles').select('*'),
      supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('invoices').select('*'),
    ]);
    setServices(servRes.data || []);
    setProfiles(profRes.data || []);
    setPayments(payRes.data || []);
    setInvoices(invRes.data || []);
  };

  const getOccupant = (desk: DeskData) => {
    const deskType = serviceTypeForDesk[desk.type];
    if (!deskType) return null;
    // Find a service that matches this desk type
    const matchingServices = services.filter(s => s.service_type === deskType);
    // Simple assignment: use index within same type
    const sameTypeDesks = DESKS.filter(d => d.type === desk.type);
    const deskIndex = sameTypeDesks.findIndex(d => d.id === desk.id);
    return matchingServices[deskIndex] || null;
  };

  const getDeskStatus = (desk: DeskData): 'free' | 'active' | 'warning' | 'overdue' => {
    if (desk.id === 'sr') return 'free'; // sala reuniones
    const occupant = getOccupant(desk);
    if (!occupant) return 'free';

    // Check payment status
    const userInvoices = invoices.filter(i => i.user_id === occupant.user_id && i.status === 'pending');
    if (userInvoices.some(i => i.due_date && new Date(i.due_date) < new Date())) return 'overdue';

    // Check if expiring soon
    if (occupant.end_date) {
      const daysToEnd = (new Date(occupant.end_date).getTime() - Date.now()) / 86400000;
      if (daysToEnd <= 30 && daysToEnd > 0) return 'warning';
    }

    return 'active';
  };

  const getProfile = (userId: string) => profiles.find(p => p.user_id === userId);

  const handleDeskClick = async (desk: DeskData) => {
    const occupant = getOccupant(desk);
    if (!occupant) {
      setSelectedDesk(desk);
      setSidebarData(null);
      setSheetOpen(true);
      return;
    }

    const profile = getProfile(occupant.user_id);
    const userPayments = payments.filter(p => p.user_id === occupant.user_id);

    // Fetch meeting hours
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: bookings } = await supabase
      .from('meeting_room_bookings')
      .select('hours')
      .eq('user_id', occupant.user_id)
      .gte('booking_date', monthStart);

    const meetingHours = (bookings || []).reduce((s, b) => s + (b.hours || 0), 0);

    // Fetch admin notes
    const { data: notesData } = await supabase
      .from('admin_notes')
      .select('*')
      .eq('user_id', occupant.user_id)
      .order('created_at', { ascending: false });

    setSelectedDesk(desk);
    setSidebarData({ profile, service: occupant, payments: userPayments, notes: notesData || [], meetingHours });
    setNotes(notesData || []);
    setNewNote('');
    setSheetOpen(true);
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !sidebarData?.service?.user_id || !user) return;
    const { error } = await supabase.from('admin_notes').insert({
      user_id: sidebarData.service.user_id,
      author_id: user.id,
      content: newNote.trim(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Nota añadida' });
      setNewNote('');
      // Refresh notes
      const { data } = await supabase.from('admin_notes').select('*').eq('user_id', sidebarData.service.user_id).order('created_at', { ascending: false });
      setNotes(data || []);
    }
  };

  const statusColors = {
    free: 'fill-muted stroke-border',
    active: 'fill-emerald-100 stroke-emerald-500',
    warning: 'fill-yellow-100 stroke-yellow-500',
    overdue: 'fill-red-100 stroke-red-500',
  };

  const statusLabels = {
    free: 'Libre',
    active: 'Activo · Al día',
    warning: 'Próximo a vencer',
    overdue: 'Impago',
  };

  const serviceLabels: Record<string, string> = {
    puesto_flexible: 'Puesto flexible',
    puesto_fijo: 'Puesto fijo',
    despacho_individual: 'Despacho individual',
    despacho_doble: 'Despacho doble',
    despacho_completo: 'Despacho completo',
    sede_fiscal: 'Sede fiscal',
  };

  const paymentStatusLabels: Record<string, { label: string; className: string }> = {
    pending: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmado', className: 'bg-emerald-100 text-emerald-800' },
    rejected: { label: 'Rechazado', className: 'bg-red-100 text-red-800' },
  };

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
            <MapPin className="h-7 w-7 text-primary" />
            Mapa del Espacio
          </h1>
          <p className="text-muted-foreground mt-1">Distribución y estado de ocupación en tiempo real</p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          {(['active', 'warning', 'overdue', 'free'] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border-2 ${
                s === 'active' ? 'bg-emerald-100 border-emerald-500' :
                s === 'warning' ? 'bg-yellow-100 border-yellow-500' :
                s === 'overdue' ? 'bg-red-100 border-red-500' :
                'bg-muted border-border'
              }`} />
              <span className="text-muted-foreground">{statusLabels[s]}</span>
            </div>
          ))}
        </div>

        {/* Floor Plan */}
        <Card>
          <CardContent className="p-6">
            <svg viewBox="0 0 100 75" className="w-full max-w-4xl mx-auto" style={{ aspectRatio: '100/75' }}>
              {/* Background */}
              <rect x="0" y="0" width="100" height="75" rx="2" className="fill-secondary stroke-border" strokeWidth="0.5" />

              {/* Zone labels */}
              <text x="16" y="10" className="fill-muted-foreground" fontSize="3" fontWeight="600" textAnchor="middle">ZONA ABIERTA</text>
              <text x="65" y="10" className="fill-muted-foreground" fontSize="3" fontWeight="600" textAnchor="middle">DESPACHOS</text>
              <text x="86" y="48" className="fill-muted-foreground" fontSize="2.5" fontWeight="600" textAnchor="middle">SALA REUNIONES</text>

              {/* Desks */}
              {DESKS.map(desk => {
                const status = getDeskStatus(desk);
                const occupant = getOccupant(desk);
                const profile = occupant ? getProfile(occupant.user_id) : null;

                return (
                  <g
                    key={desk.id}
                    className="cursor-pointer transition-transform hover:scale-105"
                    onClick={() => handleDeskClick(desk)}
                  >
                    <rect
                      x={desk.x}
                      y={desk.y}
                      width={desk.width}
                      height={desk.height}
                      rx="1"
                      className={statusColors[status]}
                      strokeWidth="0.4"
                    />
                    <text
                      x={desk.x + desk.width / 2}
                      y={desk.y + desk.height / 2 - (profile ? 1.2 : 0)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="2.3"
                      fontWeight="700"
                      className="fill-foreground pointer-events-none"
                    >
                      {desk.label}
                    </text>
                    {profile && (
                      <text
                        x={desk.x + desk.width / 2}
                        y={desk.y + desk.height / 2 + 2}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="1.6"
                        className="fill-muted-foreground pointer-events-none"
                      >
                        {profile.full_name?.split(' ')[0] || ''}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </CardContent>
        </Card>

        {/* Detail Sheet */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display">
                {sidebarData?.profile
                  ? sidebarData.profile.full_name || 'Sin nombre'
                  : selectedDesk?.label + ' — Libre'}
              </SheetTitle>
            </SheetHeader>

            {sidebarData?.profile ? (
              <div className="space-y-6 mt-6">
                {/* Contact info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Datos de contacto</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{sidebarData.profile.email}</span></div>
                    <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-medium">{sidebarData.profile.phone || '—'}</span></div>
                    <div><span className="text-muted-foreground">Empresa:</span> <span className="font-medium">{sidebarData.profile.company || '—'}</span></div>
                    <div><span className="text-muted-foreground">NIF/CIF:</span> <span className="font-medium">{sidebarData.profile.nif_cif || '—'}</span></div>
                  </div>
                </div>

                {/* Service info */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Plan contratado</h3>
                  <div className="bg-secondary rounded-lg p-3 text-sm space-y-1">
                    <p><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{serviceLabels[sidebarData.service.service_type]}</span></p>
                    <p><span className="text-muted-foreground">Precio:</span> <span className="font-bold">{sidebarData.service.monthly_price}€/mes</span></p>
                    <p><span className="text-muted-foreground">Inicio:</span> {new Date(sidebarData.service.start_date).toLocaleDateString('es-ES')}</p>
                    {sidebarData.service.end_date && <p><span className="text-muted-foreground">Vencimiento:</span> {new Date(sidebarData.service.end_date).toLocaleDateString('es-ES')}</p>}
                    <p><span className="text-muted-foreground">Horas sala gratis:</span> {sidebarData.service.free_meeting_hours}h/mes</p>
                  </div>
                </div>

                {/* Meeting hours */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Uso sala reuniones</h3>
                  <p className="text-2xl font-bold">{sidebarData.meetingHours}h <span className="text-sm font-normal text-muted-foreground">este mes</span></p>
                </div>

                {/* Payment history */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Historial de pagos</h3>
                  {sidebarData.payments.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {sidebarData.payments.slice(0, 10).map(p => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                          <div>
                            <p className="font-medium">{Number(p.amount).toLocaleString('es-ES')}€</p>
                            <p className="text-xs text-muted-foreground">{p.payment_date ? new Date(p.payment_date).toLocaleDateString('es-ES') : '—'} · {p.payment_method}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusLabels[p.status]?.className || ''}`}>
                            {paymentStatusLabels[p.status]?.label || p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin pagos registrados</p>
                  )}
                </div>

                {/* Admin notes */}
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Notas internas</h3>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {notes.map(n => (
                      <div key={n.id} className="bg-secondary rounded-lg p-2.5 text-sm">
                        <p>{n.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Añadir nota..."
                      className="min-h-[60px]"
                    />
                    <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim()}>Añadir</Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 text-center text-muted-foreground">
                <p className="text-lg font-medium mb-2">Puesto libre</p>
                <p className="text-sm">Este puesto no tiene ningún coworker asignado actualmente.</p>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
}
