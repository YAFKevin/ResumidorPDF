import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Producto</h3>
            <ul className="mt-4 space-y-4">
              <li><Link href="/pricing" className="text-base text-gray-500 hover:text-gray-900">Precios</Link></li>
              <li><Link href="/features" className="text-base text-gray-500 hover:text-gray-900">Características</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Soporte</h3>
            <ul className="mt-4 space-y-4">
              <li><Link href="/contact" className="text-base text-gray-500 hover:text-gray-900">Contacto</Link></li>
              <li><Link href="/faq" className="text-base text-gray-500 hover:text-gray-900">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Legal</h3>
            <ul className="mt-4 space-y-4">
              <li><Link href="/privacy" className="text-base text-gray-500 hover:text-gray-900">Privacidad</Link></li>
              <li><Link href="/terms" className="text-base text-gray-500 hover:text-gray-900">Términos</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Social</h3>
            <ul className="mt-4 space-y-4">
              <li><a href="https://www.instagram.com/resum.ia/" target="_blank" rel="noopener noreferrer" className="text-base text-gray-500 hover:text-gray-900">Instagram</a></li>
              <li><a href="#" className="text-base text-gray-500 hover:text-gray-900">TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8">
          <p className="text-base text-gray-400 text-center">
            © 2025 ResumIA. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
} 