'use client';
import { motion } from 'framer-motion';

export default function CarBrands() {
const marcas = [
  {
    name: 'Toyota',
    origin: 'Japón',
    logo: (
      <svg
        className="w-10 h-6 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 32 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <ellipse cx="16" cy="10" rx="15" ry="9" />
        <ellipse cx="16" cy="10" rx="9" ry="6" />
        <ellipse cx="16" cy="7" rx="5" ry="4" />
      </svg>
    )
  },
  {
    name: 'Jeep',
    origin: 'Estados Unidos',
    logo: (
      <svg
        className="w-10 h-6 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 32 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <circle cx="8" cy="15" r="2" />
        <circle cx="24" cy="15" r="2" />
        <path d="M4 15V9h20l4 3v3" />
        <path d="M10 9V5h8v4" />
        <path d="M6 7h1M9 7h1M12 7h1M15 7h1M18 7h1" />
      </svg>
    )
  },
  {
    name: 'Ford',
    origin: 'Estados Unidos',
    logo: (
      <svg
        className="w-12 h-6 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 40 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <ellipse cx="20" cy="10" rx="18" ry="8" />
        <path d="M12 10h8M12 6v8M20 6h6" />
      </svg>
    )
  },
  {
    name: 'Land Rover',
    origin: 'Reino Unido',
    logo: (
      <svg
        className="w-12 h-6 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 40 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <ellipse cx="20" cy="10" rx="18" ry="8" />
        <path d="M10 10h8M20 10h10" />
      </svg>
    )
  },
  {
    name: 'Nissan',
    origin: 'Japón',
    logo: (
      <svg
        className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M5 12h14" />
        <path d="M8 9v6M16 9v6" />
      </svg>
    )
  },
  {
    name: 'Mitsubishi',
    origin: 'Japón',
    logo: (
      <svg
        className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 2l3 5-3 5-3-5 3-5z" />
        <path d="M5 13l5 0-3 5-5 0 3-5z" />
        <path d="M19 13l3 5-5 0-3-5h5z" />
      </svg>
    )
  },
  {
    name: 'Suzuki',
    origin: 'Japón',
    logo: (
      <svg
        className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M16 4H9l6 6H8l-2 4h7l-6 6h7l8-8-6-8z" />
      </svg>
    )
  },
  {
    name: 'RAM',
    origin: 'Estados Unidos',
    logo: (
      <svg
        className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors duration-300"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      >
        <path d="M7 18c0-4 2-7 5-7s5 3 5 7" />
        <path d="M9 11V7l3-2 3 2v4" />
        <path d="M7 18h10" />
      </svg>
    )
  }
];
  // Duplicar la lista para lograr un scroll infinito fluido
  const doubleMarcas = [...marcas, ...marcas, ...marcas];

  return (
    <section className="py-14 bg-lavender border-b border-primary/10 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-lavender to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-lavender to-transparent z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-8 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-primary uppercase block mb-1">
          COBERTURA MULTIMARCA DE ALTA GAMA
        </span>
        <h4 className="text-lg font-bold text-navy tracking-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
          Especialistas en todo tipo de vehículo para off road, urbano y deportivo
        </h4>
      </div>

      {/* Marquee horizontal infinito */}
      <div className="w-full flex overflow-hidden py-4 relative">
        <motion.div
          animate={{ x: ['0%', '-33.33%'] }}
          transition={{ duration: 22, ease: 'linear', repeat: Infinity }}
          className="flex gap-16 items-center whitespace-nowrap min-w-max"
        >
          {doubleMarcas.map((marca, index) => (
            <div key={index} className="flex flex-col items-center justify-center min-w-[130px] group select-none gap-2">
              <div className="h-10 flex items-center justify-center">
                {marca.logo}
              </div>
              <span 
                className="text-xs font-bold text-gray-500 group-hover:text-primary transition-colors duration-300"
                style={{ fontFamily: "'Readex Pro', sans-serif" }}
              >
                {marca.name}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
