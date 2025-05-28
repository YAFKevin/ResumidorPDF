import Link from 'next/link';

const plans = [
  {
    name: 'Plan Gratuito',
    price: '0',
    features: [
      '5 resúmenes por mes',
      'PDFs hasta 10MB',
      'Resúmenes básicos',
      'Acceso a la API',
    ],
    cta: 'Comenzar gratis',
    href: '/register',
    featured: false,
  },
  {
    name: 'Plan Pro',
    price: '9.99',
    features: [
      '50 resúmenes por mes',
      'PDFs hasta 50MB',
      'Resúmenes avanzados',
      'Acceso prioritario a la API',
      'Soporte por email',
    ],
    cta: 'Comenzar prueba gratuita',
    href: '/register?plan=pro',
    featured: true,
  },
  {
    name: 'Plan Empresarial',
    price: '29.99',
    features: [
      'Resúmenes ilimitados',
      'PDFs hasta 100MB',
      'Resúmenes premium',
      'API dedicada',
      'Soporte 24/7',
      'Panel de administración',
    ],
    cta: 'Contactar ventas',
    href: '/contact',
    featured: false,
  },
];

export default function Pricing() {
  return (
    <div className="bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Planes y Precios
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-lg shadow-sm divide-y divide-gray-200 ${
                plan.featured
                  ? 'border-2 border-blue-500'
                  : 'border border-gray-200'
              }`}
            >
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {plan.name}
                </h2>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${plan.price}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /mes
                  </span>
                </p>
                <Link
                  href={plan.href}
                  className={`mt-8 block w-full bg-${
                    plan.featured ? 'blue' : 'gray'
                  }-600 border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-${
                    plan.featured ? 'blue' : 'gray'
                  }-700`}
                >
                  {plan.cta}
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                  Características
                </h3>
                <ul className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 