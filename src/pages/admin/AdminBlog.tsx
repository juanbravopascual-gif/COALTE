import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Eye, Users, Bot, Settings, Loader2, CheckCircle, Clock } from 'lucide-react';

export default function AdminBlog() {
  const [articles, setArticles] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', featured_image: '',
    category_id: '', meta_description: '', keywords: '', status: 'draft', author_name: 'COALTE Coworking',
  });
  const [autoSettings, setAutoSettings] = useState({
    auto_publish_enabled: true,
    articles_per_day: '2',
    review_mode: false,
  });
  const { toast } = useToast();

  const fetchAll = async () => {
    const [a, c, s, st] = await Promise.all([
      supabase.from('blog_articles').select('*').order('created_at', { ascending: false }),
      supabase.from('blog_categories').select('*'),
      supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false }),
      supabase.from('blog_settings').select('*'),
    ]);
    setArticles(a.data || []);
    setCategories(c.data || []);
    setSubscribers(s.data || []);
    
    const settingsMap: Record<string, string> = {};
    (st.data || []).forEach((s: any) => { settingsMap[s.setting_key] = s.setting_value; });
    setAutoSettings({
      auto_publish_enabled: settingsMap.auto_publish_enabled !== 'false',
      articles_per_day: settingsMap.articles_per_day || '2',
      review_mode: settingsMap.review_mode === 'true',
    });
  };

  useEffect(() => { fetchAll(); }, []);

  const generateSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9áéíóúñü]+/g, '-').replace(/(^-|-$)/g, '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', slug: '', excerpt: '', content: '', featured_image: '', category_id: '', meta_description: '', keywords: '', status: 'draft', author_name: 'COALTE Coworking' });
    setDialogOpen(true);
  };

  const openEdit = (article: any) => {
    setEditing(article);
    setForm({
      title: article.title, slug: article.slug, excerpt: article.excerpt, content: article.content,
      featured_image: article.featured_image || '', category_id: article.category_id || '',
      meta_description: article.meta_description || '', keywords: (article.keywords || []).join(', '),
      status: article.status, author_name: article.author_name || 'COALTE Coworking',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title, slug: form.slug || generateSlug(form.title), excerpt: form.excerpt,
      content: form.content, featured_image: form.featured_image,
      category_id: form.category_id || null, meta_description: form.meta_description,
      keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean),
      status: form.status, author_name: form.author_name,
      published_at: form.status === 'published' ? (editing?.published_at || new Date().toISOString()) : null,
      updated_at: new Date().toISOString(),
    };

    if (editing) {
      const { error } = await supabase.from('blog_articles').update(payload).eq('id', editing.id);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Artículo actualizado' });
    } else {
      const { error } = await supabase.from('blog_articles').insert(payload);
      if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
      toast({ title: 'Artículo creado' });
    }

    setDialogOpen(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este artículo?')) return;
    await supabase.from('blog_articles').delete().eq('id', id);
    toast({ title: 'Artículo eliminado' });
    fetchAll();
  };

  const handleApprove = async (id: string) => {
    await supabase.from('blog_articles').update({ 
      review_status: 'approved', status: 'published', 
      published_at: new Date().toISOString() 
    }).eq('id', id);
    toast({ title: 'Artículo aprobado y publicado' });
    fetchAll();
  };

  const handleGenerateNow = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-blog-article');
      if (error) throw error;
      if (data?.error) {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      } else {
        toast({ title: '¡Artículo generado!', description: data?.article?.title || 'Nuevo artículo creado' });
        fetchAll();
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    await supabase.from('blog_settings').update({ setting_value: value, updated_at: new Date().toISOString() }).eq('setting_key', key);
  };

  const handleToggleAutoPublish = async (checked: boolean) => {
    setAutoSettings(prev => ({ ...prev, auto_publish_enabled: checked }));
    await saveSetting('auto_publish_enabled', checked ? 'true' : 'false');
    toast({ title: checked ? 'Auto-publicación activada' : 'Auto-publicación pausada' });
  };

  const handleToggleReviewMode = async (checked: boolean) => {
    setAutoSettings(prev => ({ ...prev, review_mode: checked }));
    await saveSetting('review_mode', checked ? 'true' : 'false');
    toast({ title: checked ? 'Modo revisión activado' : 'Modo revisión desactivado' });
  };

  const handleChangeArticlesPerDay = async (value: string) => {
    setAutoSettings(prev => ({ ...prev, articles_per_day: value }));
    await saveSetting('articles_per_day', value);
    toast({ title: `Artículos por día: ${value}` });
  };

  const autoArticles = articles.filter(a => a.is_auto_generated);
  const pendingReview = articles.filter(a => a.review_status === 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Blog & Newsletter</h1>
            <p className="text-muted-foreground mt-1">Gestiona artículos y publicación automática</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" /> Ajustes
            </Button>
            <Button variant="outline" onClick={handleGenerateNow} disabled={generating}>
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Bot className="h-4 w-4 mr-2" />}
              Generar ahora
            </Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nuevo artículo</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{articles.filter(a => a.status === 'published').length}</p>
            <p className="text-sm text-muted-foreground">Publicados</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{articles.filter(a => a.status === 'draft').length}</p>
            <p className="text-sm text-muted-foreground">Borradores</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{autoArticles.length}</p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Bot className="h-3 w-3" /> Auto-generados</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{pendingReview.length}</p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Clock className="h-3 w-3" /> Pendientes</p>
          </CardContent></Card>
          <Card><CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold">{subscribers.length}</p>
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1"><Users className="h-3 w-3" /> Suscriptores</p>
          </CardContent></Card>
        </div>

        {/* Pending Review */}
        {pendingReview.length > 0 && (
          <Card className="border-yellow-500/50">
            <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-yellow-500" /> Artículos pendientes de revisión</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingReview.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                    <div>
                      <p className="font-medium">{a.title}</p>
                      <p className="text-sm text-muted-foreground">{a.excerpt?.slice(0, 100)}...</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(a)}><Pencil className="h-3 w-3 mr-1" /> Editar</Button>
                      <Button size="sm" onClick={() => handleApprove(a.id)}><CheckCircle className="h-3 w-3 mr-1" /> Aprobar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles Table */}
        <Card>
          <CardHeader><CardTitle>Artículos</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium max-w-xs truncate">{a.title}</TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'published' ? 'default' : 'secondary'}>
                        {a.status === 'published' ? 'Publicado' : 'Borrador'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {a.is_auto_generated ? (
                        <Badge variant="outline" className="gap-1"><Bot className="h-3 w-3" /> Auto</Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell>{a.views_count}</TableCell>
                    <TableCell className="text-sm">{a.published_at ? new Date(a.published_at).toLocaleDateString('es-ES') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {a.review_status === 'pending' && (
                          <Button variant="ghost" size="icon" onClick={() => handleApprove(a.id)} title="Aprobar">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {a.status === 'published' && (
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/blog/${a.slug}`} target="_blank" rel="noopener noreferrer"><Eye className="h-4 w-4" /></a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Settings Dialog */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Ajustes de publicación automática</DialogTitle></DialogHeader>
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Auto-publicación</p>
                  <p className="text-sm text-muted-foreground">Genera y publica artículos automáticamente</p>
                </div>
                <Switch checked={autoSettings.auto_publish_enabled} onCheckedChange={handleToggleAutoPublish} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Modo revisión</p>
                  <p className="text-sm text-muted-foreground">Aprobar artículos antes de publicarlos</p>
                </div>
                <Switch checked={autoSettings.review_mode} onCheckedChange={handleToggleReviewMode} />
              </div>
              <div>
                <p className="font-medium mb-2">Artículos por día</p>
                <Select value={autoSettings.articles_per_day} onValueChange={handleChangeArticlesPerDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 artículo/día</SelectItem>
                    <SelectItem value="2">2 artículos/día</SelectItem>
                    <SelectItem value="3">3 artículos/día</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">Los artículos se generan a las 8:00, 14:00 y 20:00. El sistema respeta el límite diario configurado.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Article Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar artículo' : 'Nuevo artículo'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) })} />
              </div>
              <div>
                <label className="text-sm font-medium">Slug</label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Extracto</label>
                <Textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium">Contenido (Markdown)</label>
                <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={12} />
              </div>
              <div>
                <label className="text-sm font-medium">Imagen destacada (URL)</label>
                <Input value={form.featured_image} onChange={(e) => setForm({ ...form, featured_image: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoría</label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Estado</label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Borrador</SelectItem>
                      <SelectItem value="published">Publicado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Meta descripción</label>
                <Textarea value={form.meta_description} onChange={(e) => setForm({ ...form, meta_description: e.target.value })} rows={2} />
              </div>
              <div>
                <label className="text-sm font-medium">Palabras clave (separadas por coma)</label>
                <Input value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium">Autor</label>
                <Input value={form.author_name} onChange={(e) => setForm({ ...form, author_name: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave}>{editing ? 'Guardar cambios' : 'Crear artículo'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
