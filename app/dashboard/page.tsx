'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [userPlan, setUserPlan] = useState({ status: 'free', plan: 'free' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/user/me');
        if (response.ok) {
          const data = await response.json();
          setUserPlan(data.subscription);
        } else {
           // Si no se puede obtener el usuario, redirigir al login
           router.push('/login');
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        // Si hay un error, redirigir al login
        router.push('/login');
      }
    };

    fetchUserData();

    // Verificar parámetros de URL para mensajes de pago y actualización manual
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('payment');
    const errorStatus = searchParams.get('error');
    const paymentId = searchParams.get('preference_id'); // MercadoPago a veces usa preference_id en la redirección

    if (paymentStatus === 'success') {
      setMessage('Pago realizado con éxito. Verificando tu plan...');

      // Intentar actualización manual usando el paymentId (si está disponible)
      if (paymentId) {
        const updateSubscription = async () => {
          try {
             // Obtener el token de la cookie para la autorización
            const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];

            const response = await fetch('/api/update-subscription-manual', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                 // Incluir el token en los encabezados
                'Cookie': `token=${token}`
              },
              body: JSON.stringify({ paymentId }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
              setMessage('¡Tu plan ha sido actualizado!');
              // Opcional: Volver a obtener los datos del usuario para reflejar el cambio inmediatamente
              fetchUserData();
            } else if (response.ok && data.message) {
               // Mensaje de que el pago no fue aprobado o ya estaba activo
               setMessage(data.message);
               fetchUserData(); // Reflejar el estado actual
            } else {
              console.error('Error en la actualización manual:', data.error);
              setMessage(data.error || 'Error al actualizar tu plan automáticamente.');
            }
          } catch (error) {
            console.error('Error al llamar a la API de actualización manual:', error);
            setMessage('Error de conexión al intentar actualizar tu plan.');
          } finally {
            // Limpiar la URL después de intentar la actualización
            window.history.replaceState({}, document.title, '/dashboard');
          }
        };
        updateSubscription();
      } else {
         setMessage('Pago exitoso, pero no se encontró ID de pago para actualizar.');
         window.history.replaceState({}, document.title, '/dashboard');
      }

    } else if (errorStatus === 'payment_failed') {
      setMessage('Hubo un error al procesar el pago. Por favor, intenta nuevamente.');
      // Limpiar la URL
      window.history.replaceState({}, document.title, '/dashboard');
    } else {
       // Limpiar otros parámetros si existen y no son de pago
       const url = new URL(window.location.href);
       if (url.searchParams.toString() !== '') {
          window.history.replaceState({}, document.title, '/dashboard');
       }
    }

  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    const formData = new FormData();
    const file = fileInputRef.current?.files?.[0];

    if (!file) {
      setMessage('Por favor, selecciona un archivo PDF');
      setIsLoading(false);
      return;
    }

    formData.append('file', file);

    try {
      const response = await fetch('https://hook.us2.make.com/p7tq0lijvto2rwnf9m5bydkoqsukmwdq', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('Archivo enviado correctamente. Procesando...');
        // Aquí podrías implementar la lógica para mostrar el resumen cuando esté listo
      } else {
        setMessage('Error al procesar el archivo. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error:', error);
      setMessage('Error al conectar con el servidor. Por favor, intenta nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    // Eliminar la cookie de autenticación
    document.cookie = 'token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT;';
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y nombre */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">ResumIA</span>
              </Link>
            </div>

            {/* Menú de navegación */}
            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Inicio
              </Link>
              <Link href="/dashboard/history" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Historial
              </Link>
              <Link href="/dashboard/settings" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                Configuración
              </Link>
            </nav>

            {/* Perfil y menú desplegable */}
            <div className="flex items-center">
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">U</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Usuario</span>
                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                      isProfileMenuOpen ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Menú desplegable */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        href="/dashboard/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Mi Perfil
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Configuración
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                        role="menuitem"
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Plan Status */}
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Tu Plan Actual</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Estado: <span className="font-medium text-gray-900">{userPlan.status === 'active' ? 'Activo' : 'Gratuito'}</span></p>
              <p className="text-sm text-gray-500">Plan: <span className="font-medium text-gray-900">{userPlan.plan === 'free' ? 'Gratuito' : userPlan.plan === 'mensual' ? 'Plan Mensual' : 'Plan Anual'}</span></p>
            </div>
            {userPlan.status !== 'active' && (
              <Link
                href="/pricing"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
              >
                Actualizar Plan
              </Link>
            )}
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Resumidor de PDF con IA
          </h1>
          <p className="mt-3 text-xl text-gray-500 sm:mt-4">
            Sube tu archivo PDF y obtén un resumen generado por inteligencia artificial
          </p>
        </div>

        <div className="mt-12">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-full max-w-lg">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <svg
                          className="mx-auto h-12 w-12 text-gray-400"
                          stroke="currentColor"
                          fill="none"
                          viewBox="0 0 48 48"
                          aria-hidden="true"
                        >
                          <path
                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <div className="flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                          >
                            <span>Subir un archivo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept=".pdf"
                              className="sr-only"
                              ref={fileInputRef}
                            />
                          </label>
                          <p className="pl-1">o arrastrar y soltar</p>
                        </div>
                        <p className="text-xs text-gray-500">PDF hasta 10MB</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? 'Procesando...' : 'Generar Resumen'}
              </button>
            </div>
          </form>

          {message && (
            <div className="mt-4 text-center">
              <p className={`text-sm ${
                message.includes('correctamente') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </p>
            </div>
          )}
        </div>

        {/* Recent Summaries Section */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Resúmenes recientes</h2>
          <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-md">
            <ul className="divide-y divide-gray-200">
              {/* Aquí irán los resúmenes recientes */}
              <li className="px-6 py-4">
                <p className="text-sm text-gray-500">No hay resúmenes recientes</p>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
} 