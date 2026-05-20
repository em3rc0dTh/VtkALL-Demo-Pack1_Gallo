"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Clock, Tag } from "lucide-react";

export default function Servicios({ servicios = [], onOpenChat }) {
  const [isPaused, setIsPaused] = useState(false);
  
  const defaultServicios = [
    {
      nombre: "Mecánica Preventiva y Correctiva",
      descripcion: "Soporte multimarca premium, scanner computarizado de sensores OBD-II y afinamiento integral.",
      duracion_minutos: 90,
      precio_base: 120,
      icono: "🔧",
    },
    {
      nombre: "Planchado y Pintura Automotriz",
      descripcion: "Reparación profesional de golpes y acabado en cabina de pintura al horno con insumos de alta gama.",
      duracion_minutos: 180,
      precio_base: 350,
      icono: "🎨",
    },
    {
      nombre: "Detailing y Tratamiento Cerámico",
      descripcion: "Pulido Meguiar's, corrección de laca y recubrimiento cerámico para máxima protección y brillo.",
      duracion_minutos: 120,
      precio_base: 280,
      icono: "✨",
    },
    {
      nombre: "Atención a Particulares y Flotas",
      descripcion: "Servicio preferente y facturación corporativa para mantenimiento preventivo de flotas empresariales.",
      duracion_minutos: 60,
      precio_base: 90,
      icono: "🏢",
    },
  ];

  const listado = servicios.length > 0 ? servicios : defaultServicios;

  return (
    <section
      id="servicios"
      className="py-24 bg-[#F4F5FF] relative border-b border-gray-200/50 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Métricas rápidas de Gallo Autos */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 mb-8 text-center text-[#54595F] text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2908F1]/5 border border-[#2908F1]/10 backdrop-blur-sm">
            🕒 Entrega Promedio: 48 Horas
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2908F1]/5 border border-[#2908F1]/10 backdrop-blur-sm">
            🤝 Clientes Particulares y Flotas
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2908F1]/5 border border-[#2908F1]/10 backdrop-blur-sm">
            🏆 Garantía por Escrito
          </div>
        </div>

        {/* Header de la sección */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-[#2908F1] uppercase block mb-1"
          >
            NUESTRAS ESPECIALIDADES
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black text-[#0F172A] tracking-tight"
            style={{ fontFamily: "'Readex Pro', sans-serif" }}
          >
            Mantenimiento y Diagnóstico
          </motion.h2>
          <div className="w-12 h-1 bg-[#FFC800] mx-auto mt-3 rounded-full" />
        </div>

        {/* Carrusel horizontal infinito de dos filas (serpentina) */}
        <style jsx global>{`
          @keyframes scrollServicesLeft {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes scrollServicesRight {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0, 0, 0); }
          }
          @keyframes engineVibrate {
            0% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(-1px, 1px) rotate(-1deg); }
            40% { transform: translate(1px, -1px) rotate(1.5deg); }
            60% { transform: translate(-1px, -1px) rotate(-0.5deg); }
            80% { transform: translate(1.5px, 1px) rotate(1deg); }
            100% { transform: translate(0, 0) rotate(0deg); }
          }
          .services-carousel-left {
            display: flex;
            gap: 16px;
            width: max-content;
            animation: scrollServicesLeft 45s linear infinite;
          }
          .services-carousel-right {
            display: flex;
            gap: 16px;
            width: max-content;
            animation: scrollServicesRight 45s linear infinite;
          }
          .services-carousel-left.paused,
          .services-carousel-right.paused {
            animation-play-state: paused;
          }
        `}</style>

        {/* Fila superior - desplazamiento izquierda */}
        <div
          className="overflow-hidden mb-4 py-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`services-carousel-left ${isPaused ? "paused" : ""}`}>
            {[...listado, ...listado, ...listado].map((s, idx) => (
              <div
                key={`top-${s.nombre}-${idx}`}
                className="shrink-0 w-[350px] md:w-[400px] p-5 rounded-[24px] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-[#2908F1]/40 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Estructura Contenido Superior */}
                <div className="flex flex-row items-start gap-4 mb-4">
                  {/* BLOQUE IZQUIERDA: Icono */}
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-[#2908F1]/10 flex items-center justify-center text-2xl group-hover:bg-[#2908F1]/20 group-hover:scale-110 transition-all duration-300 relative select-none">
                    <span className="group-hover:animate-[engineVibrate_0.15s_linear_infinite] inline-block">
                      {s.icono || "🔧"}
                    </span>
                  </div>

                  {/* BLOQUE DERECHA: Textos */}
                  <div className="flex flex-col space-y-1 pt-0.5">
                    <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2908F1] transition-colors duration-200 leading-snug" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                      {s.nombre}
                    </h3>
                    <p className="text-[#54595F] text-xs leading-relaxed font-light line-clamp-2">
                      {s.descripcion}
                    </p>
                  </div>
                </div>

                {/* Contenido Inferior: Métricas y Botón */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#54595F] border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-[#2908F1]" />
                      {s.duracion_minutos} min
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#0F172A]">
                      <Tag className="w-3.5 h-3.5 text-[#2908F1]" /> desde S/. {s.precio_base}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onOpenChat(`Hola, me interesa agendar una cita para ${s.nombre}`)}
                    className="w-full py-2 rounded-xl text-xs font-bold tracking-wider text-[#2908F1] bg-[#2908F1]/5 border border-[#2908F1]/10 group-hover:bg-[#2908F1] group-hover:text-white group-hover:border-[#2908F1] transition-all duration-300 cursor-pointer text-center"
                  >
                    RESERVAR CITA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fila inferior - desplazamiento derecha */}
        <div
          className="overflow-hidden py-2"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <div className={`services-carousel-right ${isPaused ? "paused" : ""}`}>
            {[...listado, ...listado, ...listado].map((s, idx) => (
              <div
                key={`bottom-${s.nombre}-${idx}`}
                className="shrink-0 w-[350px] md:w-[400px] p-5 rounded-[24px] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-[#2908F1]/40 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Estructura Contenido Superior */}
                <div className="flex flex-row items-start gap-4 mb-4">
                  {/* BLOQUE IZQUIERDA: Icono */}
                  <div className="w-12 h-12 shrink-0 rounded-xl bg-[#2908F1]/10 flex items-center justify-center text-2xl group-hover:bg-[#2908F1]/20 group-hover:scale-110 transition-all duration-300 relative select-none">
                    <span className="group-hover:animate-[engineVibrate_0.15s_linear_infinite] inline-block">
                      {s.icono || "🔧"}
                    </span>
                  </div>

                  {/* BLOQUE DERECHA: Textos */}
                  <div className="flex flex-col space-y-1 pt-0.5">
                    <h3 className="text-base font-bold text-[#0F172A] group-hover:text-[#2908F1] transition-colors duration-200 leading-snug" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                      {s.nombre}
                    </h3>
                    <p className="text-[#54595F] text-xs leading-relaxed font-light line-clamp-2">
                      {s.descripcion}
                    </p>
                  </div>
                </div>

                {/* Contenido Inferior: Métricas y Botón */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-[#54595F] border-t border-gray-100 pt-3">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock className="w-4 h-4 text-[#2908F1]" />
                      {s.duracion_minutos} min
                    </span>
                    <span className="flex items-center gap-1 font-bold text-[#0F172A]">
                      <Tag className="w-3.5 h-3.5 text-[#2908F1]" /> desde S/. {s.precio_base}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => onOpenChat(`Hola, me interesa agendar una cita para ${s.nombre}`)}
                    className="w-full py-2 rounded-xl text-xs font-bold tracking-wider text-[#2908F1] bg-[#2908F1]/5 border border-[#2908F1]/10 group-hover:bg-[#2908F1] group-hover:text-white group-hover:border-[#2908F1] transition-all duration-300 cursor-pointer text-center"
                  >
                    RESERVAR CITA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Ofertas Especiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
          {/* Promoción del Mes */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="p-6 rounded-[24px] bg-gradient-to-br from-[#2908F1] to-[#4F46E5] text-white relative overflow-hidden shadow-md group"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex flex-col h-full justify-between gap-4 relative z-10">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-[#FFC800] text-black font-mono font-black text-[9px] uppercase tracking-widest mb-2.5 shadow-sm">
                  PROMO DEL MES
                </span>
                <h3 className="text-xl font-black text-white tracking-tight leading-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                  Cambio de Aceite + Diagnóstico Gratis
                </h3>
                <p className="text-white/80 text-xs font-light mt-1.5 leading-relaxed">
                  Agenda tu cambio de aceite con nosotros este mes y recibe un escaneo computarizado de sensores OBD-II completamente gratis.
                </p>
              </div>
              <button
                onClick={() => onOpenChat("Hola, me interesa la Promo del Mes: Cambio de Aceite + Diagnóstico Gratis")}
                className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider text-[#0F172A] bg-[#FFC800] hover:bg-white hover:text-[#2908F1] transition-all duration-300 cursor-pointer text-center uppercase"
              >
                AGENDAR PROMOCIÓN
              </button>
            </div>
          </motion.div>

          {/* Black Friday Especial */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="p-6 rounded-[24px] bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-white border border-[#2908F1]/20 relative overflow-hidden shadow-md group"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-28 h-28 rounded-full bg-[#2908F1]/10 blur-xl pointer-events-none" />
            <div className="flex flex-col h-full justify-between gap-4 relative z-10">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-[#2908F1] text-white font-mono font-black text-[9px] uppercase tracking-widest mb-2.5 shadow-sm">
                  EDICIÓN LIMITADA
                </span>
                <h3 className="text-xl font-black text-white tracking-tight leading-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                  Especial Black Friday: 20% OFF
                </h3>
                <p className="text-white/80 text-xs font-light mt-1.5 leading-relaxed">
                  Consigue un acabado impecable de fábrica con un 20% de descuento en trabajos completos de planchado y pintura automotriz al horno.
                </p>
              </div>
              <button
                onClick={() => onOpenChat("Hola, quiero reservar con el 20% de descuento del Especial Black Friday de Planchado y Pintura")}
                className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider text-white bg-[#2908F1] hover:bg-white hover:text-[#0F172A] transition-all duration-300 cursor-pointer text-center uppercase"
              >
                OBTENER DESCUENTO
              </button>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}