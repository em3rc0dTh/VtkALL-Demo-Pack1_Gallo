'use client';

import { motion } from 'framer-motion';

export default function StatsBar({ taller = {} }) {
  const stats = [
    { value: taller.anos_experiencia || 12, label: 'Años de Experiencia', suffix: '+' },
    { value: taller.clientes_atendidos || 840, label: 'Clientes Atendidos', suffix: '+' },
    { value: taller.autos_reparados || 2500, label: 'Autos Reparados', suffix: '+' },
    { value: '99.2%', label: 'Satisfacción', suffix: '' },
  ];

  return (
    <div className="relative z-20 -mt-12 max-w-6xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-8 rounded-2xl glass-panel border border-gray-800 shadow-2xl shadow-black/40">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="text-center flex flex-col justify-center"
          >
            <span className="text-3xl md:text-4xl font-black text-orange-500 tracking-tight mb-1">
              {stat.value}{stat.suffix}
            </span>
            <span className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-widest">
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
