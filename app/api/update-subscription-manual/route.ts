import { NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!
});

export async function POST(request: Request) {
  console.log('API Update Manual: Solicitud POST recibida'); // Log API Manual 1
  try {
    console.log('API Update Manual: Dentro del try'); // Log API Manual 2

    // Autenticar al usuario (asegurarse de que está logueado)
    const token = request.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    console.log('API Update Manual: Token obtenido de cookie', token ? 'Token presente' : 'Token ausente'); // Log API Manual 3

    if (!token) {
       console.error('API Update Manual: No autorizado - Token no encontrado'); // Log API Manual 3a
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    let userId = null;
    try {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_seguro');
      userId = decoded.userId;
      console.log(`API Update Manual: Token verificado, userId: ${userId}`); // Log API Manual 4
    } catch (error) {
      console.error('API Update Manual: Error al verificar token JWT:', error); // Log API Manual 4a
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Obtener el ID de pago de la solicitud (enviado desde el frontend)
    const { paymentId } = await request.json();
    console.log(`API Update Manual: paymentId recibido: ${paymentId}`); // Log API Manual 5

    if (!paymentId) {
      console.error('API Update Manual: ID de pago faltante'); // Log API Manual 5a
      return NextResponse.json({ error: 'ID de pago faltante' }, { status: 400 });
    }

    await connectMongoDB();
    console.log('API Update Manual: Conectado a MongoDB'); // Log API Manual 6

    const user = await User.findById(userId);
    console.log('API Update Manual: Usuario encontrado', user ? user._id : 'null'); // Log API Manual 7

    if (!user) {
      console.error('API Update Manual: Usuario no encontrado para ID:', userId); // Log API Manual 7a
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Obtener los detalles del pago de Mercado Pago
    console.log(`API Update Manual: Intentando obtener pago de MP con ID: ${paymentId}`); // Log API Manual 8
    const payment = new Payment(client);
    let paymentData;
    try {
      paymentData = await payment.get({ id: paymentId });
      console.log('API Update Manual: Datos de pago obtenidos de MP', paymentData); // Log API Manual 9
    } catch (error) {
      console.error('API Update Manual: Error al obtener pago de MP:', error);
      return NextResponse.json({ error: 'Error al obtener datos del pago' }, { status: 500 });
    }

    if (!paymentData) {
      console.warn(`API Update Manual: Pago no encontrado en MP: ${paymentId}`); // Log API Manual 9a
      return NextResponse.json({ message: 'Pago no encontrado' }, { status: 200 });
    }

    if (paymentData.status !== 'approved') {
      console.warn(`API Update Manual: Pago no aprobado en MP: ${paymentId}. Estado: ${paymentData.status}`); // Log API Manual 9b
      return NextResponse.json({ message: 'Pago no aprobado' }, { status: 200 });
    }

    console.log('API Update Manual: Pago aprobado encontrado en MP'); // Log API Manual 9c

    // Verificar que el pago pertenece al usuario logueado
    if (paymentData.external_reference !== user._id.toString()) {
      console.error('API Update Manual: ID de usuario no coincidente en pago de MP', { 
        paymentUserId: paymentData.external_reference, 
        loggedInUserId: user._id.toString() 
      }); // Log API Manual 10
      return NextResponse.json({ error: 'Pago no corresponde al usuario' }, { status: 403 });
    }
    console.log('API Update Manual: Usuario del pago coincide con usuario logueado');

    // Actualizar el estado de la suscripción
    if (user.subscription.status !== 'active') {
      console.log('API Update Manual: Usuario no activo, procediendo a actualizar suscripción'); // Log API Manual 11
      user.subscription.status = 'active';
      let periodDuration = 30 * 24 * 60 * 60 * 1000;
      const plan = paymentData.metadata?.plan || 'mensual';

      if (plan === 'anual') {
        periodDuration = 365 * 24 * 60 * 60 * 1000;
      }

      user.subscription.plan = plan;

      const now = new Date();
      const currentPeriodEnd = user.subscription.currentPeriodEnd && user.subscription.currentPeriodEnd > now 
        ? user.subscription.currentPeriodEnd 
        : now;
      user.subscription.currentPeriodEnd = new Date(currentPeriodEnd.getTime() + periodDuration);

      if (paymentData.id) {
        user.subscription.mercadopagoSubscriptionId = paymentData.id.toString();
      }

      console.log('API Update Manual: Intentando guardar usuario actualizado'); // Log API Manual 12
      try {
        await user.save();
        console.log('API Update Manual: Usuario guardado exitosamente'); // Log API Manual 13
        return NextResponse.json({ success: true, message: 'Suscripción actualizada correctamente' });
      } catch (error) {
        console.error('API Update Manual: Error al guardar usuario:', error);
        return NextResponse.json({ error: 'Error al actualizar la suscripción' }, { status: 500 });
      }
    } else {
      console.log('API Update Manual: Usuario ya activo, no se necesita actualizar'); // Log API Manual 14
      return NextResponse.json({ success: true, message: 'Usuario ya tiene una suscripción activa' });
    }

  } catch (error: any) {
    console.error('API Update Manual Log CATCH: Error general:', error); // Log API Manual CATCH
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 