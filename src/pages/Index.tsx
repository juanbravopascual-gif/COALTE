import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Users, Calendar, Building, Wifi, Coffee, Shield, Clock, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

import heroImage from '@/assets/images/zona-trabajo.jpg';
import salaReuniones from '@/assets/images/sala-reuniones.jpg';
import cocina from '@/assets/images/cocina-dining.jpg';
import terraza from '@/assets/images/terraza.jpg';
import despacho from '@/assets/images/despacho.jpg';
import bano from '@/assets/images/bano.jpg';

const services = [
  {
    title: 'Puesto de trabajo',
    price: '110',
    unit: 'mes',
    description: 'Espacio en zona compartida con todas las comodidades',
    icon: Users,
  },
  {
    title: 'Despacho individual',
    price: '240',
    unit: 'mes',
    description: 'Tu oficina privada para trabajar con total concentración',
    icon: Building,
  },
  {
    title: 'Despacho doble',
    price: '290',
    unit: 'mes',
    description: 'Espacio privado para dos personas con escritorios independientes',
    icon: Building,
  },
  {
    title: 'Sala de reuniones',
    price: '10',
    unit: 'hora',
    description: 'Espacio profesional para tus reuniones y presentaciones',
    icon: Calendar,
    note: 'Para clientes (20€/h externos)',
  },
];

const advantages = [
  {
    icon: Wifi,
    title: 'Conexión de alta velocidad',
    description: 'Fibra óptica simétrica para trabajar sin límites',
  },
  {
    icon: Coffee,
    title: 'Zonas comunes',
    description: 'Cocina equipada, terraza y áreas de descanso',
  },
  {
    icon: Shield,
    title: 'Acceso 24/7',
    description: 'Entra cuando lo necesites con tu tarjeta personal',
  },
  {
    icon: Clock,
    title: 'Flexibilidad total',
    description: 'Sin permanencias ni compromisos a largo plazo',
  },
  {
    icon: MapPin,
    title: 'Ubicación céntrica',
    description: 'En el corazón de Alicante, bien comunicado',
  },
  {
    icon: Users,
    title: 'Comunidad profesional',
    description: 'Networking con otros profesionales del espacio',
  },
];

const spaceImages = [
  { src: salaReuniones, alt: 'Sala de reuniones COALTE', label: 'Sala de reuniones' },
  { src: cocina, alt: 'Cocina y zona común', label: 'Cocina & Dining' },
  { src: terraza, alt: 'Terraza exterior', label: 'Terraza' },
  { src: despacho, alt: 'Despacho privado', label: 'Despacho privado' },
  { src: heroImage, alt: 'Zona de trabajo', label: 'Zona de trabajo' },
  { src: bano, alt: 'Baño', label: 'Baño' },
];

const testimonials = [
  {
    name: 'María García López',
    role: 'Diseñadora UX/UI',
    company: 'Freelance',
    rating: 5,
    text: 'Después de probar varios coworkings en Alicante, COALTE es sin duda el mejor. El ambiente es profesional pero acogedor, y la terraza es perfecta para desconectar. Llevo ya 8 meses trabajando aquí y no me planteo irme.',
    avatar: 'MG',
  },
  {
    name: 'Carlos Ruiz Martínez',
    role: 'CEO',
    company: 'TechSolutions Alicante',
    rating: 5,
    text: 'Empecé con un puesto de trabajo y ahora tengo el despacho doble para mi equipo. La relación calidad-precio es excelente y la ubicación inmejorable. El wifi vuela y las instalaciones siempre están impecables.',
    avatar: 'CR',
  },
  {
    name: 'Laura Fernández Soto',
    role: 'Consultora de Marketing',
    company: 'LF Marketing',
    rating: 5,
    text: 'Lo que más valoro es la comunidad que se ha creado. He conseguido varios clientes gracias al networking informal en la cocina. Además, la sala de reuniones es perfecta para mis presentaciones con clientes.',
    avatar: 'LF',
  },
  {
    name: 'Javier Hernández',
    role: 'Desarrollador Full Stack',
    company: 'Remote Worker',
    rating: 5,
    text: 'Trabajar desde casa me estaba volviendo loco. En COALTE encontré el equilibrio perfecto: un espacio profesional donde concentrarme pero con la flexibilidad que necesito. El acceso 24/7 es un plus enorme.',
    avatar: 'JH',
  },
];

