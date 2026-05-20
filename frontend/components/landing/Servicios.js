'use client';

import { motion } from 'framer-motion';
import { Clock, Tag } from 'lucide-react';

export default function Servicios({ servicios = [], onOpenChat }) {
  // Servicios por defecto por si no cargó la API aún
  const defaultServicios = [
    { nombre: 'Mecánica Preventiva y Correctiva', descripcion: 'Soporte multimarca premium, scanner computarizado de sensores OBD-II y afinamiento integral.', duracion_minutos: 90, precio_base: 120, icono: '🔧' },
    { nombre: 'Planchado y Pintura Automotriz', descripcion: 'Reparación profesional de golpes y acabado en cabina de pintura al horno con insumos de alta gama.', duracion_minutos: 180, precio_base: 350, icono: '🎨' },
    { nombre: 'Detailing y Tratamiento Cerámico', descripcion: 'Pulido Meguiar\'s, corrección de laca y recubrimiento cerámico para máxima protección y brillo.', duracion_minutos: 120, precio_base: 280, icono: '✨' },
    { nombre: 'Atención a Particulares y Flotas', descripcion: 'Servicio preferente y facturación corporativa para mantenimiento preventivo de flotas empresariales.', duracion_minutos: 60, precio_base: 90, icono: '🏢' }
  ];

  const listado = servicios.length > 0 ? servicios : defaultServicios;

  return (
    <section id="servicios" className="py-28 bg-[#F4F5FF] relative border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Métricas rápidas de Gallo Autos */}
        <div className="flex flex-wrap justify-center gap-8 mb-12 text-center text-[#54595F] text-xs font-semibold uppercase tracking-wider">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2908F1]/5 border border-[#2908F1]/10">
            🕒 Entrega Promedio: 48 Horas
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2908F1]/5 border border-[#2908F1]/10">
            🤝 Clientes Particulares y Flotas
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2908F1]/5 border border-[#2908F1]/10">
            🏆 Garantía por Escrito
          </div>
        </div>

        {/* Header de la sección */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-[#2908F1] uppercase block mb-3"
          >
            NUESTRAS ESPECIALIDADES
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-black text-[#0F172A] tracking-tight"
          >
            Mantenimiento y Diagnóstico
          </motion.h2>
          <div className="w-12 h-1 bg-[#FFC800] mx-auto mt-4 rounded-full" />
        </div>

        {/* Grid de Servicios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {listado.map((s, idx) => (
            <motion.div
              key={s.nombre}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -8, borderColor: '#2908F1' }}
              className="p-8 rounded-2xl bg-[#F9FAFF] border border-[#2908F1]/10 transition-all duration-300 flex flex-col justify-between group hover:shadow-xl hover:shadow-blue-900/5"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#2908F1]/10 flex items-center justify-center text-3xl mb-6 group-hover:bg-[#2908F1]/20 group-hover:scale-110 transition-all duration-300 relative">
                  <span className="group-hover:animate-engine-vibrate inline-block">
                    {s.icono || '🔧'}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-3 group-hover:text-[#2908F1] transition-colors duration-200">
                  {s.nombre}
                </h3>
                <p className="text-[#54595F] text-sm leading-relaxed mb-6 font-light">
                  {s.descripcion}
                </p>
              </div>

              <style jsx global>{`
                @keyframes engineVibrate {
                  0% { transform: translate(0, 0) rotate(0deg); }
                  20% { transform: translate(-1px, 1px) rotate(-1deg); }
                  40% { transform: translate(1px, -1px) rotate(1.5deg); }
                  60% { transform: translate(-1px, -1px) rotate(-0.5deg); }
                  80% { transform: translate(1.5px, 1px) rotate(1deg); }
                  100% { transform: translate(0, 0) rotate(0deg); }
                }
                .group-hover\\:animate-engine-vibrate {
                  animation: engineVibrate 0.15s linear infinite;
                }
                /* Tailwind class support for direct reference */
                .group:hover .group-hover\\:animate-engine-vibrate {
                  animation: engineVibrate 0.15s linear infinite;
                }
              `}</style>

              <div>
                <div className="flex items-center justify-between text-xs text-[#54595F] border-t border-gray-100 pt-4 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#2908F1]" /> {s.duracion_minutos} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-[#0F172A]">
                    <Tag className="w-3.5 h-3.5 text-[#2908F1]" /> desde S/. {s.precio_base}
                  </span>
                </div>
                <button
                  onClick={() => onOpenChat(`Hola, me interesa agendar una cita para ${s.nombre}`)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider text-[#2908F1] bg-[#2908F1]/5 border border-[#2908F1]/20 group-hover:bg-[#2908F1] group-hover:text-white group-hover:border-[#2908F1] transition-all duration-300 cursor-pointer"
                >
                  RESERVAR CITA
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Sección de Ofertas Especiales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          
          {/* Promoción del Mes */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#2908F1] to-[#4F46E5] text-white border-none relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex flex-col h-full justify-between gap-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-[#FFC800] text-black font-mono font-bold text-[9px] uppercase tracking-widest mb-3">
                  PROMO DEL MES
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                  Cambio de Aceite + Diagnóstico Computarizado Gratis
                </h3>
                <p className="text-white/80 text-xs font-light mt-2 leading-relaxed">
                  Agenda tu cambio de aceite con nosotros este mes y recibe un escaneo computarizado de sensores OBD-II completamente gratis. Protege la salud y el rendimiento de tu motor.
                </p>
              </div>
              <button
                onClick={() => onOpenChat('Hola, me interesa la Promo del Mes: Cambio de Aceite + Diagnóstico Gratis')}
                className="w-full py-3 rounded-xl text-xs font-bold tracking-wider text-[#0F172A] bg-[#FFC800] hover:bg-[#e6b400] transition-all duration-300 shadow-lg shadow-yellow-500/10 cursor-pointer text-center"
              >
                AGENDAR PROMOCIÓN
              </button>
            </div>
          </motion.div>

          {/* Black Friday Especial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="p-8 rounded-3xl bg-gradient-to-br from-[#0F172A] to-[#2908F1] text-white border border-[#2908F1]/30 relative overflow-hidden shadow-xl"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-28 h-28 rounded-full bg-white/5 blur-xl pointer-events-none" />
            <div className="flex flex-col h-full justify-between gap-6">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded bg-[#2908F1] text-white font-mono font-bold text-[9px] uppercase tracking-widest mb-3">
                  EDICIÓN LIMITADA
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                  Especial Black Friday: 20% OFF en Pintura Completa
                </h3>
                <p className="text-white/80 text-xs font-light mt-2 leading-relaxed">
                  Consigue un acabado impecable de fábrica con un 20% de descuento en trabajos completos de planchado y pintura automotriz al horno, incluyendo tratamiento cerámico Meguiar's.
                </p>
              </div>
              <button
                onClick={() => onOpenChat('Hola, quiero reservar con el 20% de descuento del Especial Black Friday de Planchado y Pintura')}
                className="w-full py-3 rounded-xl text-xs font-bold tracking-wider text-white bg-[#2908F1] hover:bg-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/15 cursor-pointer text-center"
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
