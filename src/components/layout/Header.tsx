import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Phone, LogIn, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import logoIcon from '@/assets/images/logo-coalte-black.png';

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Servicios', href: '/servicios' },
  { name: 'El Espacio', href: '/espacio' },
  { name: 'Sala de Reuniones', href: '/sala-reuniones' },
  { name: 'Blog', href: '/blog' },
  { name: 'Ubicación', href: '/ubicacion' },
  { name: 'Contacto', href: '/contacto' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, loading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="container-coalte" aria-label="Global">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img 
              src={logoIcon} 
              alt="COALTE Logo" 
              className="h-12 md:h-14 w-auto"
            />
            <span className="font-display text-2xl md:text-3xl font-bold text-primary tracking-tight">
              COALTE
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  location.pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href="tel:+34676502002"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              <Phone className="h-4 w-4" />
              676 502 002
            </a>
            {!loading && (
              user ? (
                <Button asChild>
                  <Link to="/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Mi Panel
                  </Link>
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/login">
                    <LogIn className="h-4 w-4 mr-2" />
                    Acceder
                  </Link>
                </Button>
              )
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 -m-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="sr-only">Abrir menú</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-4">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-base font-medium py-2 transition-colors ${
                    location.pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-primary'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-border flex flex-col gap-3">
                <a
                  href="tel:+34676502002"
                  className="flex items-center gap-2 text-base font-medium text-muted-foreground"
                >
                  <Phone className="h-5 w-5" />
                  676 502 002
                </a>
                {!loading && (
                  user ? (
                    <Button asChild className="w-full">
                      <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                        <User className="h-4 w-4 mr-2" />
                        Mi Panel
                      </Link>
                    </Button>
                  ) : (
                    <Button asChild className="w-full">
                      <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                        <LogIn className="h-4 w-4 mr-2" />
                        Acceder
                      </Link>
                    </Button>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
