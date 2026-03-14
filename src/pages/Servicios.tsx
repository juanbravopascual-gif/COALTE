import { Link } from 'react-router-dom';
import { ArrowRight, Check, Users, Building, Calendar, Briefcase, Mail, Package, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

import zonaTrabajoImg from '@/assets/images/zona-trabajo.jpg';
import despachoIndividualImg from '@/assets/images/despacho-individual-final.jpg';
import despachoDobleImg from '@/assets/images/despacho-doble-final.jpg';
import despachoCompletoImg from '@/assets/images/despacho-completo-enhanced.jpg';

const services = [
  {
    id: 'puestos',
    icon: Users,
    title: 'Puesto de trabajo',
    subtitle: 'Espacio flexible en zona compartida',
    price: '90',
    unit: 'mes',
    image: zonaTrabajoImg,
    features: [
      'Escritorio propio en zona compartida',
      'Acceso 24/7 al espacio',
      'WiFi de alta velocidad',
      'Uso de zonas comunes',
      'Cocina equipada',
      'Sala de reuniones (1h gratis/mes)',
    ],
    popular: false,
  },
  {
    id: 'despacho-individual',
    icon: Building,
    title: 'Despacho individual',
    subtitle: 'Oficina privada para una persona',
    price: '240',
    unit: 'mes',
    image: despachoIndividualImg,
    features: [
      'Despacho privado con cerradura',
      'Mobiliario completo incluido',
      'Acceso 24/7 al espacio',
      'WiFi de alta velocidad',
      'Uso de zonas comunes',
      'Cocina equipada',
      'Sala de reuniones (2h gratis/mes)',
      'Domiciliación fiscal incluida',
    ],
    popular: true,
  },
  {
    id: 'despacho-doble',
    icon: Building,
    title: 'Despacho doble',
    subtitle: 'Espacio privado para dos personas',
    price: '290',
    unit: 'mes',
    image: despachoDobleImg,
    features: [
      'Despacho privado con 2 escritorios',
      'Mobiliario completo incluido',
      'Acceso 24/7 al espacio',
      'WiFi de alta velocidad',
      'Uso de zonas comunes',
      'Cocina equipada',
      'Sala de reuniones (3h gratis/mes)',
      'Domiciliación fiscal incluida',
    ],
    popular: false,
  },
  {
    id: 'despacho-completo',
    icon: Building,
    title: 'Despacho completo',
    subtitle: 'Gran espacio privado para equipos',
    price: '380',
    unit: 'mes',
    image: despachoCompletoImg,
    features: [
      'Despacho grande totalmente privado',
      'Capacidad para 3-4 personas',
      'Mobiliario a medida',
      'Acceso 24/7 al espacio',
      'WiFi de alta velocidad',
      'Sala de reuniones (4h gratis/mes)',
      'Domiciliación fiscal incluida',
      'Recepción de paquetería',
    ],
    popular: false,
  },
];

// Additional services data not needed - using inline JSX

export default function Servicios() {
  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte text-center">
          <h1 className="heading-display mb-6">Nuestros servicios</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentra el espacio perfecto para tu forma de trabajar. 
            Desde puestos flexibles hasta despachos privados, 
            tenemos la solución que necesitas.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                id={service.id}
                className={`relative bg-card border rounded-2xl overflow-hidden card-hover ${
                  service.popular ? 'border-accent ring-2 ring-accent/20' : 'border-border'
                }`}
              >
                {service.popular && (
                  <div className="absolute top-4 right-4 bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium z-10">
                    Más popular
                  </div>
                )}
                
                <div className="aspect-[16/9] relative">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                </div>
                
                <div className="p-6 lg:p-8">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                      <service.icon className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h2 className="font-display text-2xl font-semibold">
                        {service.title}
                      </h2>
                      <p className="text-muted-foreground">{service.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-primary">{service.price}€</span>
                    <span className="text-muted-foreground">/{service.unit} + IVA</span>
                  </div>

                  <ul className={`space-y-3 mb-6 ${service.id === 'puestos' ? 'pb-[72px]' : ''}`}>
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className="w-full" size="lg" asChild>
                    <Link to="/contacto">
                      Solicitar información
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Services - Redesigned */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">Servicios adicionales</h2>
            <p className="text-body-lg text-muted-foreground">
              Complementa tu espacio de trabajo con estos servicios extra.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Sala de reuniones */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden card-hover p-6 lg:p-8 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold">Sala de reuniones</h3>
                  <p className="text-muted-foreground">Equipada con TV y pizarra · 8-10 personas</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Clientes</p>
                  <p className="text-2xl font-bold text-primary">10€<span className="text-sm font-normal text-muted-foreground">/h</span></p>
                </div>
                <div className="bg-secondary/50 rounded-xl p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Externos</p>
                  <p className="text-2xl font-bold text-primary">20€<span className="text-sm font-normal text-muted-foreground">/h</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-accent/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent" />
                  <span className="text-sm font-medium">Día completo</span>
                </div>
                <span className="font-bold text-primary">80€ <span className="text-sm font-normal text-muted-foreground">IVA incl.</span></span>
              </div>

              <div className="flex-grow" />

              <Button className="w-full" size="lg" asChild>
                <Link to="/sala-reuniones">
                  Reservar ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>

            {/* Domiciliación Fiscal */}
            <div id="domiciliacion" className="bg-card border border-accent ring-2 ring-accent/20 rounded-2xl overflow-hidden card-hover p-6 lg:p-8 flex flex-col h-full">
              <div className="flex items-start gap-4 mb-4">
                <div className="shrink-0 w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Briefcase className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-semibold">Domiciliación de Sociedades</h3>
                  <p className="text-muted-foreground">Dirección fiscal para tu empresa</p>
                </div>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-primary">30€</span>
                <span className="text-muted-foreground">/mes + IVA</span>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-muted-foreground">Dirección fiscal legal</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-muted-foreground">Recepción de correo postal</span>
                </li>
                <li className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="h-4 w-4 text-accent" />
                  </div>
                  <span className="text-muted-foreground">Gestión de paquetería</span>
                </li>
              </ul>

              <Button className="w-full mt-auto" size="lg" asChild>
                <Link to="/contacto">
                  Solicitar información
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding gradient-green text-primary-foreground">
        <div className="container-coalte text-center">
          <h2 className="heading-section mb-4">¿Tienes dudas?</h2>
          <p className="text-body-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Contáctanos y te ayudaremos a encontrar la opción 
            que mejor se adapte a tus necesidades.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/contacto">
              Contactar ahora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}