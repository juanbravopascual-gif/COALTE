import { useEffect, useState, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, User, ArrowUpDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

interface ClientStat {
  clientName: string;
  clientEmail: string;
  totalBookings: number;
  totalHours: number;
  avgHours: number;
  lastBooking: string;
}

type SortKey = 'totalBookings' | 'totalHours' | 'lastBooking';

export default function AdminEstadisticasReservas() {
  const [clientStats, setClientStats] = useState<ClientStat[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>('totalBookings');
  const [sortAsc, setSortAsc] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meeting_room_bookings')
      .select('client_name, client_email, hours, booking_date, status')
      .in('status', ['confirmed', 'pending']);

    if (!data) { setLoading(false); return; }

    const map = new Map<string, { name: string; email: string; bookings: number; hours: number; last: string }>();
    data.forEach((b) => {
      const key = b.client_email;
      const existing = map.get(key);
      if (existing) {
        existing.bookings++;
        existing.hours += b.hours || 0;
        if (b.booking_date > existing.last) existing.last = b.booking_date;
      } else {
        map.set(key, {
          name: b.client_name,
          email: b.client_email,
          bookings: 1,
          hours: b.hours || 0,
          last: b.booking_date,
        });
      }
    });

    const stats: ClientStat[] = Array.from(map.values()).map((v) => ({
      clientName: v.name,
      clientEmail: v.email,
      totalBookings: v.bookings,
      totalHours: v.hours,
      avgHours: v.bookings > 0 ? Math.round((v.hours / v.bookings) * 10) / 10 : 0,
      lastBooking: v.last,
    }));

    setClientStats(stats);
    setLoading(false);
  };

  const sorted = useMemo(() => {
    return [...clientStats].sort((a, b) => {
      const dir = sortAsc ? 1 : -1;
      if (sortBy === 'lastBooking') return dir * a.lastBooking.localeCompare(b.lastBooking);
      return dir * (a[sortBy] - b[sortBy]);
    });
  }, [clientStats, sortBy, sortAsc]);

  const top10 = useMemo(() => {
    return [...clientStats]
      .sort((a, b) => b.totalHours - a.totalHours)
      .slice(0, 10)
      .map((c) => ({ name: c.clientName.split(' ')[0], horas: c.totalHours, reservas: c.totalBookings }));
  }, [clientStats]);

  const handleSort = (key: SortKey) => {
    if (sortBy === key) setSortAsc(!sortAsc);
    else { setSortBy(key); setSortAsc(false); }
  };

  const totalBookings = clientStats.reduce((s, c) => s + c.totalBookings, 0);
  const totalHours = clientStats.reduce((s, c) => s + c.totalHours, 0);

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-semibold">Estadísticas de Reservas</h1>
          <p className="text-muted-foreground mt-1">Análisis de uso de la sala por cliente</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <User className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{clientStats.length}</p>
              <p className="text-xs text-muted-foreground">Clientes únicos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{totalBookings}</p>
              <p className="text-xs text-muted-foreground">Total reservas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">Total horas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{clientStats.length > 0 ? (totalHours / clientStats.length).toFixed(1) : 0}h</p>
              <p className="text-xs text-muted-foreground">Promedio por cliente</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {top10.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Top 10 clientes por horas reservadas</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={top10} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'horas' ? `${value}h` : value,
                      name === 'horas' ? 'Horas' : 'Reservas',
                    ]}
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="horas" fill="hsl(145, 50%, 42%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Detalle por cliente</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-muted-foreground">Cargando...</div>
            ) : sorted.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">No hay reservas registradas</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort('totalBookings')}>
                          Reservas <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort('totalHours')}>
                          Horas <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead>Promedio</TableHead>
                      <TableHead>
                        <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort('lastBooking')}>
                          Última reserva <ArrowUpDown className="ml-1 h-3 w-3" />
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sorted.map((c) => (
                      <TableRow key={c.clientEmail}>
                        <TableCell className="font-medium">{c.clientName}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{c.clientEmail}</TableCell>
                        <TableCell>{c.totalBookings}</TableCell>
                        <TableCell>{c.totalHours}h</TableCell>
                        <TableCell>{c.avgHours}h</TableCell>
                        <TableCell className="text-sm">
                          {new Date(c.lastBooking).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
