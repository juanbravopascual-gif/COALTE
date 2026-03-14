import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Car, Train, Bus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

const transportOptions = [
  {
    icon: Car,
    title: 'En coche',
    description: 'Parking público a 2 minutos. Zona azul en los alrededores.',
  },
  {
    icon: Train,
    title: 'TRAM',
    description: 'Parada Mercado a 5 minutos andando.',
  },
  {
    icon: Bus,
    title: 'Autobús',
    description: 'Líneas 01, 02, 03, 22 con parada cercana.',
  },
];

const advantages = [
  'Centro de Alicante',
  'Zona comercial',
  'Restaurantes cerca',
  'Bien comunicado',
  'Parking próximo',
  'Ambiente seguro',
];

export default function Ubicacion() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="heading-display mb-6">Ubicación</h1>
            <p className="text-body-lg text-muted-foreground">
              En el corazón de Alicante, perfectamente comunicado 
              y rodeado de servicios.
            </p>
          </div>
        </div>
      </section>

      {/* Map and Address */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Map */}
            <div className="aspect-square lg:aspect-auto lg:h-full min-h-[400px] rounded-xl overflow-hidden border border-border">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3128.7961461755876!2d-0.48731502357368!3d38.34531397190655!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd623762be80e0e9%3A0x7a9f1c8c9cd8c8c4!2sC.%20Marqu%C3%A9s%20de%20Molins%2C%2022%2C%2003004%20Alicante%20(Alacant)%2C%20Alicante!5e0!3m2!1ses!2ses!4v1705000000000!5m2!1ses!2ses"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación COALTE"
              />
            </div>

            {/* Address Details */}
            <div>
              <div className="bg-card border border-border rounded-xl p-6 lg:p-8 mb-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="font-display text-2xl font-semibold mb-2">
                      Dirección
                    </h2>
                    <p className="text-lg text-muted-foreground">
                      Calle Marqués de Molins, 22<br />
                      03004 Alicante, España
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-semibold mb-2">
                      Horario de atención
                    </h3>
                    <p className="text-muted-foreground">
                      Lunes a Viernes: 08:00 - 20:00<br />
                      <span className="text-sm">(Acceso 24/7 para clientes)</span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <Button className="w-full" size="lg" asChild>
                    <a
                      href="https://maps.google.com/?q=Calle+Marqués+de+Molins+22+Alicante"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir en Google Maps
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                </div>
              </div>

              {/* Transport */}
              <div className="space-y-4">
                <h3 className="font-display text-xl font-semibold">
                  Cómo llegar
                </h3>
                {transportOptions.map((option) => (
                  <div
                    key={option.title}
                    className="flex items-start gap-4 p-4 bg-secondary rounded-lg"
                  >
                    <option.icon className="h-6 w-6 text-accent shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium">{option.title}</h4>
                      <p className="text-muted-foreground text-sm">
                        {option.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Advantages */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">
              Ventajas de nuestra ubicación
            </h2>
            <p className="text-body-lg text-muted-foreground">
              Un punto estratégico para tu negocio en el centro de Alicante.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {advantages.map((advantage) => (
              <div
                key={advantage}
                className="bg-card border border-border rounded-lg p-4 text-center font-medium"
              >
                {advantage}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding gradient-green text-primary-foreground">
        <div className="container-coalte text-center">
          <h2 className="heading-section mb-4">Ven a visitarnos</h2>
          <p className="text-body-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Conoce nuestras instalaciones en persona. 
            Te esperamos para enseñarte el espacio sin compromiso.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/contacto">
              Programar visita
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}