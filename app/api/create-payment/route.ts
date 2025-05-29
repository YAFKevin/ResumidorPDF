import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

// Configurar MercadoPago
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN! 
});

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();
    
    // Obtener el token de la cookie
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    
    if (!token) {
      return NextResponse.json(
        { error: 'No autorizado: Token no encontrado' },
        { status: 401 }
      );
    }

    let userId = null;
    try {
      // Decodificar y verificar el token
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro');
      userId = decoded.userId;
    } catch (error) {
      console.error('Error al verificar token JWT:', error);
      return NextResponse.json(
        { error: 'No autorizado: Token inválido o expirado' },
        { status: 401 }
      );
    }

    if (!userId) {
       return NextResponse.json(
         { error: 'No autorizado: ID de usuario no encontrado en el token' },
         { status: 401 }
       );
    }

    await connectMongoDB();

    // Obtener el usuario actual usando el ID extraído del token
    const user = await User.findOne({ _id: userId });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Definir los precios según el plan
    const prices: { [key: string]: { price: number; name: string; features: string[] } } = {
      mensual: {
        price: 10,
        name: 'Plan Mensual',
        features: [
          '50 resúmenes por mes',
          'PDFs hasta 50MB',
          'Resúmenes avanzados',
          'Soporte por email',
        ],
      },
      anual: {
        price: 99,
        name: 'Plan Anual',
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

    const selectedPlan = prices[plan];

    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Plan no válido' },
        { status: 400 }
      );
    }

    // Crear la preferencia de pago
    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: [
          {
            id: plan,
            title: selectedPlan.name,
            description: selectedPlan.features.join('\n'),
            quantity: 1,
            currency_id: 'PEN',
            unit_price: selectedPlan.price,
          }
        ],
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?payment=success`,
          failure: `${process.env.NEXT_PUBLIC_BASE_URL}/pricing?error=payment_failed`,
          pending: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?status=pending`
        },
        auto_return: 'approved',
        external_reference: user._id.toString(),
        notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/webhooks/mercadopago`,
        statement_descriptor: selectedPlan.name,
        metadata: {
          userId: user._id.toString(),
          plan: plan,
          price: selectedPlan.price,
          description: selectedPlan.features.join('\n')
        }
      }
    });

    return NextResponse.json({
      init_point: result.init_point,
      preferenceId: result.id
    });
  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago' },
      { status: 500 }
    );
  }
} 