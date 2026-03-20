import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, Calendar, FileText, CreditCard, Building, TrendingUp,
  AlertTriangle, Clock, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface Alert {
  type: 'warning' | 'danger' | 'info';
  message: string;
}

export default function AdminHome() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeServices: 0,
    pendingPayments: 0,
    pendingInvoices: 0,
    todayBookings: 0,
    monthRevenue: 0,
    meetingHoursMonth: 0,
    occupiedDesks: 0,
    totalDesks: 15,
  });
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([]);
  const [serviceDistribution, setServiceDistribution] = useState<any[]>([]);
  const [upcomingDue, setUpcomingDue] = useState<any[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

    const [users, services, payments, invoices, bookings, revenue, meetingHours, allServices, pendingInvoicesList] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('client_services').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('meeting_room_bookings').select('id', { count: 'exact', head: true }).eq('booking_date', today),
      supabase.from('payments').select('amount, payment_date').eq('status', 'confirmed').gte('payment_date', monthStart),
      supabase.from('meeting_room_bookings').select('hours').gte('booking_date', monthStart).eq('status', 'confirmed'),
      supabase.from('client_services').select('service_type, status, end_date, user_id').eq('status', 'active'),
      supabase.from('invoices').select('*').eq('status', 'pending').order('due_date', { ascending: true }).limit(5),
    ]);

    const totalMeetingHours = (meetingHours.data || []).reduce((s, b) => s + (b.hours || 0), 0);
    const activeServicesList = allServices.data || [];
    const occupiedDesks = activeServicesList.filter(s => s.service_type !== 'sede_fiscal').length;

    setStats({
      totalUsers: users.count || 0,
      activeServices: services.count || 0,
      pendingPayments: payments.count || 0,
      pendingInvoices: invoices.count || 0,
      todayBookings: bookings.count || 0,
      monthRevenue: (revenue.data || []).reduce((sum, p) => sum + Number(p.amount), 0),
      meetingHoursMonth: totalMeetingHours,
      occupiedDesks,
      totalDesks: 15,
    });

    // Service distribution for pie chart
    const serviceTypes: Record<string, string> = {
      puesto_flexible: 'P. Flexible',
      puesto_fijo: 'P. Fijo',
      despacho_individual: 'Despacho Ind.',
      despacho_doble: 'Despacho Dob.',
      despacho_completo: 'Despacho Comp.',
      sede_fiscal: 'Sede Fiscal',
    };
    const dist: Record<string, number> = {};
    activeServicesList.forEach(s => {
      const label = serviceTypes[s.service_type] || s.service_type;
      dist[label] = (dist[label] || 0) + 1;
    });
    setServiceDistribution(Object.entries(dist).map(([name, value]) => ({ name, value })));

    // Revenue by month (last 6 months from payments)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount, payment_date')
      .eq('status', 'confirmed')
      .gte('payment_date', sixMonthsAgo.toISOString().split('T')[0])
      .order('payment_date');

    const monthlyRev: Record<string, number> = {};
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    (allPayments || []).forEach(p => {
      if (p.payment_date) {
        const d = new Date(p.payment_date);
        const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(2)}`;
        monthlyRev[key] = (monthlyRev[key] || 0) + Number(p.amount);
      }
    });
    setRevenueByMonth(Object.entries(monthlyRev).map(([month, total]) => ({ month, total })));

    // Alerts
    const newAlerts: Alert[] = [];
    if ((payments.count || 0) > 0) newAlerts.push({ type: 'danger', message: `${payments.count} pagos pendientes de confirmar` });
    if ((invoices.count || 0) > 0) newAlerts.push({ type: 'warning', message: `${invoices.count} facturas pendientes de cobro` });

    const expiringServices = activeServicesList.filter(s => s.end_date && s.end_date <= thirtyDaysFromNow);
    if (expiringServices.length > 0) newAlerts.push({ type: 'warning', message: `${expiringServices.length} membresías vencen en los próximos 30 días` });

    setAlerts(newAlerts);
    setUpcomingDue(pendingInvoicesList.data || []);
  };

  const PIE_COLORS = [
    'hsl(145, 50%, 42%)',
    'hsl(150, 40%, 25%)',
    'hsl(35, 30%, 55%)',
    'hsl(200, 50%, 50%)',
    'hsl(280, 40%, 55%)',
    'hsl(45, 80%, 55%)',
  ];

  const kpiCards = [
    { title: 'Coworkers activos', value: stats.activeServices, icon: Users, trend: null },
    { title: 'Ocupación', value: `${stats.occupiedDesks}/${stats.totalDesks}`, icon: Building, subtitle: `${Math.round(stats.occupiedDesks / stats.totalDesks * 100)}%` },
    { title: 'Ingresos del mes', value: `${stats.monthRevenue.toLocaleString('es-ES')}€`, icon: TrendingUp, trend: null },
    { title: 'Pagos pendientes', value: stats.pendingPayments, icon: CreditCard, alert: stats.pendingPayments > 0 },
    { title: 'Horas sala (mes)', value: `${stats.meetingHoursMonth}h`, icon: Clock, trend: null },
    { title: 'Reservas hoy', value: stats.todayBookings, icon: Calendar, trend: null },
  ];

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-semibold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Vista estratégica del coworking · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${
                  alert.type === 'danger' ? 'bg-destructive/10 text-destructive border border-destructive/20' :
                  alert.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                  'bg-accent/10 text-accent border border-accent/20'
                }`}
              >
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {kpiCards.map((c) => (
            <Card key={c.title} className={`${c.alert ? 'border-destructive/30 bg-destructive/5' : ''}`}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                    <c.icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                </div>
                <p className="text-2xl font-bold tracking-tight">{c.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.title}</p>
                {c.subtitle && <p className="text-xs text-accent font-medium mt-0.5">{c.subtitle}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Ingresos mensuales</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueByMonth.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={revenueByMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      formatter={(value: number) => [`${value.toLocaleString('es-ES')}€`, 'Ingresos']}
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="total" fill="hsl(145, 50%, 42%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Sin datos de ingresos</div>
              )}
            </CardContent>
          </Card>

          {/* Service Distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Distribución de servicios</CardTitle>
            </CardHeader>
            <CardContent>
              {serviceDistribution.length > 0 ? (
                <div>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={serviceDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {serviceDistribution.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {serviceDistribution.map((s, i) => (
                      <div key={s.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-muted-foreground">{s.name}</span>
                        </div>
                        <span className="font-medium">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">Sin servicios activos</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Due Payments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Próximos vencimientos de cobro</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingDue.length > 0 ? (
              <div className="space-y-3">
                {upcomingDue.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{inv.concept}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{Number(inv.total_amount).toLocaleString('es-ES')}€</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No hay facturas pendientes</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
