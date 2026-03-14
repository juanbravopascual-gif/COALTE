
-- Blog categories
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.blog_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Blog articles
CREATE TABLE public.blog_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  featured_image text DEFAULT '',
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  meta_description text DEFAULT '',
  keywords text[] DEFAULT '{}',
  author_name text DEFAULT 'COALTE Coworking',
  status text NOT NULL DEFAULT 'draft',
  views_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published articles" ON public.blog_articles FOR SELECT USING (status = 'published');
CREATE POLICY "Admins can manage all articles" ON public.blog_articles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Newsletter subscribers
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can manage subscribers" ON public.newsletter_subscribers FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
('Coworking', 'coworking', 'Todo sobre coworking y espacios de trabajo compartidos'),
('Emprendimiento', 'emprendimiento', 'Startups, creación de empresas y emprender en Alicante'),
('Trabajo Remoto', 'trabajo-remoto', 'Tendencias y consejos sobre trabajo remoto y freelancing'),
('Productividad', 'productividad', 'Hábitos y técnicas para mejorar la productividad'),
('Networking', 'networking', 'Networking profesional y comunidad'),
('Eventos', 'eventos', 'Eventos profesionales en Alicante'),
('Tecnología', 'tecnologia', 'Innovación empresarial y tecnología aplicada al trabajo'),
('Alicante', 'alicante', 'Vivir y trabajar en Alicante');

