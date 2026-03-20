import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isBefore, startOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
}

interface MeetingRoomAvailabilityCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const timeSlots = [
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function MeetingRoomAvailabilityCalendar({ 
  onDateSelect, 
  selectedDate: externalSelectedDate 
}: MeetingRoomAvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(externalSelectedDate || null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    if (externalSelectedDate) {
      setSelectedDate(externalSelectedDate);
    }
  }, [externalSelectedDate]);

  const fetchBookings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .rpc('get_booking_availability');
    
    if (error) {
      console.error('Error fetching bookings:', error);
    } else {
      setBookings((data || []).map((b: any) => ({ ...b, id: `${b.booking_date}-${b.start_time}` })));
    }
    setIsLoading(false);
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Obtener el día de la semana del primer día (0 = domingo, 1 = lunes, etc.)
  // Ajustamos para que la semana empiece en lunes
  const startDayOfWeek = (monthStart.getDay() + 6) % 7;

  const isSlotBooked = (date: Date, time: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return bookings.some(booking => {
      if (booking.booking_date !== dateStr) return false;
      const startHour = parseInt(booking.start_time.split(':')[0]);
      const endHour = parseInt(booking.end_time.split(':')[0]);
      const slotHour = parseInt(time.split(':')[0]);
      return slotHour >= startHour && slotHour < endHour;
    });
  };

  const getDayStatus = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayBookings = bookings.filter(b => b.booking_date === dateStr);
    
    if (dayBookings.length === 0) return 'free';
    
    // Verificar si hay una reserva de día completo
    const hasFullDay = dayBookings.some(b => 
      b.start_time === '08:00:00' && b.end_time === '20:00:00'
    );
    if (hasFullDay) return 'booked';
    
    // Contar slots ocupados
    const bookedSlots = timeSlots.filter(time => isSlotBooked(date, time)).length;
    if (bookedSlots === timeSlots.length) return 'booked';
    if (bookedSlots > 0) return 'partial';
    return 'free';
  };

  const getAvailableHoursForDay = (date: Date) => {
    return timeSlots.filter(time => !isSlotBooked(date, time));
  };

  const handleDateClick = (date: Date) => {
    if (isBefore(date, startOfDay(new Date())) && !isToday(date)) return;
    
    setSelectedDate(date);
    onDateSelect?.(date);
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-lg font-semibold flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-accent" />
          Calendario de disponibilidad
        </h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToPreviousMonth}
            disabled={isSameMonth(currentMonth, new Date()) || isBefore(monthStart, new Date())}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium min-w-[140px] text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: es })}
          </span>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500" />
          <span className="text-muted-foreground">Disponible</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500" />
          <span className="text-muted-foreground">Parcialmente ocupado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500" />
          <span className="text-muted-foreground">Ocupado</span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
        </div>
      ) : (
        <>
          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendario */}
          <div className="grid grid-cols-7 gap-1">
            {/* Días vacíos antes del primer día del mes */}
            {Array.from({ length: startDayOfWeek }).map((_, index) => (
              <div key={`empty-${index}`} className="aspect-square" />
            ))}

            {/* Días del mes */}
            {daysInMonth.map(day => {
              const status = getDayStatus(day);
              const isPast = isBefore(day, startOfDay(new Date())) && !isToday(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day)}
                  disabled={isPast}
                  className={cn(
                    "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all relative",
                    isPast && "opacity-40 cursor-not-allowed",
                    !isPast && "hover:ring-2 hover:ring-accent cursor-pointer",
                    isSelected && "ring-2 ring-accent bg-accent/10",
                    isCurrentDay && !isSelected && "font-bold",
                    status === 'free' && !isPast && "bg-green-500/10 border border-green-500/30",
                    status === 'partial' && !isPast && "bg-yellow-500/10 border border-yellow-500/30",
                    status === 'booked' && !isPast && "bg-red-500/10 border border-red-500/30"
                  )}
                >
                  <span className={cn(
                    isCurrentDay && "bg-accent text-accent-foreground rounded-full w-7 h-7 flex items-center justify-center"
                  )}>
                    {format(day, 'd')}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Detalle del día seleccionado */}
          {selectedDate && !isBefore(selectedDate, startOfDay(new Date())) && (
            <div className="mt-6 pt-6 border-t border-border">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" />
                Disponibilidad {format(selectedDate, "d 'de' MMMM", { locale: es })}
              </h4>
              
              {getDayStatus(selectedDate) === 'booked' ? (
                <p className="text-muted-foreground text-sm">Este día está completamente reservado.</p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2">
                  {timeSlots.map(time => {
                    const isBooked = isSlotBooked(selectedDate, time);
                    return (
                      <div
                        key={time}
                        className={cn(
                          "p-2 rounded-lg text-sm text-center font-medium",
                          isBooked 
                            ? "bg-red-500/20 text-red-700 dark:text-red-400 line-through" 
                            : "bg-green-500/20 text-green-700 dark:text-green-400"
                        )}
                      >
                        {time}
                      </div>
                    );
                  })}
                </div>
              )}

              {getDayStatus(selectedDate) !== 'booked' && (
                <p className="text-sm text-muted-foreground mt-3">
                  {getAvailableHoursForDay(selectedDate).length} horas disponibles
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
