import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('Webhook simplificado: Solicitud recibida');
  try {
    // Opcional: leer y loguear el cuerpo para depuración si llega hasta aquí
    // const rawBody = await request.text();
    // console.log('Webhook simplificado: Cuerpo recibido', rawBody);
    
    // Devolver 200 OK inmediatamente
    return NextResponse.json({ received: true }, { status: 200 });
    
  } catch (error: any) {
    console.error('Webhook simplificado: Error al procesar solicitud', error);
    return NextResponse.json(
      { error: 'Error interno al procesar webhook simplificado' },
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