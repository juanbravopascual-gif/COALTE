import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { WhatsAppButton } from '@/components/WhatsAppButton';
import logoIcon from '@/assets/images/logo-coalte-black.png';
import {
  LayoutDashboard, Building, Calendar, FileText, CreditCard, Key, Users, Settings, LogOut, Menu, X, ChevronRight, Newspaper
} from 'lucide-react';

const clientNav = [
  { name: 'Panel', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Mi Espacio', href: '/dashboard/espacio', icon: Building },
  { name: 'Sala de Reuniones', href: '/dashboard/sala-reuniones', icon: Calendar },
  { name: 'Mi Perfil', href: '/dashboard/perfil', icon: Settings },
];

const adminNav = [
  { name: 'Panel Admin', href: '/admin', icon: LayoutDashboard },
  { name: 'Usuarios', href: '/admin/usuarios', icon: Users },
  { name: 'Sala de Reuniones', href: '/admin/sala-reuniones', icon: Calendar },
  { name: 'Blog', href: '/admin/blog', icon: Newspaper },
];

interface DashboardLayoutProps {
  children: ReactNode;
  isAdmin?: boolean;
}

export function DashboardLayout({ children, isAdmin = false }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut, isAdmin: userIsAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const nav = isAdmin ? adminNav : clientNav;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-secondary flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoIcon} alt="COALTE" className="h-8 w-auto" />
              <span className="font-display text-xl font-bold text-primary">COALTE</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {nav.map((item) => {
              const active = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}

            {/* Toggle between client/admin */}
            {userIsAdmin && (
              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  to={isAdmin ? '/dashboard' : '/admin'}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-accent/10 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                  {isAdmin ? 'Área Cliente' : 'Panel Admin'}
                </Link>
              </div>
            )}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="text-sm text-muted-foreground mb-3 truncate">{user?.email}</div>
            <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-card border-b border-border px-4 py-3 flex items-center gap-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-foreground">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1" />
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Volver a la web
          </Link>
        </header>
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
      <WhatsAppButton />
    </div>
  );
}
