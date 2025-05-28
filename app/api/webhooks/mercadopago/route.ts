import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Verificar que sea una notificación válida de MercadoPago
    if (!body.action || !body.data) {
      return NextResponse.json(
        { error: 'Notificación inválida' },
        { status: 400 }
      );
    }

    await connectMongoDB();

    // Obtener el pago
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: body.data.id });

    if (!paymentData) {
      throw new Error('Pago no encontrado');
    }

    const userId = paymentData.external_reference;
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar el estado de la suscripción según el estado del pago
    switch (paymentData.status) {
      case 'approved':
        user.subscription.status = 'active';
        user.subscription.plan = paymentData.metadata.plan;
        user.subscription.mercadopagoSubscriptionId = paymentData.id.toString();
        user.subscription.currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
        break;

      case 'rejected':
        user.subscription.status = 'canceled';
        break;

      case 'pending':
        user.subscription.status = 'pending';
        break;

      case 'in_process':
        user.subscription.status = 'pending';
        break;
    }

    await user.save();

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error en el webhook:', error);
    return NextResponse.json(
      { error: 'Error al procesar el webhook' },
      { status: 500 }
    );
  }
} 