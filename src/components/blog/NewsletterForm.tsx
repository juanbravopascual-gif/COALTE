import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Mail, CheckCircle } from 'lucide-react';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      if (error.code === '23505') {
        toast({ title: '¡Ya estás suscrito!', description: 'Este email ya recibe nuestra newsletter.' });
      } else {
        toast({ title: 'Error', description: 'No se pudo completar la suscripción.', variant: 'destructive' });
      }
    } else {
      setSubscribed(true);
      toast({ title: '¡Suscripción exitosa!', description: 'Recibirás nuestras novedades cada semana.' });
    }

    setLoading(false);
  };

  if (subscribed) {
    return (
      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-6 text-center space-y-3">
          <CheckCircle className="h-10 w-10 text-accent mx-auto" />
          <h3 className="font-display text-lg font-semibold">¡Gracias por suscribirte!</h3>
          <p className="text-sm text-muted-foreground">Recibirás artículos, noticias y eventos sobre trabajo en Alicante.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Mail className="h-5 w-5 text-accent" />
          <h3 className="font-display text-lg font-semibold">Newsletter semanal</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Recibe artículos, noticias sobre emprendimiento y eventos del coworking en Alicante.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? '...' : 'Suscribir'}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground">Sin spam. Cancela cuando quieras.</p>
      </CardContent>
    </Card>
  );
}
