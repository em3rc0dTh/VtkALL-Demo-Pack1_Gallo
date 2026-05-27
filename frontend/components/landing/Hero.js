'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Wrench, X } from 'lucide-react';
import PitStopAnimation from './PitStopAnimation.js';

export default function Hero({ taller = {}, onOpenChat, conf = {} }) {
  const [selectedPromo, setSelectedPromo] = useState(null);
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

  // ─── Alineación del texto (soporta: Centro, Izquierda, Derecha, Justificado) ──
  const alineacion = conf.alineacion || 'Centro';

  const alignmentClass =
    alineacion === 'Centro'
      ? 'items-center text-center lg:items-center lg:text-center mx-auto'
      : alineacion === 'Izquierda'
        ? 'items-start text-left lg:items-start lg:text-left'
        : alineacion === 'Derecha'
          ? 'items-end text-right lg:items-end lg:text-right'
          : alineacion === 'Justificado'
            ? 'items-start text-justify lg:items-start lg:text-justify'
            : 'items-center lg:items-start text-center lg:text-left'; // responsive default

  const btnContainerClass =
    alineacion === 'Centro'
      ? 'flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center'
      : alineacion === 'Derecha'
        ? 'flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-end'
        : 'flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-start';

  // ─── Posicionamiento del bloque de cards (desktop) ─────────────────────────
  // Máximo 2 promociones activas
  const dosPromos = listadoPromos.slice(0, 2);
  // Posición del bloque (ambas cards viajan juntas)
  const promosPosicion = conf.promos_posicion || null;
  // Layout interno del bloque: 'filas' (apiladas) | 'columnas' (lado a lado)
  const promosLayout = conf.promos_layout || 'filas';
  // ─────────────────────────────────────────────────────────────────────────────

  const handleCardClick = (e, promo) => {
    if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
      setSelectedPromo(promo);
    }
  };

  // Helper para renderizar una card individual
  const renderCard = (promo, index, compact = false) => {
    const isPrimary = promo.color_fondo === 'primary';
    return (
      <motion.div
        key={promo._id || index}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        onClick={(e) => handleCardClick(e, promo)}
        className={`${
          compact ? 'p-3.5' : 'p-5 lg:p-6'
        } rounded-[20px] relative overflow-hidden shadow-md group cursor-pointer hover:scale-[1.02] active:scale-[0.99] transition-all duration-300 ${
          isPrimary
            ? 'bg-gradient-to-br from-primary to-[#4F46E5] text-white hover:shadow-[0_12px_24px_rgba(0,174,239,0.3)]'
            : 'bg-gradient-to-br from-navy to-[#1E293B] text-white border border-primary/20 hover:shadow-[0_12px_24px_rgba(17,24,39,0.4)]'
        } ${promosLayout === 'columnas' ? 'flex-1 min-w-[220px] max-w-[340px]' : 'w-full max-w-[340px]'}`}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
        <div className="flex flex-col h-full justify-between gap-3.5 relative z-10">
          <div>
            <span className={`inline-block px-2 py-0.5 rounded font-mono font-black text-[8px] uppercase tracking-widest mb-2 shadow-sm ${
              isPrimary ? 'bg-secondary text-white' : 'bg-primary text-white'
            }`}>
              {promo.etiqueta}
            </span>
            <h3
              className={`${ compact ? 'text-sm' : 'text-sm lg:text-[17px]'} font-black text-white tracking-tight leading-tight mt-1`}
              style={{ fontFamily: "'Readex Pro', sans-serif" }}
            >
              {promo.titulo}
            </h3>
          </div>
          <button
            onClick={() => onOpenChat(promo.mensaje_chat || `Hola, me interesa la promoción: ${promo.titulo}`)}
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
  };

  return (
    <section id="inicio" className="relative min-h-[100svh] lg:h-screen w-full overflow-hidden bg-gradient-to-br from-[#EAF0FF] via-[#EEF3FF] to-[#F4F5FF] py-0 flex items-center">
      
      {/* Background Video / Image */}
      {isVideo ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute bottom-[200px] translate-y-[-25px] lg:translate-y-[70px] lg:bottom-[-80px] left-0 right-0 lg:inset-0 h-[52%] lg:h-full w-full object-cover object-top lg:object-right-bottom pointer-events-none z-[1]"
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
          className="absolute bottom-[200px] translate-y-[-25px] lg:translate-y-[70px] lg:bottom-[-80px] left-0 right-0 lg:inset-0 lg:top-[1%] h-[54%] lg:h-full w-full object-cover object-top lg:object-right-bottom pointer-events-none z-[1]"
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
      {/* Lighter overlay on mobile */}
      <div className="absolute inset-0 bg-white/30 lg:hidden pointer-events-none z-[2]" />

      {/* Large Decorative All-Caps Backdrop Typography */}
      <div className="absolute inset-x-0 top-[12%] flex justify-center items-center pointer-events-none z-2">
        <h2 className="text-[12vw] font-bold tracking-widest text-center select-none uppercase font-bebas"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'var(--bg-decorative-text)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
          {(taller.nombre_taller || 'MECANICAPRO').replace(/\s+/g, '')}
        </h2>
      </div>

      {/* ── Bloque de promo anclado (posición libre, solo desktop) ── */}
      {promosPosicion?.anclado && (
        <div
          className="hidden lg:block absolute z-[15] pointer-events-auto"
          style={{ left: `${promosPosicion.x}%`, top: `${promosPosicion.y}%` }}
        >
          <div className={`flex ${
            promosLayout === 'columnas' ? 'flex-row gap-4' : 'flex-col gap-5'
          }`}>
            {dosPromos.map((promo, index) => renderCard(promo, index))}
          </div>
        </div>
      )}

      {/* Main Foreground Content Grid */}
      <div className="relative z-10 w-full h-full max-w-7xl mx-auto px-5 md:px-12 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center w-full pt-20 lg:pt-16 pb-6 lg:pb-0">
          
          {/* Left Side: Elegant Premium Copy */}
          <div className={`${
            promosPosicion?.anclado ? 'lg:col-span-12' : 'lg:col-span-7'
          } flex flex-col ${alignmentClass}`}>
            
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
              className="text-xs sm:text-sm md:text-base text-navy/95 max-w-lg mb-5 leading-relaxed font-semibold"
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

            {/* Mobile: siempre muestra las cards debajo de los botones */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className={`lg:hidden mt-6 flex ${
                promosLayout === 'columnas' ? 'flex-row flex-wrap gap-3' : 'flex-col gap-3'
              } w-full`}
            >
              {dosPromos.map((promo, index) => renderCard(promo, index, true))}
            </motion.div>
             
          </div>

          {/* Right Side: Bloque de cards — solo en desktop, solo cuando NO está anclado */}
          {!promosPosicion?.anclado && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className={`hidden lg:flex lg:col-span-5 ${
                promosLayout === 'columnas'
                  ? 'flex-row gap-4 items-stretch'
                  : 'flex-col gap-5'
              } justify-center`}
            >
              {dosPromos.map((promo, index) => renderCard(promo, index))}
            </motion.div>
          )}

        </div>
      </div>

      {/* MODAL / FLYER DETALLE DE PROMOCIÓN */}
      <AnimatePresence>
        {selectedPromo && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden text-white ${
                selectedPromo.color_fondo === 'primary'
                  ? 'bg-gradient-to-br from-primary via-[#4F46E5] to-indigo-900 border border-primary/20'
                  : 'bg-gradient-to-br from-navy via-[#1E293B] to-slate-900 border border-gray-800'
              }`}
            >
              {/* Decorative backgrounds */}
              <div className="absolute top-0 right-0 -mt-20 -mr-20 w-44 h-44 rounded-full bg-white/5 blur-2xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

              {/* Botón de cierre */}
              <button
                onClick={() => setSelectedPromo(null)}
                className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white hover:scale-105 cursor-pointer z-20"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Contenido */}
              <div className="relative z-10 flex flex-col items-center text-center mt-4">
                <span className={`inline-block px-3 py-1 rounded-full font-mono font-black text-[10px] uppercase tracking-widest mb-4 shadow-md ${
                  selectedPromo.color_fondo === 'primary' ? 'bg-secondary text-white' : 'bg-primary text-white'
                }`}>
                  {selectedPromo.etiqueta}
                </span>

                <h3
                  className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-4"
                  style={{ fontFamily: "'Readex Pro', sans-serif" }}
                >
                  {selectedPromo.titulo}
                </h3>

                <div className="w-12 h-1 bg-white/25 rounded-full mb-6" />

                <p className="text-white/90 text-sm md:text-base leading-relaxed font-light mb-8 max-w-sm">
                  {selectedPromo.descripcion}
                </p>

                {/* Botón de Agendar */}
                <button
                  onClick={() => {
                    onOpenChat(selectedPromo.mensaje_chat || `Hola, me interesa la promoción: ${selectedPromo.titulo}`);
                    setSelectedPromo(null);
                  }}
                  className="w-full py-4 bg-white text-navy font-bold text-xs md:text-sm tracking-widest rounded-2xl hover:bg-gray-100 active:scale-95 transition-all duration-300 shadow-xl cursor-pointer text-center uppercase flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4 text-primary fill-current" />
                  RESERVAR OFERTA AHORA
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
