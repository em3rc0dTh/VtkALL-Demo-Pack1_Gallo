'use client';

import { motion } from 'framer-motion';
import { Clock, Tag } from 'lucide-react';

export default function Servicios({ servicios = [], onOpenChat }) {
  // Servicios por defecto por si no cargó la API aún
  const defaultServicios = [
    { nombre: 'Cambio de Aceite', descripcion: 'Cambio de aceite sintético de alta calidad y filtros de aire/aceite.', duracion_minutos: 60, precio_base: 150, icono: '🛢️' },
    { nombre: 'Alineación y Balanceo', descripcion: 'Alineación láser 3D de cuatro ruedas y balanceo computarizado de llantas.', duracion_minutos: 90, precio_base: 120, icono: '🛞' },
    { nombre: 'Service de Frenos', descripcion: 'Inspección completa, cambio de pastillas de freno y rectificación de discos.', duracion_minutos: 120, precio_base: 250, icono: '🛑' }
  ];

  const listado = servicios.length > 0 ? servicios : defaultServicios;

  return (
    <section id="servicios" className="py-28 bg-[#0b0f19] relative border-b border-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Header de la sección */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-orange-500 uppercase block mb-3"
          >
            NUESTRAS ESPECIALIDADES
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
          >
            Mantenimiento y Diagnóstico
          </motion.h2>
          <div className="w-12 h-1 bg-orange-500 mx-auto mt-4 rounded-full" />
        </div>

        {/* Grid de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {listado.map((s, idx) => (
            <motion.div
              key={s.nombre}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              whileHover={{ y: -8, borderColor: 'rgba(249, 115, 22, 0.4)' }}
              className="p-8 rounded-2xl bg-[#111827]/40 border border-gray-800/80 transition-all duration-300 flex flex-col justify-between group hover:shadow-xl hover:shadow-orange-500/5"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-orange-600/10 flex items-center justify-center text-3xl mb-6 group-hover:bg-orange-600/20 transition-all duration-300">
                  {s.icono || '🔧'}
                </div>
                <h3 className="text-xl font-bold text-white mb-3 group-hover:text-orange-500 transition-colors duration-200">
                  {s.nombre}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6 font-light">
                  {s.descripcion}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-800/60 pt-4 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-orange-500/80" /> {s.duracion_minutos} min
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-white">
                    <Tag className="w-3.5 h-3.5 text-orange-500" /> desde S/. {s.precio_base}
                  </span>
                </div>
                <button
                  onClick={() => onOpenChat(`Hola, me interesa agendar una cita para ${s.nombre}`)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold tracking-wider text-orange-500 bg-orange-500/5 border border-orange-500/20 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-all duration-300 cursor-pointer"
                >
                  RESERVAR CITA
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