-- Insert seed articles
INSERT INTO public.blog_articles (title, slug, excerpt, content, category_id, meta_description, keywords, status, published_at, views_count) VALUES
(
  'Las 5 ventajas de trabajar en un coworking frente a hacerlo desde casa',
  'ventajas-coworking-vs-casa',
  'Descubre por qué cada vez más profesionales en Alicante eligen un espacio de coworking para potenciar su productividad y networking.',
  '## ¿Por qué elegir un coworking?

Trabajar desde casa puede parecer cómodo al principio, pero con el tiempo, muchos profesionales descubren que la falta de separación entre vida personal y laboral afecta su productividad.

### 1. Separación vida-trabajo

Un espacio de coworking te permite establecer límites claros. Al salir de casa para ir a trabajar, tu cerebro entra en "modo trabajo", mejorando tu concentración y rendimiento.

### 2. Networking natural

En un coworking como COALTE, compartes espacio con otros profesionales. Las conversaciones en la zona común pueden convertirse en colaboraciones, clientes o amistades profesionales.

### 3. Infraestructura profesional

Sala de reuniones, internet de alta velocidad, impresora, cocina equipada... Todo lo que necesitas sin invertir en montarlo tú mismo.

### 4. Imagen profesional

Tener una dirección fiscal profesional y un espacio donde recibir clientes transmite confianza y seriedad.

### 5. Motivación y comunidad

Rodearte de personas que también están construyendo sus proyectos es una fuente constante de motivación e inspiración.

## ¿Buscas un coworking en Alicante?

En COALTE Coworking ofrecemos puestos flexibles, fijos y despachos privados en pleno centro de Alicante. ¡Ven a conocernos!',
  (SELECT id FROM public.blog_categories WHERE slug = 'coworking'),
  'Descubre las 5 principales ventajas de trabajar en un coworking en Alicante frente a trabajar desde casa. Productividad, networking y más.',
  ARRAY['coworking en Alicante', 'ventajas coworking', 'trabajar en Alicante', 'espacios de trabajo compartidos'],
  'published',
  now() - interval '2 days',
  45
),
(
  'Guía completa para emprender en Alicante en 2025',
  'guia-emprender-alicante-2025',
  'Todo lo que necesitas saber para montar tu empresa en Alicante: trámites, ayudas, espacios y consejos de otros emprendedores.',
  '## Emprender en Alicante: una ciudad con oportunidades

Alicante se ha convertido en uno de los destinos favoritos para emprendedores, tanto nacionales como internacionales. Su clima, calidad de vida y ecosistema emprendedor en crecimiento la hacen ideal.

### Trámites básicos para crear tu empresa

1. **Certificación negativa del nombre** en el Registro Mercantil
2. **Apertura de cuenta bancaria** y depósito del capital social
3. **Escritura pública** ante notario
4. **Inscripción en el Registro Mercantil**
5. **Alta en Hacienda** (modelos 036/037)
6. **Alta en la Seguridad Social**

### Ayudas y subvenciones

El Ayuntamiento de Alicante y la Generalitat Valenciana ofrecen diversas ayudas para nuevos emprendedores. Consulta el portal LABORA para las últimas convocatorias.

### Tu base de operaciones

Un coworking como COALTE te ofrece la flexibilidad que necesitas al empezar: sin compromisos a largo plazo, con una dirección fiscal profesional y acceso a sala de reuniones.

## Da el primer paso

Visita COALTE Coworking y encuentra el espacio perfecto para lanzar tu proyecto en Alicante.',
  (SELECT id FROM public.blog_categories WHERE slug = 'emprendimiento'),
  'Guía completa para emprender en Alicante en 2025. Trámites, ayudas, espacios de coworking y consejos para nuevos emprendedores.',
  ARRAY['emprender en Alicante', 'crear empresa Alicante', 'startups Alicante', 'oficina flexible'],
  'published',
  now() - interval '5 days',
  78
),
(
  'Trabajo remoto en Alicante: por qué los nómadas digitales eligen esta ciudad',
  'trabajo-remoto-alicante-nomadas-digitales',
  'Alicante se posiciona como destino top para nómadas digitales. Descubre qué la hace tan atractiva para el trabajo remoto.',
  '## Alicante, destino de nómadas digitales

Con más de 300 días de sol al año, una excelente conexión por AVE y aeropuerto internacional, y un coste de vida competitivo, Alicante atrae cada vez a más profesionales remotos de todo el mundo.

### Lo que ofrece Alicante

- **Clima excepcional**: Trabaja con luz natural todo el año
- **Coste de vida**: Más asequible que Barcelona o Madrid
- **Conectividad**: AVE a Madrid en 2h, vuelos directos a toda Europa
- **Gastronomía**: La dieta mediterránea a tu alcance
- **Playa y naturaleza**: A minutos de tu espacio de trabajo

### Espacios para trabajar

Los coworkings en Alicante han crecido para dar respuesta a esta demanda. En COALTE ofrecemos puestos flexibles ideales para nómadas digitales que necesitan un espacio profesional sin compromisos largos.

### Comunidad internacional

La comunidad de trabajadores remotos en Alicante es activa y acogedora. Meetups, eventos de networking y espacios compartidos facilitan la integración.

## ¿Eres nómada digital?

Prueba COALTE Coworking: tu espacio de trabajo profesional en el centro de Alicante.',
  (SELECT id FROM public.blog_categories WHERE slug = 'trabajo-remoto'),
  'Descubre por qué Alicante es el destino ideal para nómadas digitales y trabajadores remotos. Clima, coste de vida y espacios de coworking.',
  ARRAY['trabajo remoto Alicante', 'nómadas digitales Alicante', 'coworking en Alicante', 'trabajar en Alicante'],
  'published',
  now() - interval '1 day',
  120
),
(
  '7 hábitos de productividad para freelancers que trabajan en coworking',
  'habitos-productividad-freelancers-coworking',
  'Maximiza tu rendimiento como freelancer con estos 7 hábitos probados por profesionales que trabajan en espacios de coworking.',
  '## Productividad en el coworking

Ser freelancer requiere disciplina. Un espacio de coworking te da la estructura, pero tus hábitos determinan tu éxito.

### 1. Establece horarios fijos
Aunque la flexibilidad es una ventaja, tener horarios consistentes mejora tu rendimiento.

### 2. Usa la técnica Pomodoro
25 minutos de trabajo intenso, 5 de descanso. Repite. Es simple y funciona.

### 3. Aprovecha las zonas comunes
Las pausas en la cocina o terraza no son tiempo perdido: recargan tu energía y fomentan conexiones.

### 4. Planifica tu semana los domingos
Dedica 30 minutos cada domingo a planificar tus objetivos semanales.

### 5. Minimiza las distracciones digitales
Usa bloqueadores de apps y pon el móvil en modo no molestar durante las horas de trabajo profundo.

### 6. Networking estratégico
No se trata de hablar con todos, sino de construir relaciones genuinas con personas que complementen tu trabajo.

### 7. Cuida tu espacio
Un escritorio ordenado es una mente ordenada. Aprovecha las ventajas de tener un puesto fijo en el coworking.

## Tu espacio te espera

En COALTE Coworking encontrarás el ambiente perfecto para ser tu versión más productiva.',
  (SELECT id FROM public.blog_categories WHERE slug = 'productividad'),
  '7 hábitos de productividad para freelancers en espacios de coworking. Mejora tu rendimiento y aprovecha al máximo tu espacio de trabajo.',
  ARRAY['productividad freelancer', 'coworking en Alicante', 'hábitos de trabajo', 'espacios de trabajo compartidos'],
  'published',
  now() - interval '7 days',
  62
);
