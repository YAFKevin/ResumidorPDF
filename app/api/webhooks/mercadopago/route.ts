import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

// console.log('Script del webhook cargado'); // Log muy, muy temprano

export async function POST(request: Request) {
  console.log('=== WEBHOOK INICIADO ===');
  console.log('Headers recibidos:', Object.fromEntries(request.headers.entries()));
  console.log('Función POST del webhook iniciada'); // Log 1

  try {
    console.log('Dentro del bloque try'); // Log 2

    // Inicializar cliente de MercadoPago dentro del try
    const client = new MercadoPagoConfig({
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
    });
    console.log('Cliente MP inicializado'); // Log 3

    // Obtener el cuerpo raw y el encabezado de firma
    const rawBody = await request.text();
    console.log('Cuerpo raw obtenido'); // Log 4

    const signature = request.headers.get('x-signature');
    console.log('Encabezado signature obtenido', signature); // Log 5

    const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET; // Usar la variable corregida
    console.log('Clave secreta obtenida'); // Log 6

    // Verificar la clave secreta del webhook
    if (!webhookSecret) {
      console.error('Log 6a: Clave secreta del webhook MERCADOPAGO_WEBHOOK_SECRET no configurada.');
      return NextResponse.json(
        { error: 'Configuración del webhook incompleta.' },
        { status: 500 }
      );
    }

    // Verificar la firma
    if (!signature) {
      console.warn('Log 6b: Encabezado de firma X-Signature faltante.');
       // Opcional: podrías querer retornar un error 400 aquí
    } else {
        console.log('Log 6c: Verificando firma...');
        const [tSignature, vSignature] = signature.split(',').map(part => part.split('='));
        const timestamp = tSignature[1];
        const receivedSignature = vSignature[1];

        if (!timestamp || !receivedSignature) {
           console.error('Log 6d: Formato de encabezado de firma inválido.', signature);
           return NextResponse.json(
             { error: 'Formato de encabezado de firma inválido.' },
             { status: 400 }
           );
        }

        const message = `${timestamp}|${rawBody}`; // Construir el mensaje
        console.log('Log 6e: Mensaje para firma construido');

        const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(message).digest('hex');
        console.log('Log 6f: Firma esperada calculada');

        if (!crypto.timingSafeEqual(Buffer.from(receivedSignature, 'hex'), Buffer.from(expectedSignature, 'hex'))) {
           console.error('Log 6g: Firma del webhook inválida.', { receivedSignature, expectedSignature, rawBody, timestamp });
           return NextResponse.json(
             { error: 'Firma del webhook inválida.' },
             { status: 400 }
           );
        }
         console.log('Log 6h: Firma del webhook verificada con éxito.');
    }

    // Si la firma es válida (o se omitió), parsear el body como JSON
    let body;
    try {
        body = JSON.parse(rawBody);
        console.log('Log 7: Body parseado como JSON', body); // Log 7
    } catch (parseError) {
        console.error('Log 7a: Error al parsear cuerpo como JSON:', parseError);
        return NextResponse.json({ error: 'Cuerpo de solicitud inválido (no es JSON válido)' }, { status: 400 });
    }

    // Verificar que sea una notificación válida de MercadoPago (verificación básica)
    if (!body.action || !body.data || !body.data.id) {
      console.error('Log 8: Estructura de notificación inválida o ID de pago faltante', body);
      return NextResponse.json(
        { error: 'Notificación inválida o ID de pago faltante' },
        { status: 400 }
      );
    }
    console.log('Log 8a: Estructura básica de body verificada'); // Log 8a

    await connectMongoDB();
    console.log('Log 9: Conectado a MongoDB'); // Log 9

    // Obtener el pago de la API de Mercado Pago
    const payment = new Payment(client);
    console.log(`Log 10: Intentando obtener pago con ID: ${body.data.id}`); // Log 10
    const paymentData = await payment.get({ id: body.data.id });
    console.log('Log 10a: Datos de pago obtenidos de MP', paymentData); // Log 10a

    if (!paymentData) {
      console.error('Log 10b: Pago no encontrado para el ID:', body.data.id);
      // Es posible que el pago aún no esté disponible, retornar 200 para reintentos de MP
      return NextResponse.json({ received: true, message: 'Pago no encontrado temporalmente' }, { status: 200 });
    }

    const userId = paymentData.external_reference;

    if (!userId) {
       console.error('Log 11: External reference (userId) faltante en los datos del pago:', paymentData);
       return NextResponse.json({ error: 'Referencia externa del usuario faltante' }, { status: 400 });
    }
    console.log(`Log 11a: External reference (userId) obtenido: ${userId}`); // Log 11a

    const user = await User.findById(userId);
    console.log('Log 12: Usuario encontrado en DB', user ? user._id : 'null'); // Log 12

    if (!user) {
      console.error('Log 12a: Usuario no encontrado para el ID:', userId);
       // Podría ser un usuario eliminado o un error en la referencia, retornar 200 para evitar reintentos innecesarios de MP
      return NextResponse.json({ received: true, message: 'Usuario no encontrado' }, { status: 200 });
    }

    console.log(`Log 13: Estado de pago de MP: ${paymentData.status}`); // Log 13
    // Actualizar el estado de la suscripción según el estado del pago
    switch (paymentData.status) {
      case 'approved':
        console.log('Log 13a: Estado approved. Procediendo a actualizar suscripción.'); // Log 13a
        user.subscription.status = 'active';
        let periodDuration = 30 * 24 * 60 * 60 * 1000; // Default 30 días para mensual
        const plan = paymentData.metadata?.plan || 'mensual'; // Asumir mensual por defecto si no está en metadata

        if (plan === 'anual') {
            periodDuration = 365 * 24 * 60 * 60 * 1000; // 365 días para anual
        }

        user.subscription.plan = plan;

        const now = new Date();
        const currentPeriodEnd = user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd > now ? user.subscription.currentPeriodEnd : now;

        user.subscription.currentPeriodEnd = new Date(currentPeriodEnd.getTime() + periodDuration);

        if (paymentData.id) {
          user.subscription.mercadopagoSubscriptionId = paymentData.id.toString();
        }

        console.log(`Log 13a-1: Usuario ${userId} suscripción marcada como activa. Plan: ${plan}, Fin de período calculado: ${user.subscription.currentPeriodEnd}`); // Log 13a-1
        break;

      case 'rejected':
        console.log('Log 13b: Estado rejected.'); // Log 13b
        user.subscription.status = 'canceled';
         console.log(`Usuario ${userId} suscripción marcada como rechazada.`);
        break;

      case 'pending':
      case 'in_process':
        console.log('Log 13c: Estado pending/in_process.'); // Log 13c
        user.subscription.status = 'pending';
         console.log(`Usuario ${userId} suscripción marcada como pendiente.`);
        break;

       default:
         console.log(`Log 13d: Pago con estado desconocido: ${paymentData.status}`); // Log 13d
         break;
    }
    console.log('Log 14: Intentando guardar usuario actualizado en DB'); // Log 14
    await user.save();
    console.log('Log 15: Usuario guardado exitosamente en DB'); // Log 15

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Log CATCH: Error general en el webhook:', error); // Log CATCH
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor al procesar webhook' },
      { status: 500 }
    );
  }
}

// Eliminar o comentar el resto del código y las importaciones no utilizadas
// import { MercadoPagoConfig, Payment } from 'mercadopago';
// import connectMongoDB from '@/lib/mongodb';
// import User from '@/models/User';
// import crypto from 'crypto';
// ... etc. 