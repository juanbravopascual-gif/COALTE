import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/Layout';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPassword } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSent(true);
    }
  };

  return (
    <Layout>
      <section className="section-padding bg-secondary min-h-[80vh] flex items-center">
        <div className="container-coalte max-w-md mx-auto">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
            {sent ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-8 w-8 text-accent" />
                </div>
                <h1 className="font-display text-3xl font-semibold mb-4">Email enviado</h1>
                <p className="text-muted-foreground mb-6">
                  Si existe una cuenta con <strong>{email}</strong>, recibirás un enlace para restablecer tu contraseña.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/login"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al login</Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <h1 className="font-display text-3xl font-semibold mb-2">Recuperar contraseña</h1>
                  <p className="text-muted-foreground">Te enviaremos un enlace para restablecerla</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" required className="mt-1" />
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Enviando...' : 'Enviar enlace'}
                  </Button>
                </form>
                <p className="text-center mt-6 text-sm text-muted-foreground">
                  <Link to="/login" className="text-accent hover:underline"><ArrowLeft className="inline h-4 w-4 mr-1" />Volver al login</Link>
                </p>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
