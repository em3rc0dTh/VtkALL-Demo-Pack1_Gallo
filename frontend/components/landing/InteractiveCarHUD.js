'use client';

import { motion } from 'framer-motion';

export default function InteractiveCarHUD() {
  return (
    <section id="diagnostico-interactivo" className="py-24 bg-dark-bg relative border-b border-gray-900 overflow-hidden">
      
      {/* Luces de cuadrícula neon en el fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--dark-card)_1px,transparent_1px),linear-gradient(to_bottom,var(--dark-card)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-widest text-scanner uppercase block mb-3">
            ESCANEO DIGITAL HOLOGRÁFICO
          </span>
          <div className="w-12 h-1 bg-scanner mx-auto mt-4 rounded-full" />
        </div>

        {/* HUD Content Area (Centered Blueprint) */}
        <div className="flex flex-col justify-center items-center">
          
          <div className="w-full max-w-3xl flex flex-col justify-center items-center bg-dark-panel/45 border border-gray-900 rounded-3xl p-6 sm:p-12 relative overflow-hidden h-[260px] sm:h-[340px] shadow-2xl">
            
            {/* Escáner Neon Line en barrido infinito */}
            <motion.div 
              animate={{ x: ['-5%', '105%', '-5%'] }}
              transition={{ duration: 4, ease: 'easeInOut', repeat: Infinity }}
              className="absolute inset-y-0 w-1 bg-gradient-to-b from-scanner/20 via-scanner to-scanner/20 z-20 shadow-scanner-glow"
            />

            {/* SVG del Blueprint del Auto */}
            <svg viewBox="0 0 450 180" className="w-full max-w-[520px] select-none z-10" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Estructura/Líneas de chasis del blueprint */}
              <path 
                d="M40 120C40 120 50 100 80 90C110 80 130 50 180 40C230 30 300 35 340 55C380 75 420 90 430 105C440 120 420 130 400 132C380 134 70 134 50 132C30 130 30 120 40 120Z" 
                stroke="#334155" 
                strokeWidth="1.2" 
                strokeDasharray="4 2"
              />
              <path 
                d="M45 122H405" 
                stroke="#1e293b" 
                strokeWidth="1.5"
              />
              <path 
                d="M170 42C190 35 270 35 305 52" 
                stroke="#475569" 
                strokeWidth="1"
              />

              {/* Rueda delantera wireframe */}
              <circle cx="105" cy="122" r="28" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="105" cy="122" r="14" stroke="#1e293b" strokeWidth="1" />
              
              {/* Rueda trasera wireframe */}
              <circle cx="340" cy="122" r="28" stroke="#475569" strokeWidth="1.2" strokeDasharray="3 3" />
              <circle cx="340" cy="122" r="14" stroke="#1e293b" strokeWidth="1" />

              {/* HOTSPOT 1: Motor */}
              <g className="cursor-pointer">
                <circle 
                  cx="160" 
                  cy="75" 
                  r="7" 
                  fill="rgba(239, 68, 68, 0.1)" 
                  stroke="#ef4444" 
                  strokeWidth="1.5"
                />
                <circle cx="160" cy="75" r="2" fill="#ef4444" />
                <circle cx="160" cy="75" r="14" stroke="#ef4444" strokeWidth="0.5" opacity="0.4" className="animate-ping" />
              </g>

              {/* HOTSPOT 2: Frenos */}
              <g className="cursor-pointer">
                <circle 
                  cx="105" 
                  cy="122" 
                  r="7" 
                  fill="rgba(249, 115, 22, 0.1)" 
                  stroke="var(--scanner-color)" 
                  strokeWidth="1.5"
                />
                <circle cx="105" cy="122" r="2" fill="var(--scanner-color)" />
                <circle cx="105" cy="122" r="14" stroke="var(--scanner-color)" strokeWidth="0.5" opacity="0.4" className="animate-ping" />
              </g>

              {/* HOTSPOT 3: Transmisión */}
              <g className="cursor-pointer">
                <circle 
                  cx="235" 
                  cy="98" 
                  r="7" 
                  fill="rgba(16, 185, 129, 0.1)" 
                  stroke="#10b981" 
                  strokeWidth="1.5"
                />
                <circle cx="235" cy="98" r="2" fill="#10b981" />
                <circle cx="235" cy="98" r="14" stroke="#10b981" strokeWidth="0.5" opacity="0.4" className="animate-ping" />
              </g>

              {/* HOTSPOT 4: Suspensión */}
              <g className="cursor-pointer">
                <circle 
                  cx="340" 
                  cy="122" 
                  r="7" 
                  fill="rgba(234, 179, 8, 0.1)" 
                  stroke="#eab308" 
                  strokeWidth="1.5"
                />
                <circle cx="340" cy="122" r="2" fill="#eab308" />
                <circle cx="340" cy="122" r="14" stroke="#eab308" strokeWidth="0.5" opacity="0.4" className="animate-ping" />
              </g>
            </svg>

          </div>
        </div>

      </div>
    </section>
  );
}
