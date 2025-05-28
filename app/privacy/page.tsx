import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>1. Información que Recopilamos</h2>
          <p>
            Recopilamos información que usted nos proporciona directamente, incluyendo:
          </p>
          <ul>
            <li>Información de contacto (nombre, correo electrónico)</li>
            <li>Documentos que sube para su procesamiento</li>
            <li>Información de la cuenta y preferencias</li>
          </ul>

          <h2>2. Uso de la Información</h2>
          <p>
            Utilizamos la información recopilada para:
          </p>
          <ul>
            <li>Proporcionar y mantener nuestros servicios</li>
            <li>Procesar y enviar sus resúmenes</li>
            <li>Mejorar nuestros servicios</li>
            <li>Comunicarnos con usted sobre su cuenta</li>
          </ul>

          <h2>3. Protección de Datos</h2>
          <p>
            Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales.
            Sus documentos son procesados de manera segura y eliminados después de su procesamiento.
          </p>

          <h2>4. Sus Derechos</h2>
          <p>
            Usted tiene derecho a:
          </p>
          <ul>
            <li>Acceder a sus datos personales</li>
            <li>Rectificar información incorrecta</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Oponerse al procesamiento de sus datos</li>
          </ul>

          <h2>5. Contacto</h2>
          <p>
            Si tiene preguntas sobre nuestra política de privacidad, puede contactarnos en:
            <br />
            Email: privacy@resumia.com
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
} 