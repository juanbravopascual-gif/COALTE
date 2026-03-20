import { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Eye, ArrowLeft, ArrowRight } from 'lucide-react';
import { NewsletterForm } from '@/components/blog/NewsletterForm';

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  meta_description: string;
  keywords: string[];
  author_name: string;
  views_count: number;
  published_at: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const queryClient = useQueryClient();

  const { data: article = null, isLoading: loading } = useQuery({
    queryKey: ['blog-article', slug],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_articles')
        .select('*')
        .eq('slug', slug!)
        .eq('status', 'published')
        .maybeSingle();
      if (data) {
        // Increment views (best effort)
        supabase.from('blog_articles').update({ views_count: (data.views_count || 0) + 1 } as any).eq('id', data.id).then(() => {});
      }
      return (data as Article) || null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });

  const { data: category = null } = useQuery({
    queryKey: ['blog-category', article?.category_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('id', article!.category_id!)
        .maybeSingle();
      return data as Category | null;
    },
    enabled: !!article?.category_id,
    staleTime: 30 * 60 * 1000,
  });

  const { data: relatedArticles = [] } = useQuery({
    queryKey: ['blog-related', article?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('blog_articles')
        .select('id, title, slug, excerpt, featured_image, meta_description, views_count, published_at, category_id')
        .eq('status', 'published')
        .neq('id', article!.id)
        .order('published_at', { ascending: false })
        .limit(3);
      return (data as Article[]) || [];
    },
    enabled: !!article?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Set meta tags
  useEffect(() => {
    if (!article) return;
    document.title = `${article.title} | COALTE Coworking Alicante`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', article.meta_description);
    else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = article.meta_description;
      document.head.appendChild(meta);
    }
    return () => {
      document.title = 'COALTE Coworking Alicante';
    };
  }, [article]);

  if (loading) {
    return (
      <Layout>
        <div className="container-coalte section-padding">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-12 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container-coalte section-padding text-center">
          <h1 className="heading-section mb-4">Artículo no encontrado</h1>
          <Button asChild>
            <Link to="/blog">Volver al blog</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  // Simple markdown-to-HTML conversion for content
  const renderContent = (content: string) => {
    return content
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('### ')) return <h3 key={i} className="font-display text-xl font-semibold mt-8 mb-3">{line.replace('### ', '')}</h3>;
        if (line.startsWith('## ')) return <h2 key={i} className="font-display text-2xl font-semibold mt-10 mb-4">{line.replace('## ', '')}</h2>;
        if (line.startsWith('- **')) {
          const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
          if (match) return <li key={i} className="ml-4 mb-2"><strong>{match[1]}</strong>{match[2] ? `: ${match[2]}` : ''}</li>;
        }
        if (line.startsWith('- ')) return <li key={i} className="ml-4 mb-1">{line.replace('- ', '')}</li>;
        if (line.match(/^\d+\.\s\*\*/)) {
          const match = line.match(/^\d+\.\s\*\*(.+?)\*\*\s*(.*)/);
          if (match) return <li key={i} className="ml-4 mb-2 list-decimal"><strong>{match[1]}</strong> {match[2]}</li>;
        }
        if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 mb-1 list-decimal">{line.replace(/^\d+\.\s/, '')}</li>;
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="mb-3 leading-relaxed">{line}</p>;
      });
  };

  return (
    <Layout>
      {/* Article JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: article.title,
            description: article.meta_description,
            author: { '@type': 'Organization', name: article.author_name },
            datePublished: article.published_at,
            publisher: {
              '@type': 'Organization',
              name: 'COALTE Coworking',
              url: 'https://coaltecoworking.lovable.app',
            },
            keywords: article.keywords?.join(', '),
          }),
        }}
      />

      <div className="container-coalte section-padding">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <div className="mb-8">
            <Link to="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver al blog
            </Link>
          </div>

          {/* Header */}
          <header className="mb-8">
            {category && (
              <Badge variant="secondary" className="mb-4">{category.name}</Badge>
            )}
            <h1 className="heading-section mb-4">{article.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.views_count} lecturas
              </span>
              <span>Por {article.author_name}</span>
            </div>
          </header>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="rounded-lg overflow-hidden mb-10">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-auto object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <article className="prose prose-lg max-w-none text-foreground">
            {renderContent(article.content)}
          </article>

          {/* CTA */}
          <Card className="gradient-green text-primary-foreground mt-12">
            <CardContent className="p-8 text-center space-y-4">
              <h2 className="font-display text-2xl font-semibold">
                ¿Buscas un lugar profesional para trabajar en Alicante?
              </h2>
              <p className="opacity-90">Descubre nuestro coworking: puestos flexibles, despachos privados y sala de reuniones.</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Button variant="secondary" asChild>
                  <Link to="/sala-reuniones">Reservar sala de reuniones</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/servicios">Contratar puesto de coworking</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/contacto">Contactar</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Keywords */}
          {article.keywords && article.keywords.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {article.keywords.map((kw, i) => (
                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
              ))}
            </div>
          )}

          {/* Newsletter */}
          <div className="mt-12">
            <NewsletterForm />
          </div>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display text-2xl font-semibold mb-6">Artículos relacionados</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {relatedArticles.map((ra) => (
                  <Link key={ra.id} to={`/blog/${ra.slug}`} className="group">
                    <Card className="overflow-hidden card-hover h-full">
                      {ra.featured_image && (
                        <div className="h-32 overflow-hidden">
                          <img src={ra.featured_image} alt={ra.title} className="w-full h-full object-cover" loading="lazy" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <h3 className="font-display text-sm font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {ra.title}
                        </h3>
                        <span className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                          Leer más <ArrowRight className="h-3 w-3" />
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
