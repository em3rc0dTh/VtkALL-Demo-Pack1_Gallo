'use client';

import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

export default function CTA({ conf = {}, onOpenChat }) {
  const mensaje = conf.mensaje || '¿Listo para endulzar tu evento?';
  const subtitulo = conf.subtitulo || 'Reserva tu cita hoy mismo con nuestro asistente de atención las 24 horas.';
  const textoBoton = conf.textoBoton || 'AGENDAR CITA AHORA';
  const colorFondo = conf.colorFondo || 'Degradado Primario'; // Degradado Primario, Oscuro, Gris Claro
  const esquinas = conf.esquinas || 'Redondeadas (xl)'; // Redondeadas (xl), Píldora, Estándar
  const animarBoton = conf.animarBoton !== false;

  // Background Class
  let bgClass = 'bg-gradient-to-r from-secondary via-primary to-[#4F46E5] text-white';
  if (colorFondo === 'Oscuro') {
    bgClass = 'bg-[#0B0F19] border border-gray-800 text-white';
  } else if (colorFondo === 'Gris Claro') {
    bgClass = 'bg-[#F4F5FF] text-navy border border-slate-200';
  }

  // Border radius class
  let roundedClass = 'rounded-[32px]';
  if (esquinas === 'Píldora') {
    roundedClass = 'rounded-full px-12 py-10';
  } else if (esquinas === 'Estándar') {
    roundedClass = 'rounded-none';
  }

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto relative z-10 overflow-hidden select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className={`p-10 md:p-14 relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 ${bgClass} ${roundedClass}`}
      >
        {/* Glow Effects */}
        {colorFondo !== 'Gris Claro' && (
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-80 h-80 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        )}
        
        {/* Texts */}
        <div className="max-w-2xl text-center md:text-left relative z-10">
          <h3
            className="text-2xl md:text-4xl font-black tracking-tight leading-tight"
            style={{ fontFamily: "'Readex Pro', sans-serif" }}
          >
            {mensaje}
          </h3>
          <p className={`text-sm mt-3 font-light ${colorFondo === 'Gris Claro' ? 'text-[#54595F]' : 'text-white/80'} leading-relaxed`}>
            {subtitulo}
          </p>
        </div>

        {/* Button */}
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => onOpenChat(`Hola, me gustaría agendar una cita mediante la oferta de la web`)}
            className={`flex items-center gap-3 px-8 py-4 rounded-full text-xs font-black tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer uppercase ${
              colorFondo === 'Gris Claro'
                ? 'bg-secondary hover:bg-secondary-hover text-white shadow-btn-secondary hover:shadow-btn-secondary-hover'
                : 'bg-white hover:bg-slate-50 text-navy shadow-xl'
            } ${animarBoton ? 'animate-pulse' : ''}`}
          >
            <MessageSquare className="w-4 h-4 fill-current" />
            {textoBoton}
          </button>
        </div>
      </motion.div>
    </section>
  );
}
