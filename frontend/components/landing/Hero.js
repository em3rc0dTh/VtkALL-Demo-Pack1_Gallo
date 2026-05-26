'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Wrench } from 'lucide-react';
import PitStopAnimation from './PitStopAnimation.js';

export default function Hero({ taller = {}, onOpenChat, conf = {} }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  const urlFondo = taller.url_fondo || "/videos/PixVerse_V6_Image_Text_360P_Create_a_visually_ (2).mp4";
  const isVideo = /\.(mp4|webm|ogg)($|\?)/i.test(urlFondo) || urlFondo.includes('/videos/') || urlFondo.startsWith('data:video/');
  
  const promosActivas = (taller.promociones || []).filter(p => p.activo);
  const listadoPromos = promosActivas.length > 0 ? promosActivas : [
    {
      titulo: 'Cambio de Aceite + Diagnóstico Gratis',
      descripcion: 'Agenda tu cambio de aceite con nosotros este mes y recibe un escaneo computarizado de sensores OBD-II completamente gratis.',
      etiqueta: 'PROMO DEL MES',
      mensaje_chat: 'Hola, me interesa la Promo del Mes: Cambio de Aceite + Diagnóstico Gratis',
      color_fondo: 'primary'
    },
    {
      titulo: 'Especial Black Friday: 20% OFF',
      descripcion: 'Consigue un acabado impecable de fábrica con un 20% de descuento en trabajos completos de planchado y pintura automotriz al horno.',
      etiqueta: 'EDICIÓN LIMITADA',
      mensaje_chat: 'Hola, quiero reservar con el 20% de descuento del Especial Black Friday de Planchado y Pintura',
      color_fondo: 'navy'
    }
  ];

  // Dynamic values from builder conf
  const tituloPrincipalRaw = conf.tituloPrincipal || 'Precisión de Alto Rendimiento.';
  const words = tituloPrincipalRaw.trim().split(/\s+/);
  const lastWord = words.length > 0 ? words[words.length - 1] : '';
  const restOfWords = words.length > 1 ? words.slice(0, -1).join(' ') : '';

  const subtituloRaw = conf.subtitulo || 'El cuidado de alta fidelidad que tu vehículo merece, asistido las 24 horas por {nombreAgente}, nuestro equipo de reservas.';
  const subtituloText = subtituloRaw.replace(/{nombreAgente}/g, nombreAgente);

  const textoBotonRaw = conf.textoBoton || 'AGENDAR CON {nombreAgente}';
  const textoBoton = textoBotonRaw.replace(/{nombreAgente}/g, nombreAgente);

  const alignmentClass = conf.alineacion === 'Centro' 
    ? 'items-center text-center lg:items-center lg:text-center mx-auto' 
    : conf.alineacion === 'Izquierda'
      ? 'items-start text-left lg:items-start lg:text-left'
      : 'items-center lg:items-start text-center lg:text-left'; // default responsive

  const btnContainerClass = conf.alineacion === 'Centro'
    ? 'flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center'
    : conf.alineacion === 'Izquierda'
      ? 'flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-start'
      : 'flex flex-col sm:flex-row gap-4 w-full sm:w-auto';

  return (
    <section id="inicio" className="relative min-h-[100svh] lg:h-screen w-full overflow-hidden bg-gradient-to-br from-[#EAF0FF] via-[#EEF3FF] to-[#F4F5FF] py-0 flex items-center">
      
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
      {isVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute bottom-[100px] lg:bottom-[-60px] left-0 right-0 lg:inset-0 h-[52%] lg:h-full w-full object-cover object-top lg:object-right-bottom pointer-events-none z-[1]"
          style={{
            filter: 'brightness(1.05) saturate(1.15)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, transparent 100%)',
            opacity: 0.55,
          }}
          src={urlFondo}
        />
      ) : (
        <img
          className="absolute bottom-[100px] lg:bottom-[-60px] left-0 right-0 lg:inset-0 lg:top-[1%] h-[54%] lg:h-full w-full object-cover object-top lg:object-right-bottom pointer-events-none z-[1]"
          style={{
            filter: 'brightness(1.05) saturate(1.15)',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.85) 50%, transparent 100%)',
            opacity: 0.55,
          }}
          src={urlFondo}
          alt="Fondo de pantalla"
        />
      )}

      {/* Subtle Top & Bottom Gradient Overlays for Readability */}
      <div className="absolute top-0 left-0 right-0 h-[260px] bg-gradient-to-b from-white/90 via-lavender/55 to-transparent pointer-events-none z-[2]" />
      <div className="absolute bottom-0 left-0 right-0 h-[260px] bg-gradient-to-t from-white/90 via-[#F4F5FF]/60 to-transparent pointer-events-none z-[2]" />
      {/* Lighter overlay on mobile — lets the video show through while keeping text readable */}
      <div className="absolute inset-0 bg-white/30 lg:hidden pointer-events-none z-[2]" />

      {/* Large Decorative All-Caps Backdrop Typography */}
      <div className="absolute inset-x-0 top-[12%] flex justify-center items-center pointer-events-none z-2">
        <h2 className="text-[12vw] font-bold tracking-widest text-center select-none uppercase font-bebas opacity-70"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'var(--bg-decorative-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
          {(taller.nombre_taller || 'MECANICAPRO').replace(/\s+/g, '')}
        </h2>
      </div>

      {/* Main Foreground Content Grid */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 md:px-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full pt-20 lg:pt-16 pb-6 lg:pb-0">
          
          {/* Left Side: Elegant Premium Copy */}
          <div className={`lg:col-span-7 flex flex-col ${alignmentClass}`}>
            
            {/* Upper Badge */}
            <motion.span 
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-primary bg-primary/10 border border-primary/20 mb-4 uppercase"
            >
              <Wrench className="w-3 h-3" /> TECNOLOGÍA & CONFIANZA
            </motion.span>

            {/* Main Headline */}
            <div className="mb-4">
              {restOfWords && (
                <motion.h1 
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-navy tracking-tight uppercase leading-none"
                  style={{ fontFamily: "'Readex Pro', sans-serif" }}
                >
                  {restOfWords}
                </motion.h1>
              )}
              {lastWord && (
                <motion.h1 
                  initial={{ opacity: 0, y: 25 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-primary tracking-tight uppercase leading-none mt-1"
                  style={{ 
                    fontFamily: "'Readex Pro', sans-serif",
                    textShadow: 'var(--text-shadow-hero)'
                  }}
                >
                  {lastWord}
                </motion.h1>
              )}
            </div>

            {/* Subtitle */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-xs sm:text-sm md:text-base text-[#54595F] max-w-lg mb-5 leading-relaxed font-light"
            >
              {subtituloText}
            </motion.p>

            {/* Action Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className={btnContainerClass}
            >
              <a
                href="#servicios"
                className="px-6 py-3 rounded-full text-xs font-bold tracking-wider border border-gray-200 bg-white text-[#54595F] hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-all duration-300 text-center"
              >
                VER SERVICIOS
              </a>
              <button
                onClick={onOpenChat}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-full text-xs font-bold tracking-wider text-navy bg-primary hover:bg-secondary-hover transition-all duration-300 shadow-btn-secondary hover:shadow-btn-secondary-hover hover:scale-105 active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 fill-current" /> {textoBoton}
              </button>
            </motion.div>
             
          </div>

          {/* Right Side: Promo Cards — horizontal swipe strip */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, x: 20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="lg:col-span-5 w-full flex flex-col justify-center"
          >
            {/* On mobile: compact 2-col grid side by side; on lg: stacked */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-5 w-full">
              {listadoPromos.map((promo, index) => {
                const isPrimary = promo.color_fondo === 'primary';
                return (
                  <motion.div
                    key={promo._id || index}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className={`p-4 lg:p-6 rounded-[20px] relative overflow-hidden shadow-md group ${
                      isPrimary
                        ? 'bg-gradient-to-br from-primary to-[#4F46E5] text-white'
                        : 'bg-gradient-to-br from-navy to-[#1E293B] text-white border border-primary/20'
                    }`}
                  >
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
                    <div className="flex flex-col h-full justify-between gap-3 relative z-10">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded font-mono font-black text-[8px] uppercase tracking-widest mb-2 shadow-sm ${
                          isPrimary ? 'bg-secondary text-white' : 'bg-primary text-white'
                        }`}>
                          {promo.etiqueta}
                        </span>
                        <h3
                          className="text-sm lg:text-xl font-black text-white tracking-tight leading-tight mt-1"
                          style={{ fontFamily: "'Readex Pro', sans-serif" }}
                        >
                          {promo.titulo}
                        </h3>
                        <p className="text-white/80 text-[10px] lg:text-xs font-light mt-1 leading-relaxed hidden sm:block">
                          {promo.descripcion}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          onOpenChat(
                            promo.mensaje_chat || `Hola, me interesa la promoción: ${promo.titulo}`
                          )
                        }
                        className={`w-full py-2 rounded-xl text-[10px] lg:text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer text-center uppercase ${
                          isPrimary
                            ? 'text-white bg-secondary hover:bg-white hover:text-primary'
                            : 'text-white bg-primary hover:bg-white hover:text-navy'
                        }`}
                      >
                        {isPrimary ? 'AGENDAR' : 'OBTENER'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
