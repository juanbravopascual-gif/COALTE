import { useState, useEffect } from 'react';
import { format, addDays, isBefore, isToday, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Users, Wifi, Monitor, Coffee, CreditCard, Check, Phone } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import salaReuniones from '@/assets/images/sala-reuniones.jpg';
import MeetingRoomAvailabilityCalendar from '@/components/MeetingRoomAvailabilityCalendar';

const HOURLY_RATE = 20;
const MAX_PRICE = 80;
const MIN_HOURS = 2;

const calculatePrice = (hours: number): number => {
  if (hours <= 0) return 0;
  const total = hours * HOURLY_RATE;
  return Math.min(total, MAX_PRICE);
};

const features = [
  { icon: Users, text: 'Capacidad 8 personas' },
  { icon: Wifi, text: 'WiFi de alta velocidad' },
  { icon: Monitor, text: 'Pantalla 55" con HDMI' },
  { icon: Coffee, text: 'Servicio de café incluido' },
];

const includes = [
  'Pizarra y rotuladores',
  'Aire acondicionado',
  'Luz natural',
  'Proyector opcional',
  'Videoconferencia',
  'Acceso 24h',
];

const timeSlots = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

export default function SalaReuniones() {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    notes: '',
  });

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('meeting_room_bookings')
      .select('id, booking_date, start_time, end_time, status')
      .eq('status', 'confirmed');
    
    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setExistingBookings(data || []);
    }
    setIsLoading(false);
  };

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return existingBookings.some(booking => {
      if (booking.booking_date !== dateStr) return false;
      const startHour = parseInt(booking.start_time.split(':')[0]);
      const endHour = parseInt(booking.end_time.split(':')[0]);
      const slotHour = parseInt(time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const isDayFullyBooked = (date: Date) => {
    return timeSlots.every(time => isSlotBooked(date, time));
  };

  const toggleHour = (time: string) => {
    if (isSlotBooked(selectedDate, time)) return;
    setSelectedHours(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time].sort()
    );
  };

  const getBookingTimes = () => {
    if (selectedHours.length === 0) return null;
    const sorted = [...selectedHours].sort();
    const startHour = parseInt(sorted[0].split(':')[0]);
    const endHour = parseInt(sorted[sorted.length - 1].split(':')[0]) + 1;
    return { start: sorted[0], end: `${endHour.toString().padStart(2, '0')}:00` };
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.name || formData.name.length < 2 || formData.name.length > 100) {
      errors.push('El nombre debe tener entre 2 y 100 caracteres');
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Email no válido');
    }
    const phoneClean = formData.phone.replace(/[\s\-]/g, '');
    if (!/^\+?[0-9]{9,15}$/.test(phoneClean)) {
      errors.push('Teléfono debe tener entre 9-15 dígitos');
    }
    if (formData.company && formData.company.length > 100) {
      errors.push('Nombre de empresa demasiado largo (max 100)');
    }
    if (formData.notes && formData.notes.length > 500) {
      errors.push('Notas demasiado largas (max 500 caracteres)');
    }
    if (selectedHours.length < MIN_HOURS) {
      errors.push(`Debes seleccionar al menos ${MIN_HOURS} horas`);
    }
    if (errors.length > 0) {
      toast({ title: 'Errores de validación', description: errors.join('. '), variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    const times = getBookingTimes();
    if (!times) return;

    setIsSubmitting(true);
    try {
      const totalPrice = calculatePrice(selectedHours.length);

      const { error: dbError } = await supabase
        .from('meeting_room_bookings')
        .insert({
          client_name: formData.name,
          client_email: formData.email,
          client_phone: formData.phone,
          client_company: formData.company || null,
          booking_date: format(selectedDate, 'yyyy-MM-dd'),
          start_time: times.start,
          end_time: times.end,
          booking_type: 'hourly',
          hours: selectedHours.length,
          total_price: totalPrice,
          payment_method: 'transfer',
          status: 'pending',
          notes: formData.notes || null,
        });

      if (dbError) throw dbError;

      // Send notification
      try {
        const { data: notifData } = await supabase.functions.invoke('send-booking-notification', {
          body: {
            clientName: formData.name,
            clientEmail: formData.email,
            clientPhone: formData.phone,
            clientCompany: formData.company,
            bookingDate: format(selectedDate, 'yyyy-MM-dd'),
            startTime: times.start,
            endTime: times.end,
            bookingType: 'hourly',
            hours: selectedHours.length,
            totalPrice,
            notes: formData.notes,
          },
        });
        if (notifData?.whatsappUrl) {
          window.open(notifData.whatsappUrl, '_blank');
        }
      } catch (notifErr) {
        console.error('Notification error:', notifErr);
      }

      toast({
        title: '¡Solicitud de reserva enviada!',
        description: 'Tu reserva está pendiente de validación por el administrador. Te confirmaremos por email.',
      });

      setShowForm(false);
      setSelectedHours([]);
      setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
      fetchBookings();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({ title: 'Error', description: 'No se pudo procesar la reserva. Inténtalo de nuevo.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const generateCalendarDays = () => {
    const days = [];
    for (let i = 0; i < 14; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative min-h-[50vh] sm:min-h-[400px] flex items-center py-16 sm:py-0">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${salaReuniones})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="container-coalte relative z-10 text-white px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium mb-4">
              Reserva Online
            </span>
            <h1 className="heading-display mb-4 text-3xl sm:text-4xl lg:text-5xl">Sala de Reuniones</h1>
            <p className="text-lg sm:text-xl text-white/90 mb-6">
              Espacio profesional para tus reuniones, presentaciones y eventos. Totalmente equipada y disponible 24 horas.
            </p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-sm sm:text-base">20€/hora</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-lg">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-semibold text-sm sm:text-base">Máx. 80€ (+4h)</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-3 py-2 rounded-lg">
                <span className="text-xs sm:text-sm">IVA incluido · Mín. 2h</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 bg-background p-4 rounded-xl">
                <div className="shrink-0 w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="h-5 w-5 text-accent" />
                </div>
                <span className="font-medium text-sm">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking System */}
      <section id="booking-section" className="section-padding bg-background">
        <div className="container-coalte">
          <div className="text-center mb-12">
            <h2 className="heading-section mb-4">Reserva tu sala</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Selecciona la fecha y el horario que necesitas (mínimo 2 horas). 
              Tu reserva será validada por nuestro equipo antes de confirmarse.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Pricing info */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <h3 className="font-display text-base sm:text-lg font-semibold mb-4">Tarifas</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">2 horas</p>
                    <p className="text-xl font-bold text-accent">40€</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">3 horas</p>
                    <p className="text-xl font-bold text-accent">60€</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">4 horas</p>
                    <p className="text-xl font-bold text-accent">80€</p>
                  </div>
                  <div className="bg-secondary rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">+4 horas</p>
                    <p className="text-xl font-bold text-accent">80€</p>
                    <p className="text-xs text-muted-foreground">máximo</p>
                  </div>
                </div>
              </div>

              {/* Date selector */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <h3 className="font-display text-base sm:text-lg font-semibold mb-4">Selecciona fecha</h3>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {calendarDays.map((day) => {
                    const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day);
                    const isFullyBooked = isDayFullyBooked(day);
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => { setSelectedDate(day); setSelectedHours([]); }}
                        disabled={isPast || isFullyBooked}
                        className={`shrink-0 w-14 sm:w-16 p-2 sm:p-3 rounded-xl text-center transition-all ${
                          isSelected 
                            ? 'bg-accent text-accent-foreground' 
                            : isPast || isFullyBooked
                              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                              : existingBookings.some(b => b.booking_date === format(day, 'yyyy-MM-dd'))
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                : 'bg-secondary hover:bg-accent/20'
                        }`}
                      >
                        <div className="text-xs uppercase opacity-70">{format(day, 'EEE', { locale: es })}</div>
                        <div className="text-lg font-bold">{format(day, 'd')}</div>
                        <div className="text-xs opacity-70">{format(day, 'MMM', { locale: es })}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
                <h3 className="font-display text-base sm:text-lg font-semibold mb-2">
                  Selecciona horario - {format(selectedDate, "d 'de' MMMM", { locale: es })}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">Selecciona mínimo {MIN_HOURS} horas. Solo se reservan las horas seleccionadas.</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                  {timeSlots.map((time) => {
                    const isBooked = isSlotBooked(selectedDate, time);
                    const isSelected = selectedHours.includes(time);
                    
                    return (
                      <button
                        key={time}
                        onClick={() => toggleHour(time)}
                        disabled={isBooked}
                        className={`p-3 rounded-lg text-sm font-medium transition-all min-h-[48px] flex items-center justify-center ${
                          isBooked
                            ? 'bg-destructive/20 text-destructive cursor-not-allowed line-through'
                            : isSelected
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-secondary hover:bg-accent/20'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
                {selectedHours.length > 0 && selectedHours.length < MIN_HOURS && (
                  <p className="text-sm text-destructive mt-3">Selecciona al menos {MIN_HOURS} horas (faltan {MIN_HOURS - selectedHours.length})</p>
                )}
              </div>
            </div>

            {/* Summary & form */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-4 sm:p-6 lg:sticky lg:top-24">
                <h3 className="font-display text-lg font-semibold mb-4">Resumen</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-medium">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Horas</span>
                    <span className="font-medium">{selectedHours.length} hora(s)</span>
                  </div>
                  {selectedHours.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horario</span>
                      <span className="font-medium">{getBookingTimes()?.start} - {getBookingTimes()?.end}</span>
                    </div>
                  )}
                  {selectedHours.length > 4 && (
                    <div className="bg-accent/10 text-accent text-xs p-2 rounded-lg text-center">
                      Precio máximo aplicado: 80€ (más de 4 horas)
                    </div>
                  )}
                  <div className="border-t border-border my-4" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-accent">{calculatePrice(selectedHours.length)}€</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">IVA incluido</p>
                </div>

                {!showForm ? (
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="w-full min-h-[48px] text-base"
                    size="lg"
                    disabled={selectedHours.length < MIN_HOURS}
                  >
                    {selectedHours.length < MIN_HOURS ? `Selecciona mín. ${MIN_HOURS}h` : 'Continuar con la reserva'}
                  </Button>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input id="name" name="name" required maxLength={100} value={formData.name} onChange={handleChange} placeholder="Tu nombre" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" name="email" type="email" required maxLength={255} value={formData.email} onChange={handleChange} placeholder="tu@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input id="phone" name="phone" type="tel" required maxLength={20} value={formData.phone} onChange={handleChange} placeholder="+34 600 000 000" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa (opcional)</Label>
                      <Input id="company" name="company" maxLength={100} value={formData.company} onChange={handleChange} placeholder="Nombre de tu empresa" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas (opcional)</Label>
                      <Textarea id="notes" name="notes" maxLength={500} value={formData.notes} onChange={handleChange} placeholder="Cualquier información adicional..." rows={3} />
                      <div className="text-xs text-muted-foreground text-right">{formData.notes.length}/500</div>
                    </div>

                    <div className="bg-secondary p-4 rounded-lg space-y-2">
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <CreditCard className="h-4 w-4" />
                        Datos para transferencia
                      </div>
                      <div className="text-sm space-y-1">
                        <p><span className="text-muted-foreground">Banco:</span> Sabadell</p>
                        <p><span className="text-muted-foreground">IBAN:</span> ES37 0081 7301 3200 0187 2392</p>
                        <p><span className="text-muted-foreground">Titular:</span> COALTE COWORKING</p>
                        <p><span className="text-muted-foreground">Concepto:</span> Sala + {format(selectedDate, 'dd/MM/yyyy')}</p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-3 rounded-lg">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        ⚠️ Tu reserva quedará <strong>pendiente de validación</strong> por el administrador. 
                        Te confirmaremos por email.
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">Atrás</Button>
                      <Button type="submit" className="flex-1 min-h-[48px] text-base" disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Al reservar aceptas nuestra política de privacidad.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Availability Calendar */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="text-center mb-12">
            <h2 className="heading-section mb-4">Consulta la disponibilidad</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Visualiza en tiempo real qué días y horas están disponibles.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <MeetingRoomAvailabilityCalendar 
              onDateSelect={(date) => {
                setSelectedDate(date);
                setSelectedHours([]);
                document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </section>

      {/* What's included */}
      <section className="section-padding bg-secondary">
        <div className="container-coalte">
          <div className="text-center mb-12">
            <h2 className="heading-section mb-4">¿Qué incluye?</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {includes.map((item, index) => (
              <div key={index} className="flex items-center gap-3 bg-background p-4 rounded-xl">
                <Check className="h-5 w-5 text-accent shrink-0" />
                <span className="font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-padding bg-primary text-primary-foreground">
        <div className="container-coalte text-center">
          <h2 className="heading-section mb-4">¿Tienes dudas?</h2>
          <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
            Contáctanos directamente y resolveremos cualquier pregunta.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="tel:+34676502002"><Phone className="mr-2 h-5 w-5" />Llamar ahora</a>
            </Button>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" asChild>
              <a href="https://wa.me/34676502002" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="mr-2 h-5 w-5" />WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
