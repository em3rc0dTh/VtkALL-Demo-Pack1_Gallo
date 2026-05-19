'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Calendar, ShieldCheck } from 'lucide-react';

export default function ComoFunciona({ taller = {} }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  const pasos = [
    {
      num: '01',
      titulo: 'Escribe por WhatsApp',
      desc: 'Envía un mensaje o usa nuestro chat flotante aquí en la web para iniciar la conversación.',
      icono: MessageSquare,
    },
    {
      num: '02',
      titulo: `${nombreAgente} coordina tu cita`,
      desc: 'Nuestra IA consulta la agenda en tiempo real, te pide los detalles de tu auto y te asigna el mejor horario.',
      icono: Calendar,
    },
    {
      num: '03',
      titulo: '¡Listo! Box Reservado',
      desc: 'La cita se registra en el dashboard del taller al instante. Te esperamos el día pactado.',
      icono: ShieldCheck,
    },
  ];

  return (
    <section id="como-funciona" className="py-28 bg-[#0b0f19] relative border-b border-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-24">
          <motion.span 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-orange-500 uppercase block mb-3"
          >
            MECÁNICA INTELIGENTE
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl font-black text-white tracking-tight"
          >
            ¿Cómo Funciona el Sistema?
          </motion.h2>
          <div className="w-12 h-1 bg-orange-500 mx-auto mt-4 rounded-full" />
        </div>

        {/* Pasos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-16 relative">
          {/* Línea conectora horizontal para pantallas grandes */}
          <div className="hidden md:block absolute top-[30px] left-[15%] right-[15%] h-0.5 bg-gray-800/60 z-0" />

          {pasos.map((paso, idx) => {
            const Icono = paso.icono;
            return (
              <motion.div
                key={paso.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.2 }}
                className="relative z-10 text-center flex flex-col items-center group"
              >
                {/* Círculo del icono */}
                <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-6 group-hover:border-orange-500/50 group-hover:shadow-lg group-hover:shadow-orange-500/5 transition-all duration-300 relative">
                  <Icono className="w-6 h-6 text-orange-500" />
                  <span className="absolute -top-2.5 -right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#111827] border border-gray-800 text-gray-400">
                    {paso.num}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-orange-500 transition-colors duration-200">
                  {paso.titulo}
                </h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed max-w-xs">
                  {paso.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
