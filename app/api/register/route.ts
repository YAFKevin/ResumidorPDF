import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '@/lib/mailer'; // Asumimos que crearás este archivo

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password } = body;

    // Validar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'El usuario con este correo ya existe.' }, { status: 400 });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generar token de verificación (esto es un ejemplo simple)
    const verificationToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const verificationTokenExpiry = new Date(Date.now() + 3600000); // 1 hora

    // Crear y guardar el nuevo usuario
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiry,
    });

    // Enviar correo de verificación (implementaremos sendVerificationEmail después)
    await sendVerificationEmail(newUser.email, verificationToken);

    return NextResponse.json({
      message: 'Usuario registrado exitosamente. Por favor, verifica tu correo.',
      user: { name: newUser.name, email: newUser.email, isVerified: newUser.isVerified }
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error en el registro:', error);
    return NextResponse.json(
      { error: error.message || 'Error en el servidor al registrar usuario.' },
      { status: 500 }
    );
  }
} 