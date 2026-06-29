"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Tag, X, Search, CheckCircle2, HeadphonesIcon, ShieldCheck, Wrench, BadgeDollarSign, CalendarDays } from "lucide-react";

export default function Servicios({ servicios = [], onOpenChat, taller = {}, conf = {}, onCatalogToggle }) {
  const [isPaused, setIsPaused] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("Todos");
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';

  // Notificar al padre cuando el catálogo se abre/cierra para ocultar a Iris
  useEffect(() => {
    if (onCatalogToggle) {
      onCatalogToggle(isCatalogOpen);
    }
  }, [isCatalogOpen, onCatalogToggle]);

  const defaultServicios = [
    {
      nombre: "Diagnóstico general",
      descripcion: "Revisión completa para identificar fallas, códigos y síntomas del vehículo.",
      metadata: "Según diagnóstico",
      icono: "📈",
      categoria: "Diagnóstico",
    },
    {
      nombre: "Mantenimiento preventivo",
      descripcion: "Cuidamos tu vehículo para que funcione siempre en óptimas condiciones.",
      metadata: "Planes de mantenimiento",
      icono: "📋",
      categoria: "Mantenimiento",
    },
    {
      nombre: "Frenos y suspensión",
      descripcion: "Revisión y cambio de pastillas, discos, amortiguadores y componentes clave.",
      metadata: "Seguridad garantizada",
      icono: "🛑",
      categoria: "Frenos",
    },
    {
      nombre: "Motor y rendimiento",
      descripcion: "Optimización y reparación para mejorar el desempeño y eficiencia del motor.",
      metadata: "Rendimiento óptimo",
      icono: "⚙️",
      categoria: "Motor",
    },
    {
      nombre: "Planchado y pintura",
      descripcion: "Reparación profesional de golpes y pintura con acabados de fábrica.",
      metadata: "Calidad garantizada",
      icono: "🚗",
      categoria: "Planchado y pintura",
    },
    {
      nombre: "Detailing automotriz",
      descripcion: "Pulido, corrección de pintura y limpieza profunda interior y exterior.",
      metadata: "Acabado premium",
      icono: "✨",
      categoria: "Estética",
    },
    {
      nombre: "Revisión precompra",
      descripcion: "Inspección detallada para que compres tu próximo auto con seguridad.",
      metadata: "Informe detallado",
      icono: "🔍",
      categoria: "Revisión precompra",
    }
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

  const catalogServicios = defaultServicios;
  const categories = ["Todos", "Mantenimiento", "Diagnóstico", "Frenos", "Motor", "Estética", "Planchado y pintura", "Revisión precompra"];
  
  const filteredCatalog = catalogServicios.filter(s => {
    const matchesSearch = s.nombre.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          s.descripcion.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "Todos" || s.categoria === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
            {conf.subtitulo || "POSTRES PARA CADA MOMENTO ESPECIAL."}
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
                  {conf.reservaTitulo || '¿Cómo Reservar tu Box?'}
                </h3>
              </div>

              {/* Desktop: vertical stacked rows that fill the card height */}
              <div className="hidden lg:flex flex-col gap-3 flex-1">
                <div className="flex flex-row items-center gap-4 bg-white/50 border border-slate-200/40 rounded-2xl p-4 flex-1">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">{conf.paso1Titulo || 'Elige Especialidad'}</h4>
                    <p className="text-[11px] text-[#54595F] font-light leading-relaxed">
                      {conf.paso1Desc || 'Haz clic en cualquier tarjeta de servicio arriba para ver detalles.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-4 bg-white/50 border border-slate-200/40 rounded-2xl p-4 flex-1">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">{conf.paso2Titulo || `${nombreAgente} Coordina tu Cita`}</h4>
                    <p className="text-[11px] text-[#54595F] font-light leading-relaxed">
                      {conf.paso2Desc || 'Atención al cliente consulta la agenda y te asigna el mejor horario.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-4 bg-white/50 border border-slate-200/40 rounded-2xl p-4 flex-1">
                  <span className="w-10 h-10 rounded-full bg-primary/10 text-primary text-sm font-black flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="text-xs font-bold text-navy mb-0.5">{conf.paso3Titulo || '¡Listo! Box Reservado'}</h4>
                    <p className="text-[11px] text-[#54595F] font-light leading-relaxed">
                      {conf.paso3Desc || 'La cita queda agendada al instante en el sistema del taller.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile: 3 compact columns side by side */}
              <div className="flex lg:hidden flex-row gap-2 w-full">
                <div className="flex flex-col items-center text-center gap-1.5 bg-white/50 border border-slate-200/40 rounded-2xl p-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">1</span>
                  <h4 className="text-[10px] font-bold text-navy leading-tight">{conf.paso1Mobile || 'Elige Servicio'}</h4>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 bg-white/50 border border-slate-200/40 rounded-2xl p-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">2</span>
                  <h4 className="text-[10px] font-bold text-navy leading-tight">{conf.paso2Mobile || `${nombreAgente} Coordina`}</h4>
                </div>
                <div className="flex flex-col items-center text-center gap-1.5 bg-white/50 border border-slate-200/40 rounded-2xl p-2.5 flex-1">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center shrink-0">3</span>
                  <h4 className="text-[10px] font-bold text-navy leading-tight">{conf.paso3Mobile || 'Box Reservado'}</h4>
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
<div className="relative z-20 text-center mb-6">
  <button 
    onClick={() => setIsCatalogOpen(true)}
    className="px-8 py-3.5 rounded-2xl border border-primary/50 bg-primary/5 hover:bg-primary/10 text-primary hover:text-primary font-bold tracking-widest uppercase transition-all duration-300 transform hover:scale-[0.98] hover:border-primary shadow-lg shadow-primary/10 hover:shadow-primary/20 cursor-pointer text-sm"
  >
    Explorar Servicios
  </button>
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
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 mb-6 scrollbar-thin">
                <p className="text-sm text-[#54595F] leading-relaxed">
                  {selectedService.descripcion}
                </p>

                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 mt-4">
                  <h4 className="text-[11px] font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ideal para:
                  </h4>
                  <ul className="text-xs text-gray-600 space-y-1.5 pl-5 list-disc">
                    <li>Cuando tu vehículo presenta síntomas o fallas relacionadas.</li>
                    <li>Para mantener la garantía y seguridad de tu auto.</li>
                    <li>Recomendado por nuestros expertos para prolongar la vida útil.</li>
                  </ul>
                </div>
              </div>

              {/* Botón de Reservar */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                <button
                  onClick={() => {
                    onOpenChat(`Hola ${taller.nombre || "Turagua"}, quiero solicitar ${selectedService.nombre.toLowerCase()} para mi vehículo.`);
                    setSelectedService(null);
                    setIsCatalogOpen(false); // Cerramos también el catálogo si estaba abierto
                  }}
                  className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold tracking-widest rounded-xl transition-all duration-300 shadow-md shadow-primary/20 cursor-pointer text-center uppercase"
                >
                  Solicitar este servicio
                </button>
                <button
                  onClick={() => {
                    onOpenChat(`Hola ${taller.nombre || "Turagua"}, tengo dudas sobre el servicio de ${selectedService.nombre.toLowerCase()}.`);
                    setSelectedService(null);
                    setIsCatalogOpen(false);
                  }}
                  className="w-full py-3 bg-white border border-gray-200 hover:bg-gray-50 text-navy text-xs font-bold tracking-widest rounded-xl transition-all cursor-pointer text-center uppercase flex items-center justify-center gap-2"
                >
                  <HeadphonesIcon className="w-4 h-4" /> Hablar con {nombreAgente}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* MODAL DE CATÁLOGO COMPLETO */}
      <AnimatePresence>
        {isCatalogOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative mx-auto flex max-h-[calc(100vh-48px)] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl lg:max-h-[calc(100vh-72px)]"
            >
              <button
                onClick={() => setIsCatalogOpen(false)}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto px-5 pb-8 pt-12 sm:px-6 lg:px-8 lg:pb-10 lg:pt-14">
                {/* Header compacto */}
                <div className="mx-auto mb-8 max-w-3xl text-center">
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                    Servicios {taller.nombre || "Turagua"}
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-[#4a3a3a] sm:text-4xl lg:text-4xl">
                    Catálogo de servicios
                  </h2>
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">
                    Explora nuestras especialidades o cuéntanos qué le pasa a tu vehículo para orientarte mejor.
                  </p>
                </div>

                {/* Toolbar responsive */}
                <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 text-slate-500 shadow-sm lg:max-w-sm">
                    <Search className="h-5 w-5 shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar servicio o problema"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {categories.map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`shrink-0 rounded-2xl border px-5 py-3 text-sm font-bold transition ${
                          activeFilter === filter
                            ? 'border-slate-700 bg-slate-700 text-white shadow-md'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grid correcto para laptop pequeña */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredCatalog.map((s, idx) => (
                    <article key={idx} className="group flex min-h-[220px] flex-col rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_32px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_18px_42px_rgba(15,23,42,0.12)] sm:p-6">
                      <div className="mb-5 flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 text-2xl">
                          {s.icono || "🔧"}
                        </div>

                        <div>
                          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                            {s.categoria || "Especialidad"}
                          </p>
                          <h3 className="text-xl font-black leading-tight text-[#3f3232]">
                            {s.nombre}
                          </h3>
                        </div>
                      </div>

                      <p className="mb-5 text-sm leading-6 text-slate-500 line-clamp-3">
                        {s.descripcion}
                      </p>

                      <div className="mt-auto">
                        <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
                          <CheckCircle2 className="h-4 w-4 text-sky-500" />
                          {s.metadata || "Evaluación previa"}
                        </div>

                        <button 
                          onClick={() => setSelectedService(s)}
                          className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm font-black text-[#3f3232] transition group-hover:border-slate-300 group-hover:bg-slate-50"
                        >
                          Ver detalle
                          <span className="text-lg transition group-hover:translate-x-1">→</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {/* Help block compacto */}
                <div className="mt-6 flex flex-col gap-5 rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-6">
                  <div className="flex items-center gap-4">
                    <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm xl:flex">
                      <HeadphonesIcon className="h-8 w-8" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-[#3f3232]">
                        ¿No sabes qué servicio necesitas?
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-slate-500">
                        Describe el síntoma o problema y te orientamos con el siguiente paso.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row shrink-0">
                    <button 
                      onClick={() => {
                        setIsCatalogOpen(false);
                        onOpenChat(`Hola ${taller.nombre || "Turagua"}, no sé exactamente qué servicio necesito, pero mi vehículo presenta este problema: `);
                      }}
                      className="h-12 rounded-2xl bg-[#3f3232] px-6 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#2f2525]"
                    >
                      Describir mi problema
                    </button>

                    <button 
                      onClick={() => {
                        setIsCatalogOpen(false);
                        onOpenChat(`Hola ${taller.nombre || "Turagua"}, necesito orientación para mi vehículo.`);
                      }}
                      className="h-12 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-[#3f3232] transition hover:bg-slate-50"
                    >
                      Hablar con Iris
                    </button>
                  </div>
                </div>

                {/* Fila de beneficios */}
                <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <ShieldCheck className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-700">Garantía en nuestros servicios</p>
                      <p className="mt-1 leading-5">Respaldo y confianza en cada trabajo.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <Clock className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-700">Técnicos especializados</p>
                      <p className="mt-1 leading-5">Experiencia y capacitación continua.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <BadgeDollarSign className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-700">Cotización transparente</p>
                      <p className="mt-1 leading-5">Precios claros y sin sorpresas.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white">
                      <CalendarDays className="h-5 w-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-black text-slate-700">Agenda tu cita</p>
                      <p className="mt-1 leading-5">Rápido, fácil y seguro.</p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
