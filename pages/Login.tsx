import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, isAdmin, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      toast({
        title: 'Error al iniciar sesión',
        description: error.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : error.message,
        variant: 'destructive',
      });
    } else {
      // Check role after sign-in to redirect appropriately
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '');
      const userRoles = roles?.map(r => r.role) || [];
      const hasAdminAccess = userRoles.includes('super_admin') || userRoles.includes('admin') || userRoles.includes('manager');
      navigate(hasAdminAccess ? '/admin' : '/dashboard');
    }
  };

  return (
    <Layout>
      <section className="section-padding bg-secondary min-h-[80vh] flex items-center">
        <div className="container-coalte max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-semibold mb-2">Iniciar sesión</h1>
              <p className="text-muted-foreground">Accede a tu área privada</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm text-accent hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                <LogIn className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-accent font-medium hover:underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
