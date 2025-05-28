import { NextResponse } from 'next/server';
import mercadopago from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';

// Configurar MercadoPago
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();
    
    // Obtener el token de la cookie
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    await connectMongoDB();

    // Obtener el usuario actual
    const user = await User.findOne({ _id: token });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Definir los precios según el plan
    const prices = {
      pro: {
        price: 9.99,
        name: 'Plan Pro',
        features: [
          '50 resúmenes por mes',
          'PDFs hasta 50MB',
          'Resúmenes avanzados',
          'Acceso prioritario a la API',
          'Soporte por email',
        ],
      },
      enterprise: {
        price: 29.99,
        name: 'Plan Empresarial',
        features: [
          'Resúmenes ilimitados',
          'PDFs hasta 100MB',
          'Resúmenes premium',
          'API dedicada',
          'Soporte 24/7',
          'Panel de administración',
        ],
      },
    };

    const selectedPlan = prices[plan as keyof typeof prices];

    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Plan no válido' },
        { status: 400 }
      );
    }

    // Crear la preferencia de pago
    const preference = {
      items: [
        {
          title: selectedPlan.name,
          description: selectedPlan.features.join('\n'),
          unit_price: selectedPlan.price,
          quantity: 1,
          currency_id: 'PEN', // Moneda en Soles
        },
      ],
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
        failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?error=payment_failed`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?status=pending`,
      },
      auto_return: 'approved',
      external_reference: user._id.toString(),
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
      metadata: {
        userId: user._id.toString(),
        plan: plan,
      },
    };

    const response = await mercadopago.preferences.create(preference);

    return NextResponse.json({
      init_point: response.body.init_point,
      preferenceId: response.body.id,
    });
  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
} 