import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Terms() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Términos y Condiciones</h1>
        
        <div className="prose prose-lg max-w-none">
          <h2>1. Aceptación de los Términos</h2>
          <p>
            Al acceder y utilizar ResumIA, usted acepta estar sujeto a estos términos y condiciones.
            Si no está de acuerdo con alguna parte de estos términos, no podrá acceder al servicio.
          </p>

          <h2>2. Descripción del Servicio</h2>
          <p>
            ResumIA es un servicio que utiliza inteligencia artificial para generar resúmenes de documentos.
            El servicio incluye:
          </p>
          <ul>
            <li>Procesamiento de documentos PDF</li>
            <li>Generación de resúmenes automáticos</li>
            <li>Envío de resúmenes por correo electrónico</li>
          </ul>

          <h2>3. Uso del Servicio</h2>
          <p>
            Al utilizar nuestro servicio, usted acepta:
          </p>
          <ul>
            <li>Proporcionar información precisa y actualizada</li>
            <li>No utilizar el servicio para fines ilegales</li>
            <li>No intentar acceder a áreas restringidas del servicio</li>
            <li>No compartir su cuenta con terceros</li>
          </ul>

          <h2>4. Limitaciones del Servicio</h2>
          <p>
            ResumIA se proporciona "tal cual" y no garantizamos:
          </p>
          <ul>
            <li>Disponibilidad ininterrumpida del servicio</li>
            <li>Precisión absoluta en los resúmenes generados</li>
            <li>Compatibilidad con todos los tipos de documentos</li>
          </ul>

          <h2>5. Propiedad Intelectual</h2>
          <p>
            Todo el contenido y la tecnología utilizada en ResumIA están protegidos por derechos de autor
            y otras leyes de propiedad intelectual. No se permite la copia o uso no autorizado.
          </p>

          <h2>6. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de modificar estos términos en cualquier momento.
            Los cambios entrarán en vigor inmediatamente después de su publicación.
          </p>

          <h2>7. Contacto</h2>
          <p>
            Para preguntas sobre estos términos, contáctenos en:
            <br />
            Email: legal@resumia.com
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
} 