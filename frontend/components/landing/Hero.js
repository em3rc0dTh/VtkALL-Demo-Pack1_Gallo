'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Wrench } from 'lucide-react';
import PitStopAnimation from './PitStopAnimation.js';

export default function Hero({ taller = {}, onOpenChat }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  return (
    <section id="inicio" className="relative min-h-[600px] max-h-[965px] h-screen w-full overflow-hidden bg-gradient-to-br from-[#EAF0FF] via-[#EEF3FF] to-[#F4F5FF]">
      
      {/* Background Video (with CSS hue filter to turn the orange car into electric blue) */}
      {/* <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-12 pointer-events-none z-0"
        style={{ filter: 'hue-rotate(205deg) saturate(1.3)' }}
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260213_051817_c7d8ccc6-bfaa-417c-8474-e5cefeea26b4.mp4"
      /> */}

      {/* Electric blue car — right-side decorative video loop (replaces the static image) */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute right-0 bottom-0 w-full h-full object-cover object-right-bottom pointer-events-none z-[1]"
        style={{
          filter: 'brightness(1.05) saturate(1.15)',
          maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 18%, transparent 88%), linear-gradient(to top, rgba(0,0,0,1) 16%, transparent 86%)',
          WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 18%, transparent 88%), linear-gradient(to top, rgba(0,0,0,1) 16%, transparent 86%)',
          opacity: 0.28,
        }}
        src="/videos/PixVerse_V6_Image_Text_360P_“Create_a_seamless.mp4"
      />

      {/* Subtle Top & Bottom Gradient Overlays for Readability */}
      <div className="absolute top-0 left-0 right-0 h-[260px] bg-gradient-to-b from-white/90 via-[#EFF1FE]/55 to-transparent pointer-events-none z-[2]" />
      <div className="absolute bottom-0 left-0 right-0 h-[260px] bg-gradient-to-t from-white/90 via-[#F4F5FF]/60 to-transparent pointer-events-none z-[2]" />

      {/* Large Decorative All-Caps Backdrop Typography */}
      <div className="absolute inset-x-0 top-[12%] flex justify-center items-center pointer-events-none z-2">
        <h2 className="text-[12vw] font-bold tracking-widest text-center select-none uppercase font-bebas opacity-70"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'linear-gradient(180deg, rgba(41, 8, 241, 0.08) 0%, rgba(41, 8, 241, 0.01) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
          {(taller.nombre_taller || 'MECANICAPRO').replace(/\s+/g, '')}
        </h2>
      </div>

      {/* Main Foreground Content Grid */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-6 md:px-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full pt-16">
          
          {/* Left Side: Elegant Premium Copy */}
          <div className="lg:col-span-7 flex flex-col items-center lg:items-start text-center lg:text-left">
            
            {/* Upper Badge */}
            <motion.span 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#2908F1] bg-[#2908F1]/10 border border-[#2908F1]/20 mb-6 uppercase"
            >
              <Wrench className="w-3 h-3" /> TECNOLOGÍA & CONFIANZA
            </motion.span>

            {/* Main Headline */}
            <div className="mb-6">
              <motion.h1 
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#0F172A] tracking-tight uppercase leading-none"
                style={{ fontFamily: "'Readex Pro', sans-serif" }}
              >
                Precisión de Alto
              </motion.h1>
              <motion.h1 
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-[#2908F1] tracking-tight uppercase leading-none mt-1"
                style={{ 
                  fontFamily: "'Readex Pro', sans-serif",
                  textShadow: '0 0 40px rgba(41, 8, 241, 0.1)'
                }}
              >
                Rendimiento.
              </motion.h1>
            </div>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-sm md:text-base text-[#54595F] max-w-lg mb-8 leading-relaxed font-light"
            >
              El cuidado de alta fidelidad que tu vehículo merece, asistido las 24 horas por <span className="text-[#0F172A] font-semibold">{nombreAgente}</span>, nuestro agente inteligente de reservas.
            </motion.p>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <a
                href="#servicios"
                className="px-6 py-3 rounded-full text-xs font-bold tracking-wider border border-gray-200 bg-white text-[#54595F] hover:bg-gray-50 hover:text-[#2908F1] hover:border-[#2908F1]/30 transition-all duration-300 text-center"
              >
                VER SERVICIOS
              </a>
              <button
                onClick={onOpenChat}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wider text-[#0F172A] bg-[#FFC800] hover:bg-[#e6b400] transition-all duration-300 shadow-lg shadow-yellow-500/15 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" /> AGENDAR CON {nombreAgente}
              </button>
            </motion.div>
          </div>

          {/* Right Side: Integrated Live Simulator HUD */}
          {/* <motion.div 
            initial={{ opacity: 0, scale: 0.96, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 w-full flex flex-col justify-center"
          >
            <div className="w-full relative rounded-3xl p-0.5 bg-gradient-to-b from-[#2908F1]/30 to-transparent shadow-xl backdrop-blur-md">
              <span className="absolute -top-3 left-6 px-2.5 py-0.5 rounded bg-[#2908F1] text-white font-mono font-bold text-[8px] uppercase tracking-widest z-20 shadow-md">
                TELEMETRÍA EN VIVO
              </span>
              <PitStopAnimation />
            </div>
          </motion.div> */}

        </div>
      </div>
    </section>
  );
}
