import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

export async function POST(request: Request) {
  try {
    // Autenticar al usuario (asegurarse de que está logueado)
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    let userId = null;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro');
      userId = decoded.userId;
    } catch (error) {
      console.error('Error al verificar token JWT para actualización manual:', error);
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener el ID de pago de la solicitud (enviado desde el frontend)
    const { paymentId } = await request.json();
    if (!paymentId) {
      return NextResponse.json({ error: 'ID de pago faltante' }, { status: 400 });
    }

    await connectMongoDB();
    const user = await User.findById(userId);

    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener los detalles del pago de Mercado Pago (para verificar estado y plan)
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: paymentId });

    if (!paymentData || paymentData.status !== 'approved') {
      console.warn(`Intento de actualización manual con pago no aprobado o no encontrado: ${paymentId}`);
       // No necesariamente un error, podría ser una doble llamada o un pago no exitoso
      return NextResponse.json({ message: 'Pago no aprobado o no encontrado' }, { status: 200 });
    }

     // Verificar que el pago pertenece al usuario logueado (medida de seguridad)
    if (paymentData.external_reference !== user._id.toString()) {
        console.error('Intento de actualización manual con ID de usuario no coincidente', { paymentUserId: paymentData.external_reference, loggedInUserId: user._id.toString() });
        return NextResponse.json({ error: 'Pago no corresponde al usuario' }, { status: 403 });
    }


    // Actualizar el estado de la suscripción (similar a la lógica del webhook)
     if (user.subscription.status !== 'active') { // Evitar actualizar si ya está activo
        user.subscription.status = 'active';
        let periodDuration = 30 * 24 * 60 * 60 * 1000; // Default 30 días
        const plan = paymentData.metadata?.plan || 'mensual';

        if (plan === 'anual') {
            periodDuration = 365 * 24 * 60 * 60 * 1000;
        }

        user.subscription.plan = plan;

        const now = new Date();
        const currentPeriodEnd = user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd > now ? user.subscription.currentPeriodEnd : now;
        user.subscription.currentPeriodEnd = new Date(currentPeriodEnd.getTime() + periodDuration);

        if (paymentData.id) {
           user.subscription.mercadopagoSubscriptionId = paymentData.id.toString();
         }

        await user.save();
        console.log(`Usuario ${userId} suscripción actualizada manualmente. Plan: ${plan}`);
     }

    return NextResponse.json({ success: true, message: 'Suscripción actualizada' });

  } catch (error: any) {
    console.error('Error en actualización manual de suscripción:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 