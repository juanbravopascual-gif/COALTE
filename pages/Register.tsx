import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { Eye, EyeOff, UserPlus } from 'lucide-react';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: 'Las contraseñas no coinciden', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' });
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    setLoading(false);

    if (error) {
      toast({ title: 'Error al registrarse', description: error.message, variant: 'destructive' });
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <Layout>
        <section className="section-padding bg-secondary min-h-[80vh] flex items-center">
          <div className="container-coalte max-w-md mx-auto">
            <div className="bg-card border border-border rounded-2xl p-8 shadow-lg text-center">
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserPlus className="h-8 w-8 text-accent" />
              </div>
              <h1 className="font-display text-3xl font-semibold mb-4">¡Registro exitoso!</h1>
              <p className="text-muted-foreground mb-6">
                Hemos enviado un email de confirmación a <strong>{email}</strong>. 
                Por favor, revisa tu bandeja de entrada y confirma tu cuenta.
              </p>
              <Button asChild>
                <Link to="/login">Ir al login</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="section-padding bg-secondary min-h-[80vh] flex items-center">
        <div className="container-coalte max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
              <h1 className="font-display text-3xl font-semibold mb-2">Crear cuenta</h1>
              <p className="text-muted-foreground">Únete a COALTE Coworking</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative mt-1">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repite tu contraseña" required className="mt-1" />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? 'Registrando...' : 'Crear cuenta'}
                <UserPlus className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-accent font-medium hover:underline">Inicia sesión</Link>
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
