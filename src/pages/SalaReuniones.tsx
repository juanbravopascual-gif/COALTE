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

const HOURLY_RATE = 20; // €/hora IVA incluido
const DAILY_RATE = 80; // €/día IVA incluido

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

// Horarios disponibles (cada hora)
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
  const [bookingType, setBookingType] = useState<'hourly' | 'daily'>('hourly');
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

  // Cargar reservas existentes
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('meeting_room_bookings')
      .select('id, booking_date, start_time, end_time, status')
      .neq('status', 'cancelled');
    
    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setExistingBookings(data || []);
    }
    setIsLoading(false);
  };

  // Verificar si un slot está ocupado
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

  // Verificar si una fecha tiene todo el día ocupado
  const isDayFullyBooked = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = existingBookings.filter(b => b.booking_date === dateStr);
    
    // Verificar si hay una reserva de día completo
    const hasFullDay = dayBookings.some(b => 
      b.start_time === '08:00:00' && b.end_time === '20:00:00'
    );
    if (hasFullDay) return true;
    
    // Verificar si todos los slots están ocupados
    return timeSlots.every(time => isSlotBooked(date, time));
  };

  // Toggle selección de hora
  const toggleHour = (time: string) => {
    if (bookingType === 'daily') return;
    if (isSlotBooked(selectedDate, time)) return;
    
    setSelectedHours(prev => 
      prev.includes(time) 
        ? prev.filter(t => t !== time)
        : [...prev, time].sort()
    );
  };

  // Calcular precio total
  const calculateTotal = () => {
    if (bookingType === 'daily') return DAILY_RATE;
    return selectedHours.length * HOURLY_RATE;
  };

  // Calcular horario de reserva
  const getBookingTimes = () => {
    if (bookingType === 'daily') {
      return { start: '08:00', end: '20:00' };
    }
    if (selectedHours.length === 0) return null;
    const sorted = [...selectedHours].sort();
    const startHour = parseInt(sorted[0].split(':')[0]);
    const endHour = parseInt(sorted[sorted.length - 1].split(':')[0]) + 1;
    return { start: sorted[0], end: `${endHour.toString().padStart(2, '0')}:00` };
  };

  // Validate form inputs
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

    if (errors.length > 0) {
      toast({
        title: 'Errores de validación',
        description: errors.join('. '),
        variant: 'destructive',
      });
      return false;
    }
    return true;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    
    const times = getBookingTimes();
    if (!times) {
      toast({
        title: 'Error',
        description: 'Por favor selecciona al menos una hora.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Guardar en base de datos
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
          booking_type: bookingType,
          hours: bookingType === 'hourly' ? selectedHours.length : null,
          total_price: calculateTotal(),
          payment_method: 'transfer',
          notes: formData.notes || null,
        });

      if (dbError) throw dbError;

      // Enviar notificaciones
      const { data: notifData, error: notifError } = await supabase.functions.invoke('send-booking-notification', {
        body: {
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone,
          clientCompany: formData.company,
          bookingDate: format(selectedDate, 'yyyy-MM-dd'),
          startTime: times.start,
          endTime: times.end,
          bookingType,
          hours: selectedHours.length,
          totalPrice: calculateTotal(),
          notes: formData.notes,
        },
      });

      if (notifError) {
        console.error('Error sending notification:', notifError);
      }

      // Abrir WhatsApp en nueva ventana
      if (notifData?.whatsappUrl) {
        window.open(notifData.whatsappUrl, '_blank');
      }

      toast({
        title: '¡Reserva recibida!',
        description: 'Te hemos enviado los datos para realizar la transferencia. Confirmaremos tu reserva una vez recibido el pago.',
      });

      // Reset form
      setShowForm(false);
      setSelectedHours([]);
      setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
      fetchBookings();

    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast({
        title: 'Error',
        description: 'No se pudo procesar la reserva. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  // Generar días para el calendario
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
      <section className="relative h-[50vh] min-h-[400px] flex items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${salaReuniones})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70" />
        </div>
        <div className="container-coalte relative z-10 text-white">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-2 bg-accent text-accent-foreground rounded-full text-sm font-medium mb-4">
              Reserva Online
            </span>
            <h1 className="heading-display mb-4">
              Sala de Reuniones
            </h1>
            <p className="text-xl text-white/90 mb-6">
              Espacio profesional para tus reuniones, presentaciones y eventos. 
              Totalmente equipada y disponible 24 horas.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Clock className="h-5 w-5" />
                <span className="font-semibold">20€/hora</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <Calendar className="h-5 w-5" />
                <span className="font-semibold">80€/día</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-lg">
                <span className="text-sm">IVA incluido</span>
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
              Selecciona la fecha y el horario que necesitas. Recibirás confirmación 
              por email una vez verificado el pago.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Calendario y selección */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tipo de reserva */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Tipo de reserva</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => { setBookingType('hourly'); setSelectedHours([]); }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      bookingType === 'hourly' 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-5 w-5 text-accent" />
                      <span className="font-semibold">Por horas</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">{HOURLY_RATE}€<span className="text-sm font-normal text-muted-foreground">/hora</span></p>
                  </button>
                  <button
                    onClick={() => { setBookingType('daily'); setSelectedHours([]); }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      bookingType === 'daily' 
                        ? 'border-accent bg-accent/10' 
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-5 w-5 text-accent" />
                      <span className="font-semibold">Día completo</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">{DAILY_RATE}€<span className="text-sm font-normal text-muted-foreground">/día</span></p>
                  </button>
                </div>
              </div>

              {/* Selector de fecha */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-display text-lg font-semibold mb-4">Selecciona fecha</h3>
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
                        className={`shrink-0 w-16 p-3 rounded-xl text-center transition-all ${
                          isSelected 
                            ? 'bg-accent text-accent-foreground' 
                            : isPast || isFullyBooked
                              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                              : existingBookings.some(b => b.booking_date === format(day, 'yyyy-MM-dd'))
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                                : 'bg-secondary hover:bg-accent/20'
                        }`}
                      >
                        <div className="text-xs uppercase opacity-70">
                          {format(day, 'EEE', { locale: es })}
                        </div>
                        <div className="text-lg font-bold">
                          {format(day, 'd')}
                        </div>
                        <div className="text-xs opacity-70">
                          {format(day, 'MMM', { locale: es })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selector de horas */}
              {bookingType === 'hourly' && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">
                    Selecciona horario - {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
                    {timeSlots.map((time) => {
                      const isBooked = isSlotBooked(selectedDate, time);
                      const isSelected = selectedHours.includes(time);
                      
                      return (
                        <button
                          key={time}
                          onClick={() => toggleHour(time)}
                          disabled={isBooked}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
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
                  <p className="text-sm text-muted-foreground mt-4">
                    Puedes seleccionar múltiples horas. Las horas tachadas ya están reservadas.
                  </p>
                </div>
              )}

              {bookingType === 'daily' && (
                <div className="bg-card border border-border rounded-xl p-6">
                  <h3 className="font-display text-lg font-semibold mb-4">
                    Reserva día completo - {format(selectedDate, "d 'de' MMMM", { locale: es })}
                  </h3>
                  <div className="flex items-center gap-4 p-4 bg-accent/10 rounded-lg">
                    <Clock className="h-6 w-6 text-accent" />
                    <div>
                      <p className="font-semibold">Acceso de 08:00 a 20:00</p>
                      <p className="text-sm text-muted-foreground">12 horas de uso exclusivo de la sala</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Resumen y formulario */}
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h3 className="font-display text-lg font-semibold mb-4">Resumen</h3>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-medium">{format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium">
                      {bookingType === 'daily' ? 'Día completo' : `${selectedHours.length} hora(s)`}
                    </span>
                  </div>
                  {bookingType === 'hourly' && selectedHours.length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Horario</span>
                      <span className="font-medium">{getBookingTimes()?.start} - {getBookingTimes()?.end}</span>
                    </div>
                  )}
                  <div className="border-t border-border my-4" />
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-accent">{calculateTotal()}€</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-right">IVA incluido</p>
                </div>

                {!showForm ? (
                  <Button 
                    onClick={() => setShowForm(true)}
                    className="w-full"
                    size="lg"
                    disabled={(bookingType === 'hourly' && selectedHours.length === 0) || isDayFullyBooked(selectedDate)}
                  >
                    {isDayFullyBooked(selectedDate) ? 'Día no disponible' : 'Continuar con la reserva'}
                  </Button>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre completo *</Label>
                      <Input
                        id="name"
                        name="name"
                        required
                        maxLength={100}
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Tu nombre"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        required
                        maxLength={255}
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="tu@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        maxLength={20}
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+34 600 000 000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Empresa (opcional)</Label>
                      <Input
                        id="company"
                        name="company"
                        maxLength={100}
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Nombre de tu empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="notes">Notas (opcional)</Label>
                      <Textarea
                        id="notes"
                        name="notes"
                        maxLength={500}
                        value={formData.notes}
                        onChange={handleChange}
                        placeholder="Cualquier información adicional..."
                        rows={3}
                      />
                      <div className="text-xs text-muted-foreground text-right">
                        {formData.notes.length}/500 caracteres
                      </div>
                    </div>

                    {/* Datos bancarios */}
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

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                        className="flex-1"
                      >
                        Atrás
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Procesando...' : 'Confirmar reserva'}
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                      Al reservar aceptas nuestra política de privacidad.
                      Te contactaremos para confirmar la reserva.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Calendario de Disponibilidad */}
      <section className="section-padding bg-background">
        <div className="container-coalte">
          <div className="text-center mb-12">
            <h2 className="heading-section mb-4">Consulta la disponibilidad</h2>
            <p className="text-body-lg text-muted-foreground max-w-2xl mx-auto">
              Visualiza en tiempo real qué días y horas están disponibles para reservar la sala de reuniones.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <MeetingRoomAvailabilityCalendar 
              onDateSelect={(date) => {
                setSelectedDate(date);
                setSelectedHours([]);
                // Scroll suave a la sección de reserva
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
            Contáctanos directamente y resolveremos cualquier pregunta sobre la reserva.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <a href="tel:+34676502002">
                <Phone className="mr-2 h-5 w-5" />
                Llamar ahora
              </a>
            </Button>
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" asChild>
              <a href="https://wa.me/34676502002" target="_blank" rel="noopener noreferrer">
                <FaWhatsapp className="mr-2 h-5 w-5" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
}
