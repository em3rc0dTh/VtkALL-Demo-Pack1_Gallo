'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Wrench } from 'lucide-react';

export default function Hero({ taller = {}, onOpenChat }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  return (
    <section id="inicio" className="relative h-screen flex items-center justify-center overflow-hidden bg-[#070b13]">
      {/* Background Image Overlay with Ken Burns Zoom Effect */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105"
        style={{ 
          backgroundImage: `url('https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&q=80&w=1920')`,
          animation: 'zoomSlow 30s infinite alternate'
        }}
      />
      
      {/* Sleek Dark Vignette and Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/70 to-[#070b13]/90" />
      
      {/* Interactive Glowing Tech Accent */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-orange-600/10 blur-[120px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-[120px] animate-pulse" />

      {/* Hero Content Wrapper */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 flex flex-col items-center">
        {/* Uppercase Small Tag */}
        <motion.span 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider text-orange-500 bg-orange-500/10 border border-orange-500/20 mb-6 uppercase"
        >
          <Wrench className="w-3.5 h-3.5" /> TECNOLOGÍA Y CONFIANZA
        </motion.span>

        {/* Large Overlapping Heading */}
        <div className="mb-6 flex flex-col items-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-[#94a3b8] leading-none tracking-tighter"
          >
            Precisión.
          </motion.h1>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-orange-500 leading-none tracking-tighter -mt-2 sm:-mt-3 md:-mt-4 relative"
            style={{ textShadow: '0 0 40px rgba(249, 115, 22, 0.15)' }}
          >
            Profesionalismo.
          </motion.h1>
        </div>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed font-light"
        >
          El cuidado de alta fidelidad que tu vehículo merece, asistido las 24 horas por <span className="text-white font-medium">{nombreAgente}</span>, nuestro agente inteligente de reservas.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a
            href="#servicios"
            className="px-8 py-3.5 rounded-full text-sm font-semibold border border-gray-700 bg-gray-900/50 backdrop-blur text-white hover:bg-gray-800 hover:border-gray-600 transition-all duration-300"
          >
            Ver Servicios
          </a>
          <button
            onClick={onOpenChat}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all duration-300 shadow-lg shadow-orange-600/20 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 fill-current" /> Agendar con {nombreAgente}
          </button>
        </motion.div>
      </div>

      {/* CSS Animation for Background Ken Burns effect */}
      <style jsx global>{`
        @keyframes zoomSlow {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.08) translate(-1%, -1%); }
        }
      `}</style>
    </section>
  );
}
