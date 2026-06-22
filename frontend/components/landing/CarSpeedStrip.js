'use client';

import { motion } from 'framer-motion';

export default function CarSpeedStrip() {
  // Tres carros que corren a distintas velocidades y retrasos
  const carros = [
    { id: 1, color: 'var(--primary)', shadowColor: 'var(--glow-car-primary)', duration: 3.5, delay: 0, scale: 0.85, type: 'sport' },
    { id: 2, color: 'var(--cyan)', shadowColor: 'var(--glow-car-cyan)', duration: 2.2, delay: 1.5, scale: 0.75, type: 'race' },
    { id: 3, color: 'var(--secondary)', shadowColor: 'var(--glow-car-secondary)', duration: 4.5, delay: 0.5, scale: 0.8, type: 'sport' }
  ];

  return (
    <div className="relative w-full h-[60px] bg-lavender border-t border-b border-primary/10 overflow-hidden flex items-center shadow-sm select-none">
      
      {/* Marquee sutil de fondo para textura deportiva */}
      <div className="absolute inset-0 flex items-center opacity-[0.06] text-navy whitespace-nowrap pointer-events-none font-mono font-black text-4xl italic tracking-wider">
        <div className="animate-marquee flex gap-12">
          <span>TUNING & PERFORMANCE</span>
          <span>•</span>
          <span>EXPRESS MAINTENANCE</span>
          <span>•</span>
          <span>HIGH FIDELITY SERVICE</span>
          <span>•</span>
          <span>RACING PIT STOP</span>
          <span>•</span>
        </div>
        <div className="animate-marquee2 absolute top-0 flex gap-12">
          <span>TUNING & PERFORMANCE</span>
          <span>•</span>
          <span>EXPRESS MAINTENANCE</span>
          <span>•</span>
          <span>HIGH FIDELITY SERVICE</span>
          <span>•</span>
          <span>RACING PIT STOP</span>
          <span>•</span>
        </div>
      </div>

      {/* Línea divisoria central de la pista */}
      <div className="absolute inset-y-0 left-0 right-0 h-[2px] my-auto bg-dashed-track flex justify-between px-2 opacity-40" />

      {/* Flujo de automóviles a alta velocidad */}
      {carros.map((car) => (
        <motion.div
          key={car.id}
          initial={{ x: '120vw' }}
          animate={{ x: '-30vw' }}
          transition={{
            duration: car.duration,
            repeat: Infinity,
            delay: car.delay,
            ease: 'linear'
          }}
          className="absolute flex items-center z-10 pointer-events-none"
          style={{ 
            scale: car.scale,
            filter: `drop-shadow(0 0 6px ${car.shadowColor})`
          }}
        >
          {/* Luz trasera de estela */}
          <div 
            className="w-16 h-1 rounded-full mr-[-4px]" 
            style={{ backgroundImage: `linear-gradient(to left, ${car.color}, transparent)` }}
          />

          {/* SVG del carro minimalista corriendo */}
          <svg width="70" height="20" viewBox="0 0 70 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path 
              d="M2 15C2 15 5 11 12 9C19 7 24 3 36 2C48 1 58 5 62 10C66 15 68 16 64 17C60 18 5 18 2 17C-1 16 -1 15 2 15Z" 
              fill={car.color} 
            />
            {/* Cabina */}
            <path d="M28 5C32 2.5 45 2.5 50 6C52 7.5 49 10 40 10C31 10 26 8.5 28 5Z" fill="#0f172a" />
            {/* Neon underglow */}
            <line x1="12" y1="17.5" x2="58" y2="17.5" stroke={car.color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
      ))}

      {/* Estilos locales para animación Marquee y pista */}
      <style jsx>{`
        .bg-dashed-track {
          border-top: 2px dashed var(--color-track-border);
          width: 100%;
        }
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-100%); }
        }
        @keyframes marquee2 {
          0% { transform: translateX(100%); }
          100% { transform: translateX(0%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee2 {
          animation: marquee2 25s linear infinite;
        }
      `}</style>
    </div>
  );
}
