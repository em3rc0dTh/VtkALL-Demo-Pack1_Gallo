'use client';

import { motion } from 'framer-motion';

export default function InsurancePartners() {
  const partners = [
    { name: 'RIMAC', desc: 'Seguros' },
    { name: 'PACÍFICO', desc: 'Seguros' },
    { name: 'MAPFRE', desc: 'Multinacional' },
    { name: 'LA POSITIVA', desc: 'Seguros' },
    { name: 'QUALITAS', desc: 'Cobertura' },
    { name: 'INTERSEGURO', desc: 'Vehicular' },
  ];

  // Duplicar la lista de partners para lograr un scroll infinito fluido
  const doublePartners = [...partners, ...partners, ...partners];

  return (
    <section className="py-12 bg-[#F4F5FF] border-t border-b border-primary/10 overflow-hidden relative">
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#F4F5FF] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#F4F5FF] to-transparent z-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 md:px-8 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-primary uppercase block mb-1">
            RESPALDO Y CONFIANZA
          </span>
          <h4 className="text-lg font-bold text-navy tracking-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
            Trabajamos con todos los Seguros Vehiculares
          </h4>
        </div>
        <p className="text-[#54595F] text-xs font-light max-w-sm sm:text-right">
          Gestionamos el planchado, pintura y reparaciones mecánicas de tu auto directamente con tu compañía aseguradora favorita.
        </p>
      </div>

      {/* Marquee de logos con movimiento infinito en Framer Motion */}
      <div className="w-full flex overflow-hidden py-4 relative">
        <motion.div 
          animate={{ x: ['0%', '-33.33%'] }}
          transition={{ duration: 18, ease: 'linear', repeat: Infinity }}
          className="flex gap-16 items-center whitespace-nowrap min-w-max"
        >
          {doublePartners.map((partner, index) => (
            <div key={index} className="flex flex-col items-center justify-center min-w-[120px] group select-none">
              <span className="text-xl font-black text-gray-400 font-bebas tracking-widest group-hover:text-primary transition-colors duration-300" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {partner.name}
              </span>
              <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mt-0.5 group-hover:text-[#54595F] transition-colors duration-300">
                {partner.desc}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