export default function Index() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={heroImage}
            alt="Espacio de coworking COALTE"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
        </div>
        
        <div className="container-coalte relative z-10">
          <div className="max-w-2xl text-primary-foreground">
            <h1 className="heading-display mb-6 animate-fade-in">
              Tu espacio de trabajo en Alicante
            </h1>
            <p className="text-body-lg text-primary-foreground/90 mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              Descubre un lugar diseñado para impulsar tu productividad. 
              Despachos privados, puestos flexibles y sala de reuniones 
              en un entorno profesional y acogedor.
            </p>
            <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <Button size="lg" asChild>
                <Link to="/contacto">
                  Solicitar información
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/sala-reuniones">
                  Reservar sala
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center gap-2 text-primary-foreground/80 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <MapPin className="h-5 w-5" />
              <span>Marqués de Molins, 22 - Alicante</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">Elige tu espacio ideal</h2>
            <p className="text-body-lg text-muted-foreground">
              Tenemos la opción perfecta para ti, desde puestos flexibles 
              hasta despachos privados completamente equipados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service) => (
              <div
                key={service.title}
                className="bg-card border border-border rounded-xl p-6 card-hover"
              >
                <service.icon className="h-10 w-10 text-accent mb-4" />
                <h3 className="font-display text-xl font-semibold mb-2">
                  {service.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {service.description}
                </p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-primary">{service.price}€</span>
                  <span className="text-muted-foreground">/{service.unit} + IVA</span>
                </div>
                {service.note && (
                  <p className="text-xs text-muted-foreground mt-2">{service.note}</p>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" size="lg" asChild>
              <Link to="/servicios">
                Ver todos los servicios
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Space Gallery */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">Conoce el espacio</h2>
            <p className="text-body-lg text-muted-foreground">
              Un ambiente moderno y profesional diseñado para que 
              te sientas cómodo mientras trabajas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spaceImages.map((image, index) => (
              <div 
                key={index}
                className="relative aspect-[4/3] rounded-xl overflow-hidden group"
              >
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <span className="font-medium text-sm">{image.label}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Button size="lg" asChild>
              <Link to="/espacio">
                Ver más fotos
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">Lo que dicen nuestros coworkers</h2>
            <p className="text-body-lg text-muted-foreground">
              Profesionales como tú ya han encontrado su espacio ideal en COALTE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-xl p-8 relative"
              >
                <Quote className="absolute top-6 right-6 h-10 w-10 text-accent/20" />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-accent font-semibold text-lg">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <h4 className="font-display font-semibold">{testimonial.name}</h4>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.company}</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>

                <p className="text-muted-foreground leading-relaxed">
                  "{testimonial.text}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">¿Por qué elegir COALTE?</h2>
            <p className="text-body-lg text-muted-foreground">
              Todo lo que necesitas para trabajar de forma productiva 
              en un espacio pensado para profesionales como tú.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {advantages.map((advantage) => (
              <div
                key={advantage.title}
                className="flex gap-4"
              >
                <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <advantage.icon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">
                    {advantage.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {advantage.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding gradient-green text-primary-foreground">
        <div className="container-coalte text-center">
          <h2 className="heading-section mb-4">
            ¿Listo para empezar?
          </h2>
          <p className="text-body-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Ven a conocer COALTE y descubre tu nuevo espacio de trabajo. 
            Te esperamos para enseñarte las instalaciones sin compromiso.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/contacto">
                Contactar ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
              asChild
            >
              <a href="tel:+34676502002">
                Llamar: 676 502 002
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}