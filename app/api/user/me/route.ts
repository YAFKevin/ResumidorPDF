import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  try {
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

    await connectMongoDB();

    // Obtener el usuario actual
    const user = await User.findById(userId).select('-password -verificationToken -verificationTokenExpiry');
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error al obtener datos del usuario:', error);
    return NextResponse.json(
      { error: 'Error al obtener datos del usuario' },
      { status: 500 }
    );
  }
} 