import { NextResponse } from 'next/server';
import connectMongoDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: Request, { params }: { params: { token: string } }) {
  const { token } = params;

  try {
    await connectMongoDB();

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });

    if (!user) {
      // Redirigir a login con mensaje de error
      return NextResponse.redirect(new URL('/login?error=token_invalido', request.url));
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    // Redirigir a login con mensaje de éxito
    return NextResponse.redirect(new URL('/login?success=verificacion_exitosa', request.url));

  } catch (error) {
    console.error('Error al verificar el correo:', error);
    return NextResponse.redirect(new URL('/login?error=error_servidor', request.url));
  }
} 