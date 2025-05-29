import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    await connectMongoDB();

    // Buscar usuario por email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Verificar si el usuario está verificado
    if (!user.isVerified) {
      return NextResponse.json(
        { error: 'Por favor, verifica tu correo electrónico antes de iniciar sesión' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // Generar token JWT
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'tu_secreto_seguro',
      { expiresIn: '24h' }
    );

    // Crear la respuesta
    const response = NextResponse.json({
      message: 'Inicio de sesión exitoso',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        subscriptionStatus: user.subscription?.status || 'inactive',
      }
    });

    // Guardar el token en una cookie
    response.cookies.set({
      name: 'token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 // 24 horas
    });

    return response;

  } catch (error) {
    console.error('Error en el inicio de sesión:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 