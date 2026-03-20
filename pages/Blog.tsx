import { useState, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Search, Calendar, Eye, ArrowRight, TrendingUp, Newspaper } from 'lucide-react';
import { NewsletterForm } from '@/components/blog/NewsletterForm';
import { useQuery } from '@tanstack/react-query';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  image_alt: string | null;
  meta_description: string;
  views_count: number;
  published_at: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const ARTICLES_SELECT = 'id, title, slug, excerpt, featured_image, meta_description, views_count, published_at, category_id' as const;

export default function Blog() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['blog-articles'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_articles')
        .select(ARTICLES_SELECT)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      return (data || []) as Article[];
    },
    staleTime: 5 * 60 * 1000, // 5 min cache
    gcTime: 10 * 60 * 1000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('blog_categories').select('id, name, slug');
      return (data || []) as Category[];
    },
    staleTime: 30 * 60 * 1000, // 30 min cache
  });

  const { data: popularArticles = [] } = useQuery({
    queryKey: ['blog-popular'],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_articles')
        .select(ARTICLES_SELECT)
        .eq('status', 'published')
        .order('views_count', { ascending: false })
        .limit(5);
      return (data || []) as Article[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filtered = articles.filter((a) => {
    const matchSearch = !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.excerpt.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !selectedCategory || a.category_id === selectedCategory;
    return matchSearch && matchCategory;
  });

  const getCategoryName = (catId: string | null) => {
    if (!catId) return '';
    return categories.find((c) => c.id === catId)?.name || '';
  };

  return (
    <Layout>
      {/* JSON-LD for Blog */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'Newsletter - Actualidad del Trabajo en Alicante',
            description: 'Artículos sobre coworking, emprendimiento, trabajo remoto y productividad en Alicante.',
            url: 'https://coaltecoworking.lovable.app/blog',
            publisher: {
              '@type': 'Organization',
              name: 'COALTE Coworking',
              url: 'https://coaltecoworking.lovable.app',
            },
          }),
        }}
      />

      {/* Hero */}
      <section className="gradient-green text-primary-foreground section-padding">
        <div className="container-coalte text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Newspaper className="h-8 w-8" />
            <Badge variant="secondary" className="text-sm px-4 py-1">Newsletter</Badge>
          </div>
          <h1 className="heading-display mb-6">
            Actualidad del Trabajo en Alicante
          </h1>
          <p className="text-body-lg max-w-3xl mx-auto opacity-90">
            Artículos, noticias y recursos sobre coworking, emprendimiento, trabajo remoto y productividad en Alicante.
          </p>
        </div>
      </section>

      <div className="container-coalte section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar artículos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 text-base"
              />
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>

            {/* Articles */}
            {isLoading ? (
              <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">No se encontraron artículos.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {filtered.map((article) => (
                  <Link key={article.id} to={`/blog/${article.slug}`} className="block group">
                    <Card className="overflow-hidden card-hover">
                      <div className="flex flex-col sm:flex-row">
                        {article.featured_image && (
                          <div className="sm:w-64 h-48 sm:h-auto flex-shrink-0">
                            <img
                              src={article.featured_image}
                              alt={article.image_alt || article.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              width={256}
                              height={192}
                            />
                          </div>
                        )}
                        <CardContent className="flex-1 p-6 flex flex-col justify-between">
                          <div>
                            {article.category_id && (
                              <Badge variant="secondary" className="mb-3 text-xs">
                                {getCategoryName(article.category_id)}
                              </Badge>
                            )}
                            <h2 className="font-display text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                              {article.title}
                            </h2>
                            <p className="text-muted-foreground text-sm line-clamp-2">{article.excerpt}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                {article.published_at
                                  ? new Date(article.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
                                  : ''}
                              </span>
                              <span className="flex items-center gap-1">
                                <Eye className="h-3.5 w-3.5" />
                                {article.views_count} lecturas
                              </span>
                            </div>
                            <span className="flex items-center gap-1 text-primary font-medium group-hover:gap-2 transition-all">
                              Leer más <ArrowRight className="h-3.5 w-3.5" />
                            </span>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            {/* CTA */}
            <Card className="gradient-green text-primary-foreground">
              <CardContent className="p-6 text-center space-y-4">
                <h3 className="font-display text-xl font-semibold">¿Buscas un espacio para trabajar?</h3>
                <p className="text-sm opacity-90">Descubre COALTE Coworking en Alicante</p>
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/sala-reuniones">Reservar sala de reuniones</Link>
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/servicios">Ver servicios</Link>
                  </Button>
                  <Button variant="secondary" size="sm" asChild>
                    <Link to="/contacto">Contactar</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Popular */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-accent" />
                  Más leídos
                </h3>
                <div className="space-y-4">
                  {popularArticles.map((article, idx) => (
                    <Link key={article.id} to={`/blog/${article.slug}`} className="flex gap-3 group">
                      <span className="text-2xl font-display font-bold text-muted-foreground/30">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                          {article.title}
                        </p>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Eye className="h-3 w-3" /> {article.views_count}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Newsletter */}
            <NewsletterForm />
          </aside>
        </div>
      </div>
    </Layout>
  );
}
