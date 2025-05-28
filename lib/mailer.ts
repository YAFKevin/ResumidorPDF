import nodemailer from 'nodemailer';

interface MailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
}

// Configuración del transportador de Nodemailer
export const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE === 'gmail' ? 'gmail' : undefined, // Usar servicio 'gmail' si se especifica
  host: process.env.EMAIL_SERVICE !== 'gmail' ? process.env.EMAIL_HOST : undefined, // Usar host solo si no es servicio 'gmail'
  port: process.env.EMAIL_SERVICE === 'gmail' ? 465 : (process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT as string) : undefined), // Puerto 465 para Gmail, o el especificado para otros
  secure: process.env.EMAIL_SERVICE === 'gmail' || process.env.EMAIL_PORT === '465', // true para Gmail o puerto 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email: string, token: string) => {
  try {
    // Asegúrate de que NEXT_PUBLIC_BASE_URL esté definido
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      console.error('Error: NEXT_PUBLIC_BASE_BASE_URL no está definido en las variables de entorno.');
      // No lanzar un error fatal aquí para no detener el proceso de registro si falla el correo
      // return;
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-email/${token}`;

    const mailOptions: MailOptions = {
      from: process.env.EMAIL_USER || 'no-reply@yourdomain.com', // Reemplaza con tu dominio si es necesario
      to: email,
      subject: 'Verifica tu correo electrónico para ResumIA',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; padding: 20px;">
          <h2 style="color: #0056b3;">¡Bienvenido a ResumIA!</h2>
          <p>Hola,</p>
          <p>Gracias por registrarte en ResumIA. Para activar tu cuenta y empezar a resumir tus documentos, por favor verifica tu dirección de correo electrónico haciendo clic en el botón de abajo:</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
              Verificar Correo Electrónico
            </a>
          </div>

          <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
          <p><a href="${verificationUrl}" style="word-break: break-all; color: #007bff;">${verificationUrl}</a></p>

          <p>Este enlace es válido por 1 hora.</p>

          <p>Si no te registraste en ResumIA, por favor ignora este correo.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #666;">El equipo de ResumIA</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Correo de verificación enviado a ${email}: ${info.response}`);

  } catch (error) {
    console.error('Error al enviar el correo de verificación:', error);
    // No lanzar el error aquí para no detener la ruta API, solo loggearlo
  }
}; 