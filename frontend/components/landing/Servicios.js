"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Tag, X } from "lucide-react";

export default function Servicios({ servicios = [], onOpenChat, taller = {}, conf = {} }) {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';

  const defaultServicios = [
    {
      nombre: "Mecánica Preventiva y Correctiva",
      descripcion:
        "Soporte multimarca premium, scanner computarizado de sensores OBD-II y afinamiento integral.",
      duracion_minutos: 90,
      precio_base: 120,
      icono: "🔧",
    },
    {
      nombre: "Planchado y Pintura Automotriz",
      descripcion:
        "Reparación profesional de golpes y acabado en cabina de pintura al horno con insumos de alta gama.",
      duracion_minutos: 180,
      precio_base: 350,
      icono: "🎨",
    },
    {
      nombre: "Detailing y Tratamiento Cerámico",
      descripcion:
        "Pulido Meguiar's, corrección de laca y recubrimiento cerámico para máxima protección y brillo.",
      duracion_minutos: 120,
      precio_base: 280,
      icono: "✨",
    },
    {
      nombre: "Atención a Particulares y Flotas",
      descripcion:
        "Servicio preferente y facturación corporativa para mantenimiento preventivo de flotas empresariales.",
      duracion_minutos: 60,
      precio_base: 90,
      icono: "🏢",
    },
  ];

  const listado = servicios.length > 0 ? servicios : defaultServicios;

  const getPrecioBase = (s) => {
    if (s.productos && s.productos.length > 0) {
      return Math.min(...s.productos.map((p) => p.precio));
    }
    return s.precio_base || 0;
  };

  const getDuracionMinutos = (s) => {
    if (s.productos && s.productos.length > 0) {
      return Math.min(...s.productos.map((p) => p.duracion_minutos));
    }
    return s.duracion_minutos || 0;
  };

  const handleCardClick = (e, s) => {
    if (e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
      setSelectedService(s);
    }
  };

  return (
    <section
      id="servicios"
      className="pt-16 sm:pt-24 lg:pt-20 pb-12 lg:pb-16 bg-[#F4F5FF] relative border-b border-gray-200/50 overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Promociones / Beneficios en Marquesina */}
        {/* <div className="w-full overflow-hidden bg-primary/5 py-3 border-y border-primary/10 mb-8 select-none">
          <div className="flex animate-marquee-left whitespace-nowrap min-w-max gap-12 text-[#54595F] text-[11px] font-bold uppercase tracking-widest items-center">
            {[1, 2, 3].map((group) => (
              <div key={group} className="flex gap-12 shrink-0">
                <span className="flex items-center gap-2">🕒 Entrega Promedio: 48 Horas</span>
                <span className="text-primary/40">•</span>
                <span className="flex items-center gap-2">🤝 Clientes Particulares y Flotas</span>
                <span className="text-primary/40">•</span>
                <span className="flex items-center gap-2">🏆 Garantía por Escrito</span>
                <span className="text-primary/40">•</span>
                <span className="flex items-center gap-2">⚡ Tecnología & Diagnóstico Computarizado</span>
                <span className="text-primary/40">•</span>
              </div>
            ))}
          </div>
        </div> */}

        {/* Header de la sección */}
        <div className="text-center max-w-2xl mx-auto mb-8 lg:mb-10">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[11px] font-bold tracking-widest text-primary uppercase block mb-2"
          >
            {conf.subtitulo || "SOLUCIONES PARA CADA NECESIDAD DE TU VEHÍCULO."}
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl lg:text-5xl font-black text-navy tracking-tight"
            style={{ fontFamily: "'Readex Pro', sans-serif" }}
          >
            {conf.tituloSeccion || "Nuestros Servicios"}
          </motion.h2>
          <div className="w-14 h-1 bg-primary mx-auto mt-4 rounded-full" />
        </div>

        {/* Carrusel horizontal infinito de dos filas (serpentina) */}
        <style jsx global>{`
          @keyframes scrollServicesLeft {
            0% {
              transform: translate3d(0, 0, 0);
            }
            100% {
              transform: translate3d(-50%, 0, 0);
            }
          }
          @keyframes scrollServicesRight {
            0% {
              transform: translate3d(-50%, 0, 0);
            }
            100% {
              transform: translate3d(0, 0, 0);
            }
          }
          @keyframes engineVibrate {
            0% {
              transform: translate(0, 0) rotate(0deg);
            }
            20% {
              transform: translate(-1px, 1px) rotate(-1deg);
            }
            40% {
              transform: translate(1px, -1px) rotate(1.5deg);
            }
            60% {
              transform: translate(-1px, -1px) rotate(-0.5deg);
            }
            80% {
              transform: translate(1.5px, 1px) rotate(1deg);
            }
            100% {
              transform: translate(0, 0) rotate(0deg);
            }
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
          /* Fade masks on carousel edges */
          .carousel-fade-mask {
            -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
            mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
          }
        `}</style>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-6 lg:gap-8 lg:items-stretch">
          {/* Cómo Funciona Integrado */}
          <div className="w-full h-full">
            <div className="lg:h-full bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="text-center mb-6">
                <span className="text-[10px] font-bold text-primary tracking-widest uppercase">
                  AGENDA EN 2 MINUTOS
                </span>
                <h3
                  className="text-lg font-bold text-navy tracking-tight"
                  style={{ fontFamily: "'Readex Pro', sans-serif" }}
                >
                  ¿Cómo Reservar tu Box?
                </h3>
              </div>

              {/* Desktop: vertical stacked rows that fill the card height */}
              <div className="hidden lg:flex flex-col gap-3 flex-1">
                <div className="flex flex-row items-center gap-4 bg-white/50 border border-slate-200/40 rounded-2xl p-4 flex-1">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">Elige Especialidad</h4>
                    <p className="text-[11px] text-[#54595F] font-light leading-relaxed">
                      Haz clic en cualquier tarjeta de servicio arriba para ver detalles.
                    </p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-4 bg-white/50 border border-slate-200/40 rounded-2xl p-4 flex-1">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">{nombreAgente} Coordina tu Cita</h4>
                    <p className="text-[11px] text-[#54595F] font-light leading-relaxed">
                      Atención al cliente consulta la agenda y te asigna el mejor horario.
                    </p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-4 bg-white/50 border border-slate-200/40 rounded-2xl p-4 flex-1">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">¡Listo! Box Reservado</h4>
                    <p className="text-[11px] text-[#54595F] font-light leading-relaxed">
                      La cita queda agendada al instante en el sistema del taller.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: 3 compact columns side by side */}
              <div className="flex lg:hidden flex-row gap-2 w-full">
                <div className="flex flex-col items-center text-center gap-1.5 bg-white/50 border border-slate-200/40 rounded-2xl p-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">1</span>
                  <h4 className="text-[10px] font-bold text-navy leading-tight">Elige Servicio</h4>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 bg-white/50 border border-slate-200/40 rounded-2xl p-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">2</span>
                  <h4 className="text-[10px] font-bold text-navy leading-tight">{nombreAgente} Coordina</h4>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 bg-white/50 border border-slate-200/40 rounded-2xl p-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">3</span>
                  <h4 className="text-[10px] font-bold text-navy leading-tight">Box Reservado</h4>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between h-full space-y-2 lg:space-y-0">
            {/* Fila superior - desplazamiento izquierda */}
            <div
              className="overflow-hidden carousel-fade-mask mb-2 py-2"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className={`services-carousel-left ${isPaused ? "paused" : ""}`}>
                {[...listado, ...listado, ...listado].map((s, idx) => {
                  const precioBase = getPrecioBase(s);
                  const duracion = getDuracionMinutos(s);
                  return (
                    <div
                      key={`top-${s.nombre}-${idx}`}
                      onClick={(e) => handleCardClick(e, s)}
                      className="shrink-0 w-[220px] sm:w-[260px] lg:w-[300px] xl:w-[320px] p-5 rounded-[20px] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer select-none"
                    >
                      {/* Estructura Contenido Superior */}
                      <div className="flex flex-col space-y-3 mb-3">
                        <div className="flex flex-row justify-between items-start gap-2 w-full">
                          <h3
                            className="text-sm lg:text-[15px] font-bold text-navy group-hover:text-primary transition-colors duration-200 leading-snug"
                            style={{ fontFamily: "'Readex Pro', sans-serif" }}
                          >
                            {s.nombre}
                          </h3>
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-base group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 relative select-none">
                            <span className="group-hover:animate-[engineVibrate_0.15s_linear_infinite] inline-block">
                              {s.icono || "🔧"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[#54595F] text-[11px] lg:text-xs leading-relaxed font-light line-clamp-2">
                          {s.descripcion}
                        </p>
                      </div>

                      {/* Contenido Inferior: Métricas y Botón */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-[#54595F] border-t border-gray-100 pt-3">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {duracion} min
                          </span>
                          <span className="flex items-center gap-1 font-bold text-navy">
                            <Tag className="w-3 h-3 text-primary" /> desde S/.{" "}
                            {precioBase}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Fila inferior - desplazamiento derecha */}
            <div
              className="hidden sm:block overflow-hidden carousel-fade-mask py-2"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div
                className={`services-carousel-right ${isPaused ? "paused" : ""}`}
              >
                {[...listado, ...listado, ...listado].map((s, idx) => {
                  const precioBase = getPrecioBase(s);
                  const duracion = getDuracionMinutos(s);
                  return (
                    <div
                      key={`bottom-${s.nombre}-${idx}`}
                      onClick={(e) => handleCardClick(e, s)}
                      className="shrink-0 w-[220px] sm:w-[260px] lg:w-[300px] xl:w-[320px] p-5 rounded-[20px] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer select-none"
                    >
                      {/* Estructura Contenido Superior */}
                      <div className="flex flex-col space-y-3 mb-3">
                        <div className="flex flex-row justify-between items-start gap-2 w-full">
                          <h3
                            className="text-sm lg:text-[15px] font-bold text-navy group-hover:text-primary transition-colors duration-200 leading-snug"
                            style={{ fontFamily: "'Readex Pro', sans-serif" }}
                          >
                            {s.nombre}
                          </h3>
                          <div className="w-8 h-8 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-base group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 relative select-none">
                            <span className="group-hover:animate-[engineVibrate_0.15s_linear_infinite] inline-block">
                              {s.icono || "🔧"}
                            </span>
                          </div>
                        </div>
                        <p className="text-[#54595F] text-[11px] lg:text-xs leading-relaxed font-light line-clamp-2">
                          {s.descripcion}
                        </p>
                      </div>

                      {/* Contenido Inferior: Métricas y Botón */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-[#54595F] border-t border-gray-100 pt-3">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-primary" />
                            {duracion} min
                          </span>
                          <span className="flex items-center gap-1 font-bold text-navy">
                            <Tag className="w-3 h-3 text-primary" /> desde S/.{" "}
                            {precioBase}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE DETALLE DE SERVICIO */}
      <AnimatePresence>
        {selectedService && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-lg bg-white/95 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl relative border border-slate-200/50"
            >
              {/* Botón de cierre */}
              <button
                onClick={() => setSelectedService(null)}
                className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-[#54595F] hover:text-navy cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Encabezado */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">
                  {selectedService.icono || "🔧"}
                </div>
                <div>
                  <span className="text-[10px] text-primary font-bold tracking-widest uppercase block mb-0.5">
                    Detalles de Especialidad
                  </span>
                  <h3
                    className="text-xl font-bold text-navy"
                    style={{ fontFamily: "'Readex Pro', sans-serif" }}
                  >
                    {selectedService.nombre}
                  </h3>
                </div>
              </div>

              {/* Contenido / Descripción */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                <p className="text-xs text-[#54595F] leading-relaxed">
                  {selectedService.descripcion}
                </p>

                {/* Lista de sub-servicios / productos asociados */}
                {selectedService.productos &&
                selectedService.productos.length > 0 ? (
                  <div className="space-y-2 mt-4">
                    <h4 className="text-[10px] font-bold text-navy uppercase tracking-wider block mb-1">
                      Servicios y Opciones Disponibles:
                    </h4>
                    <div className="grid gap-2">
                      {selectedService.productos.map((prod, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 rounded-2xl bg-[#F4F5FF]/50 border border-slate-200/50"
                        >
                          <div>
                            <span className="text-xs font-bold text-navy block">
                              {prod.nombre}
                            </span>
                            <span className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-primary" />{" "}
                              {prod.duracion_minutos} min
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-primary font-mono">
                              S/. {prod.precio}
                            </span>
                            <button
                              onClick={() => {
                                onOpenChat(
                                  `Hola, me interesa agendar una cita para ${selectedService.nombre} — ${prod.nombre}`,
                                );
                                setSelectedService(null);
                              }}
                              className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold rounded-xl hover:bg-primary-hover active:scale-95 transition-all cursor-pointer"
                            >
                              Agendar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-xs text-[#54595F] bg-[#F4F5FF]/50 p-3 rounded-2xl border border-slate-200/50">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>
                      Duración estimada: {getDuracionMinutos(selectedService)}{" "}
                      minutos
                    </span>
                    <span className="mx-2 text-slate-300">|</span>
                    <Tag className="w-4 h-4 text-primary" />
                    <span>
                      Precio base: desde S/. {getPrecioBase(selectedService)}
                    </span>
                  </div>
                )}
              </div>

              {/* Botón de Reservar */}
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => {
                    onOpenChat(
                      `Hola, me interesa agendar una cita para ${selectedService.nombre}`,
                    );
                    setSelectedService(null);
                  }}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-widest rounded-xl transition-all duration-300 shadow-md cursor-pointer text-center uppercase"
                >
                  Reservar Cita por Chat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
