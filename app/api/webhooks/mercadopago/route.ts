import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
});

export async function POST(request: Request) {
  try {
    // Obtener el cuerpo raw y el encabezado de firma
    const rawBody = await request.text();
    const signature = request.headers.get('x-signature');
    const webhookSecret = process.env.MERCADAPAGO_WEBHOOK_SECRET; // Usar la nueva variable

    // Verificar la clave secreta del webhook
    if (!webhookSecret) {
      console.error('Clave secreta del webhook MERCADOPAGO_WEBHOOK_SECRET no configurada.');
      return NextResponse.json(
        { error: 'Configuración del webhook incompleta.' },
        { status: 500 }
      );
    }

    // Verificar la firma si está presente
    if (!signature) {
      console.warn('Encabezado de firma X-Signature faltante. No se puede verificar la autenticidad del webhook.');
       // Opcional: podrías querer retornar un error 400 aquí si requieres verificación estricta
       // return NextResponse.json({ error: 'Firma del webhook faltante' }, { status: 400 });
    } else {
        const [tSignature, vSignature] = signature.split(',').map(part => part.split('='));
        const timestamp = tSignature[1];
        const receivedSignature = vSignature[1];

        if (!timestamp || !receivedSignature) {
           console.error('Formato de encabezado de firma inválido.', signature);
           return NextResponse.json(
             { error: 'Formato de encabezado de firma inválido.' },
             { status: 400 }
           );
        }

        // Construir el mensaje para verificar la firma: timestamp|rawBody
        const message = `${timestamp}|${rawBody}`; 

        // Calcular la firma esperada
        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(message).digest('hex');

        // Comparar firmas de forma segura contra ataques de timing
        if (!crypto.timingSafeEqual(Buffer.from(receivedSignature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
           console.error('Firma del webhook inválida.', { receivedSignature, expectedSignature, rawBody, timestamp });
           return NextResponse.json(
             { error: 'Firma del webhook inválida.' },
             { status: 400 }
           );
        }
         console.log('Firma del webhook verificada con éxito.');
    }

    // Si la firma es válida (o si no hay firma y se decidió continuar), parsear el body como JSON
    const body = JSON.parse(rawBody);

    // Verificar que sea una notificación válida de MercadoPago (verificación básica)
    if (!body.action || !body.data || !body.data.id) {
      console.error('Estructura de notificación inválida', body);
      return NextResponse.json(
        { error: 'Notificación inválida o ID de pago faltante' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Obtener el pago
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: body.data.id });

    if (!paymentData) {
      console.error('Pago no encontrado para el ID:', body.data.id);
      // Es posible que el pago aún no esté disponible, retornar 200 para reintentos de MP
      return NextResponse.json({ received: true, message: 'Pago no encontrado temporalmente' }, { status: 200 });
    }

    const userId = paymentData.external_reference;

    if (!userId) {
       console.error('External reference (userId) faltante en los datos del pago:', paymentData);
       return NextResponse.json({ error: 'Referencia externa del usuario faltante' }, { status: 400 });
    }

    const user = await User.findById(userId);

    if (!user) {
      console.error('Usuario no encontrado para el ID:', userId);
       // Podría ser un usuario eliminado o un error en la referencia, retornar 200 para evitar reintentos innecesarios de MP
      return NextResponse.json({ received: true, message: 'Usuario no encontrado' }, { status: 200 });
    }

    // Actualizar el estado de la suscripción según el estado del pago
    switch (paymentData.status) {
      case 'approved':
        user.subscription.status = 'active';
        // Determinar la duración del período basado en el plan (mensual/anual)
        let periodDuration = 30 * 24 * 60 * 60 * 1000; // Default 30 días para mensual
        const plan = paymentData.metadata?.plan || 'mensual'; // Asumir mensual por defecto si no está en metadata

        if (plan === 'anual') {
            periodDuration = 365 * 24 * 60 * 60 * 1000; // 365 días para anual
        }

        user.subscription.plan = plan;

        // Calcular la fecha de fin del período. Si ya tiene una suscripción activa, extender desde esa fecha.
        const now = new Date();
        const currentPeriodEnd = user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd > now ? user.subscription.currentPeriodEnd : now;

        user.subscription.currentPeriodEnd = new Date(currentPeriodEnd.getTime() + periodDuration);

        if (paymentData.id) {
          user.subscription.mercadopagoSubscriptionId = paymentData.id.toString();
        }

        console.log(`Usuario ${userId} suscripción aprobada. Plan: ${plan}, Fin de período: ${user.subscription.currentPeriodEnd}`);
        break;

      case 'rejected':
        user.subscription.status = 'canceled';
         console.log(`Usuario ${userId} suscripción rechazada.`);
        break;

      case 'pending':
      case 'in_process':
        user.subscription.status = 'pending';
         console.log(`Usuario ${userId} suscripción pendiente/en proceso.`);
        break;

      // Otros estados que puedas necesitar manejar (refunded, cancelled, etc.)
       default:
         console.log(`Usuario ${userId} pago con estado desconocido: ${paymentData.status}`);
         // Mantener estado actual o manejar según tu lógica
         break;
    }

    await user.save();

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Error general en el webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al procesar webhook' },
      { status: 500 }
    );
  }
} 