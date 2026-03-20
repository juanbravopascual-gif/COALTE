import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';

import zonaTrabajo from '@/assets/images/zona-trabajo.jpg';
import salaReuniones from '@/assets/images/sala-reuniones.jpg';
import cocina from '@/assets/images/cocina-dining.jpg';
import terraza from '@/assets/images/terraza.jpg';
import despacho from '@/assets/images/despacho.jpg';
import bano from '@/assets/images/bano.jpg';
import logoPared from '@/assets/images/logo-pared-verde.jpg';
import plano from '@/assets/images/plano-distribucion.jpg';
import cocinaParedVerde from '@/assets/images/cocina-pared-verde.jpg';
import zonaTrabajoCoworking from '@/assets/images/zona-trabajo-coworking.jpg';
import despachoDobleMesa from '@/assets/images/despacho-doble-mesa.jpg';
import despachoGrandeReuniones from '@/assets/images/despacho-grande-reuniones.jpg';
import zonaTrabajoGrupo from '@/assets/images/zona-trabajo-grupo.jpg';
import despachoIndividualSillas from '@/assets/images/despacho-individual-sillas.jpg';
import terrazaLounge from '@/assets/images/terraza-lounge.jpg';

const spaces = [
  {
    title: 'Zona de trabajo',
    description: 'Amplio espacio diáfano con puestos de trabajo y excelente iluminación natural.',
    image: zonaTrabajo,
  },
  {
    title: 'Sala de reuniones',
    description: 'Sala equipada con TV para videoconferencias y mesa para 8-10 personas.',
    image: salaReuniones,
  },
  {
    title: 'Despacho completo',
    description: 'Oficina privada completamente equipada con escritorios para hasta 7 personas.',
    image: zonaTrabajoCoworking,
  },
  {
    title: 'Cocina & Dining Hall',
    description: 'Zona común completamente equipada con microondas, nevera, cafetera y área de descanso.',
    image: cocina,
  },
  {
    title: 'Despacho individual',
    description: 'Oficina privada con escritorio, sillas para visitas y estantería decorativa con plantas.',
    image: despachoIndividualSillas,
  },
  {
    title: 'Despachos privados',
    description: 'Oficinas independientes con todo el mobiliario necesario para trabajar cómodamente.',
    image: despacho,
  },
  {
    title: 'Terraza',
    description: 'Espacio exterior con césped artificial, mesas y zona lounge para desconectar.',
    image: terraza,
  },
  {
    title: 'Terraza lounge',
    description: 'Patio exterior con sofás, mesas y vistas al interior del coworking. Perfecto para pausas o networking.',
    image: terrazaLounge,
  },
  {
    title: 'Despacho doble',
    description: 'Despacho privado con mesa de trabajo para dos personas, estantería y zona de reunión auxiliar.',
    image: despachoDobleMesa,
  },
  {
    title: 'Despacho amplio',
    description: 'Oficina privada con dos puestos de trabajo independientes y mesa redonda para reuniones internas.',
    image: despachoGrandeReuniones,
  },
  {
    title: 'Despacho completo',
    description: 'Espacio de trabajo amplio ideal para equipos de hasta 6 personas.',
    image: zonaTrabajoGrupo,
  },
  {
    title: 'Aseo',
    description: 'Baño moderno y limpio, totalmente equipado para el confort de nuestros coworkers.',
    image: bano,
  },
];

export default function Espacio() {
  return (
    <Layout>
      {/* Hero con logo */}
      <section className="relative min-h-[50vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <img
            src={logoPared}
            alt="Logo COALTE"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-foreground/30" />
        </div>
        
        <div className="container-coalte relative z-10 text-center">
          <h1 className="heading-display text-primary-foreground mb-4">
            El espacio
          </h1>
          <p className="text-body-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Un lugar diseñado para inspirar productividad y bienestar. 
            Descubre cada rincón de COALTE.
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {spaces.map((space) => (
              <div
                key={`${space.title}-${space.image}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3]"
              >
                <img
                  src={space.image}
                  alt={space.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="font-display text-2xl font-semibold text-primary-foreground mb-2">
                    {space.title}
                  </h3>
                  <p className="text-primary-foreground/80">
                    {space.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Floor Plan */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">Distribución del espacio</h2>
            <p className="text-body-lg text-muted-foreground">
              Más de 300m² distribuidos en zona de trabajo, 
              11 despachos privados, sala de reuniones, cocina y terraza.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-card rounded-2xl border border-border p-4">
            <img
              src={plano}
              alt="Plano de distribución COALTE"
              className="w-full h-auto"
            />
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">16</div>
              <div className="text-muted-foreground">Puestos de trabajo</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">11</div>
              <div className="text-muted-foreground">Despachos privados</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">1</div>
              <div className="text-muted-foreground">Sala de reuniones</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">300m²</div>
              <div className="text-muted-foreground">Superficie total</div>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="heading-section mb-4">Todo incluido</h2>
            <p className="text-body-lg text-muted-foreground">
              Cada espacio incluye todo lo que necesitas para trabajar.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
            {[
              'WiFi alta velocidad',
              'Aire acondicionado',
              'Calefacción',
              'Cocina equipada',
              'Café y agua',
              'Terraza',
              'Limpieza diaria',
              'Acceso 24/7',
              'Seguridad',
              'Recepción correo',
            ].map((amenity) => (
              <div
                key={amenity}
                className="bg-secondary rounded-lg p-4 text-center text-sm font-medium"
              >
                {amenity}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding gradient-green text-primary-foreground">
        <div className="container-coalte text-center">
          <h2 className="heading-section mb-4">Ven a conocernos</h2>
          <p className="text-body-lg text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            La mejor forma de conocer el espacio es visitarnos. 
            Reserva una visita sin compromiso.
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