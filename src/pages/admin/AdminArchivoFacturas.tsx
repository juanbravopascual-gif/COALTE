import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Archive, Download, FileText, FolderOpen } from 'lucide-react';

interface StorageFile {
  name: string;
  path: string;
  url: string;
  size: number;
  month: string;
}

const MONTHS: Record<string, string> = {
  enero: 'Enero',
  febrero: 'Febrero',
  marzo: 'Marzo',
  abril: 'Abril',
  mayo: 'Mayo',
  junio: 'Junio',
  julio: 'Julio',
  agosto: 'Agosto',
  septiembre: 'Septiembre',
  octubre: 'Octubre',
  noviembre: 'Noviembre',
  diciembre: 'Diciembre',
};

export default function AdminArchivoFacturas() {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchFiles();
  }, [selectedYear]);

  const fetchYears = async () => {
    const { data } = await supabase.storage.from('invoices').list('', { limit: 100 });
    if (data) {
      const yearFolders = data.filter(f => f.id === null || f.name.match(/^\d{4}$/)).map(f => f.name);
      setYears(yearFolders.length > 0 ? yearFolders : ['2026']);
    }
  };

  const fetchFiles = async () => {
    setLoading(true);
    const allFiles: StorageFile[] = [];

    // List month folders for the selected year
    const { data: monthFolders } = await supabase.storage.from('invoices').list(selectedYear, { limit: 100 });

    if (monthFolders) {
      for (const folder of monthFolders) {
        const monthName = folder.name;
        const { data: monthFiles } = await supabase.storage.from('invoices').list(`${selectedYear}/${monthName}`, { limit: 100 });

        if (monthFiles) {
          for (const file of monthFiles) {
            if (file.name && !file.name.startsWith('.')) {
              const path = `${selectedYear}/${monthName}/${file.name}`;
              const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(path);
              allFiles.push({
                name: file.name.replace('.pdf', '').replace(/_/g, ' '),
                path,
                url: urlData.publicUrl,
                size: file.metadata?.size || 0,
                month: monthName,
              });
            }
          }
        }
      }
    }

    setFiles(allFiles);
    setLoading(false);
  };

  const filteredFiles = selectedMonth === 'all'
    ? files
    : files.filter(f => f.month === selectedMonth);

  const availableMonths = [...new Set(files.map(f => f.month))];

  const totalFiles = filteredFiles.length;

  return (
    <DashboardLayout isAdmin>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold flex items-center gap-3">
              <Archive className="h-8 w-8 text-accent" />
              Archivo de Facturas
            </h1>
            <p className="text-muted-foreground mt-1">{totalFiles} facturas archivadas</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Todos los meses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los meses</SelectItem>
                {availableMonths.map(m => (
                  <SelectItem key={m} value={m}>{MONTHS[m] || m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Cargando facturas...</div>
            ) : filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                <FolderOpen className="h-10 w-10" />
                <p>No hay facturas para este período</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Factura</TableHead>
                    <TableHead>Mes</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.map((file) => (
                    <TableRow key={file.path}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-accent shrink-0" />
                          <span className="font-medium">{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                          {MONTHS[file.month] || file.month}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Descargar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
