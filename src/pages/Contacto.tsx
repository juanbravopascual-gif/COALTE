import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Instagram } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';

const contactInfo = [
  {
    icon: MapPin,
    title: 'Dirección',
    content: 'Marqués de Molins, 22\n03004 Alicante, España',
    href: 'https://maps.google.com/?q=Calle+Marqués+de+Molins+22+Alicante',
  },
  {
    icon: Phone,
    title: 'Teléfono',
    content: '+34 676 502 002',
    href: 'tel:+34676502002',
  },
  {
    icon: Mail,
    title: 'Email',
    content: 'info@coalte.eu',
    href: 'mailto:info@coalte.eu',
  },
  {
    icon: Clock,
    title: 'Horario',
    content: 'Abierto 24h\n365 días del año',
    href: null,
  },
  {
    icon: Instagram,
    title: 'Instagram',
    content: '@coalte_alicante',
    href: 'https://instagram.com/coalte_alicante',
  },
];

const interestOptions = [
  'Puesto de trabajo',
  'Despacho individual',
  'Despacho doble',
  'Despacho completo',
  'Sala de reuniones',
  'Sede fiscal',
  'Visita informativa',
  'Otro',
];

export default function Contacto() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast({
      title: '¡Mensaje enviado!',
      description: 'Te contactaremos lo antes posible.',
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte text-center">
          <h1 className="heading-display mb-6">Contacto</h1>
          <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
            ¿Tienes alguna pregunta o quieres visitar nuestras instalaciones? 
            Estamos aquí para ayudarte.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="font-display text-2xl font-semibold mb-6">
                Información de contacto
              </h2>
              
              <div className="space-y-6 mb-8">
                {contactInfo.map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <item.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1">{item.title}</h3>
                      {item.href ? (
                        <a
                          href={item.href}
                          target={item.href.startsWith('http') ? '_blank' : undefined}
                          rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                          className="text-muted-foreground hover:text-primary whitespace-pre-line transition-colors"
                        >
                          {item.content}
                        </a>
                      ) : (
                        <p className="text-muted-foreground whitespace-pre-line">
                          {item.content}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick contact buttons */}
              <div className="space-y-3">
                <Button className="w-full" variant="outline" asChild>
                  <a href="tel:+34676502002">
                    <Phone className="mr-2 h-4 w-4" />
                    Llamar ahora
                  </a>
                </Button>
                <Button className="w-full" variant="outline" asChild>
                  <a
                    href="https://wa.me/34676502002"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Escribir por WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-3">
              <div className="bg-card border border-border rounded-xl p-6 lg:p-8">
                <h2 className="font-display text-2xl font-semibold mb-6">
                  Envíanos un mensaje
                </h2>

                {isSubmitted ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-16 w-16 text-accent mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      ¡Gracias por contactarnos!
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Hemos recibido tu mensaje y te responderemos lo antes posible.
                    </p>
                    <Button onClick={() => setIsSubmitted(false)}>
                      Enviar otro mensaje
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nombre *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Tu nombre"
                          required
                          value={formData.name}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="tu@email.com"
                          required
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+34 600 000 000"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="interest">Me interesa *</Label>
                        <select
                          id="interest"
                          name="interest"
                          required
                          value={formData.interest}
                          onChange={handleChange}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <option value="">Selecciona una opción</option>
                          {interestOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mensaje *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Cuéntanos qué necesitas..."
                        rows={5}
                        required
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Al enviar este formulario aceptas nuestra{' '}
                      <a href="/privacidad" className="underline hover:text-primary">
                        política de privacidad
                      </a>
                      .
                    </p>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        'Enviando...'
                      ) : (
                        <>
                          Enviar mensaje
                          <Send className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-[400px]">
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
      </section>
    </Layout>
  );
}