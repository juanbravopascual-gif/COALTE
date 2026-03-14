import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react';

const navigation = {
  main: [
    { name: 'Inicio', href: '/' },
    { name: 'Servicios', href: '/servicios' },
    { name: 'El Espacio', href: '/espacio' },
    { name: 'Sala de Reuniones', href: '/sala-reuniones' },
    { name: 'Ubicación', href: '/ubicacion' },
    { name: 'Contacto', href: '/contacto' },
  ],
  services: [
    { name: 'Puestos de trabajo', href: '/servicios#puestos' },
    { name: 'Despachos privados', href: '/servicios#despachos' },
    { name: 'Sala de reuniones', href: '/sala-reuniones' },
    { name: 'Sede fiscal', href: '/servicios#sede' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-coalte section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-block">
              <span className="font-display text-3xl font-bold">COALTE</span>
            </Link>
            <p className="mt-4 text-primary-foreground/80 leading-relaxed">
              Tu espacio de coworking en el corazón de Alicante. Un lugar 
              diseñado para impulsar tu productividad y creatividad.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Navegación</h3>
            <ul className="space-y-3">
              {navigation.main.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Servicios</h3>
            <ul className="space-y-3">
              {navigation.services.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-4">Contacto</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 mt-0.5 shrink-0" />
                <span className="text-primary-foreground/80">
                  Marqués de Molins, 22<br />
                  03004 Alicante, España
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 shrink-0" />
                <a
                  href="tel:+34676502002"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  +34 676 502 002
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 shrink-0" />
                <a
                  href="mailto:info@coalte.eu"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  info@coalte.eu
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="h-5 w-5 mt-0.5 shrink-0" />
                <span className="text-primary-foreground/80">
                  Abierto 24h<br />
                  365 días del año
              </span>
              </li>
              <li className="flex items-center gap-3">
                <Instagram className="h-5 w-5 shrink-0" />
                <a
                  href="https://instagram.com/coalte_alicante"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  @coalte_alicante
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/60 text-sm">
              © {new Date().getFullYear()} COALTE Coworking. Todos los derechos reservados.
            </p>
            <div className="flex gap-6 text-sm">
              <Link
                to="/privacidad"
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link
                to="/legal"
                className="text-primary-foreground/60 hover:text-primary-foreground transition-colors"
              >
                Aviso Legal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}