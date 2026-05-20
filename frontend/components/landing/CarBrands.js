'use client';
import { motion } from 'framer-motion';

export default function CarBrands() {
  const marcas = [
    { 
      name: 'Mercedes-Benz', 
      origin: 'Alemania',
      logo: (
        <svg className="w-8 h-8 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2v10M12 12l-8.66 5M12 12l8.66 5" />
        </svg>
      )
    },
    { 
      name: 'Fiat', 
      origin: 'Italia',
      logo: (
        <svg className="w-8 h-8 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="6" width="20" height="12" rx="3" />
          <path d="M6 9h3M7.5 9v6M11 9v6M13 9h3M14.5 9v6" />
        </svg>
      )
    },
    { 
      name: 'Mini', 
      origin: 'Reino Unido',
      logo: (
        <svg className="w-10 h-6 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 40 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="20" cy="12" r="5" />
          <path d="M6 12c3 0 5-3 8-3M34 12c-3 0-5-3-8-3M6 12c3 0 5 3 8 3M34 12c-3 0-5 3-8 3" />
        </svg>
      )
    },
    { 
      name: 'Kia', 
      origin: 'Corea del Sur',
      logo: (
        <svg className="w-10 h-6 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 32 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4 2v12M4 8l5-6M4 8l5 6M13 2v12M18 14l4-12l4 12M20 9h4" />
        </svg>
      )
    },
    { 
      name: 'Volvo', 
      origin: 'Suecia',
      logo: (
        <svg className="w-8 h-8 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="13" r="6" />
          <path d="M15 9l6-6M16 3h5v5" />
        </svg>
      )
    },
    { 
      name: 'Ferrari', 
      origin: 'Italia',
      logo: (
        <svg className="w-8 h-8 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M5 3h14v10c0 5-7 8-7 8s-7-3-7-8V3z" />
          <path d="M12 6c0.5 0.5 0.5 1.5 0 2c-0.5 0.5-0.5 1-0.5 2h1.5c0-1.5 1-1.5 0.5-3.5" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      )
    },
    { 
      name: 'Porsche', 
      origin: 'Alemania',
      logo: (
        <svg className="w-8 h-8 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 3h12v12c0 4-6 6-6 6s-6-2-6-6V3z" strokeLinecap="round" />
          <path d="M9 7h6M9 11h6" />
        </svg>
      )
    },
    { 
      name: 'Toyota', 
      origin: 'Japón',
      logo: (
        <svg className="w-10 h-6 text-gray-400 group-hover:text-[#2908F1] transition-colors duration-300" viewBox="0 0 32 20" fill="none" stroke="currentColor" strokeWidth="1.5">
          <ellipse cx="16" cy="10" rx="15" ry="9" />
          <ellipse cx="16" cy="10" rx="9" ry="6" />
          <ellipse cx="16" cy="7" rx="5" ry="4" />
        </svg>
      )
    }
  ];

  // Duplicar la lista para lograr un scroll infinito fluido
  const doubleMarcas = [...marcas, ...marcas, ...marcas];

  return (
    <section className="py-14 bg-[#EFF1FE] border-b border-[#2908F1]/10 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#EFF1FE] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#EFF1FE] to-transparent z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-8 text-center md:text-left">
        <span className="text-[10px] font-bold tracking-widest text-[#2908F1] uppercase block mb-1">
          COBERTURA MULTIMARCA DE ALTA GAMA
        </span>
        <h4 className="text-lg font-bold text-[#0F172A] tracking-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
          Especialistas en Vehículos Importados y Nacionales
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
                className="text-xs font-bold text-gray-500 group-hover:text-[#2908F1] transition-colors duration-300"
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
