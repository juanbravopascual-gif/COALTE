import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingNotificationRequest {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientCompany?: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  bookingType: string;
  hours?: number;
  totalPrice: number;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const booking: BookingNotificationRequest = await req.json();

    // Validar campos requeridos
    if (!booking.clientName || !booking.clientEmail || !booking.clientPhone || !booking.bookingDate) {
      throw new Error("Faltan campos requeridos");
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY no configurada");
    }

    const bookingTypeLabel = booking.bookingType === 'daily' ? 'Día completo' : `${booking.hours} hora(s)`;
    const formattedDate = new Date(booking.bookingDate).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Enviar email de notificación usando fetch directamente a la API de Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "COALTE Reservas <onboarding@resend.dev>",
        to: ["info@coalte.eu"],
        subject: `🗓️ Nueva Reserva Sala de Reuniones - ${booking.clientName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
              .info-row { padding: 12px 0; border-bottom: 1px solid #eee; }
              .label { font-weight: bold; color: #666; }
              .value { color: #333; }
              .highlight { background: #4ade80; color: #000; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; font-size: 24px; font-weight: bold; }
              .footer { background: #1a1a1a; color: #999; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
              .cta { background: #4ade80; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 5px; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🗓️ Nueva Reserva</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Sala de Reuniones COALTE</p>
              </div>
              <div class="content">
                <div class="highlight">
                  ${booking.totalPrice.toFixed(2)}€ (IVA incluido)
                </div>
                
                <h2 style="color: #1a1a1a; border-bottom: 2px solid #4ade80; padding-bottom: 10px;">📋 Datos del Cliente</h2>
                <div class="info-row"><span class="label">Nombre:</span> <span class="value">${booking.clientName}</span></div>
                <div class="info-row"><span class="label">Email:</span> <span class="value">${booking.clientEmail}</span></div>
                <div class="info-row"><span class="label">Teléfono:</span> <span class="value">${booking.clientPhone}</span></div>
                ${booking.clientCompany ? `<div class="info-row"><span class="label">Empresa:</span> <span class="value">${booking.clientCompany}</span></div>` : ''}
                
                <h2 style="color: #1a1a1a; border-bottom: 2px solid #4ade80; padding-bottom: 10px; margin-top: 30px;">📅 Detalles de la Reserva</h2>
                <div class="info-row"><span class="label">Fecha:</span> <span class="value">${formattedDate}</span></div>
                <div class="info-row"><span class="label">Horario:</span> <span class="value">${booking.startTime} - ${booking.endTime}</span></div>
                <div class="info-row"><span class="label">Tipo:</span> <span class="value">${bookingTypeLabel}</span></div>
                ${booking.notes ? `<div class="info-row"><span class="label">Notas:</span> <span class="value">${booking.notes}</span></div>` : ''}
                
                <h2 style="color: #1a1a1a; border-bottom: 2px solid #4ade80; padding-bottom: 10px; margin-top: 30px;">💳 Datos para Transferencia</h2>
                <div class="info-row"><span class="label">Banco:</span> <span class="value">Sabadell</span></div>
                <div class="info-row"><span class="label">IBAN:</span> <span class="value">ES37 0081 7301 3200 0187 2392</span></div>
                <div class="info-row"><span class="label">Titular:</span> <span class="value">JUAN BRAVO PASCUAL</span></div>
                
                <div style="text-align: center; margin-top: 30px;">
                  <a href="https://wa.me/34676502002?text=Hola,%20confirmo%20la%20reserva%20de%20${encodeURIComponent(booking.clientName)}%20para%20el%20${encodeURIComponent(formattedDate)}" class="cta">💬 Contactar por WhatsApp</a>
                  <a href="tel:+34676502002" class="cta">📞 Llamar</a>
                </div>
              </div>
              <div class="footer">
                <p>COALTE Coworking - Marqués de Molins, 22 - 03004 Alicante</p>
                <p>Este email fue generado automáticamente por el sistema de reservas.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email de notificación enviado:", emailResult);

    // Generar enlace de WhatsApp para notificación
    const whatsappMessage = `🗓️ *NUEVA RESERVA SALA*\n\n👤 *Cliente:* ${booking.clientName}\n📧 ${booking.clientEmail}\n📱 ${booking.clientPhone}${booking.clientCompany ? `\n🏢 ${booking.clientCompany}` : ''}\n\n📅 *Fecha:* ${formattedDate}\n⏰ *Horario:* ${booking.startTime} - ${booking.endTime}\n📦 *Tipo:* ${bookingTypeLabel}\n\n💰 *Total:* ${booking.totalPrice.toFixed(2)}€ (IVA inc.)${booking.notes ? `\n\n📝 *Notas:* ${booking.notes}` : ''}`;
    
    const whatsappUrl = `https://wa.me/34676502002?text=${encodeURIComponent(whatsappMessage)}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailResult,
        whatsappUrl 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error en send-booking-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
