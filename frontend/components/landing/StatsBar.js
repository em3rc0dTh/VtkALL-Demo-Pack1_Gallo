'use client';

import { motion } from 'framer-motion';

export default function StatsBar({ taller = {}, conf = {} }) {
  const hasConf = Object.keys(conf).length > 0;
  const is3Cols = conf.columnas === '3';
  
  let stats = [];
  if (hasConf) {
    stats = [
      { value: conf.stat1_valor || '12', label: conf.stat1_label || 'Años Experiencia' },
      { value: conf.stat2_valor || '840', label: conf.stat2_label || 'Clientes Felices' },
      { value: conf.stat3_valor || '2500', label: conf.stat3_label || 'Autos Reparados' }
    ];
    if (!is3Cols) {
      stats.push({ value: conf.stat4_valor || '99.2%', label: conf.stat4_label || 'Satisfacción' });
    }
  } else {
    stats = [
      { value: taller.anos_experiencia || 12, label: 'Años de Experiencia', suffix: '+' },
      { value: taller.clientes_atendidos || 840, label: 'Clientes Atendidos', suffix: '+' },
      { value: taller.autos_reparados || 2500, label: 'Autos Reparados', suffix: '+' },
      { value: '99.2%', label: 'Satisfacción', suffix: '' },
    ];
  }

  // Styles depending on conf.estilo
  let bgClass = 'bg-[#F9FAFF]';
  let borderClass = 'border-primary/10';
  let textClass = 'text-[#54595F]';
  let valueClass = 'text-primary';

  if (conf.estilo === 'Tarjetas Oscuras') {
    bgClass = 'bg-gradient-to-br from-navy to-[#1E293B]';
    borderClass = 'border-primary/20';
    textClass = 'text-white/70';
    valueClass = 'text-primary';
  } else if (conf.estilo === 'Sin Borde') {
    bgClass = 'bg-transparent';
    borderClass = 'border-transparent shadow-none';
    textClass = 'text-[#54595F]';
    valueClass = 'text-primary';
  }

  const columnsClass = is3Cols 
    ? 'grid-cols-1 sm:grid-cols-3' 
    : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className="relative z-20 -mt-12 max-w-6xl mx-auto px-6">
      <div className={`grid ${columnsClass} gap-4 sm:gap-6 p-5 sm:p-8 rounded-2xl ${bgClass} border ${borderClass} shadow-xl shadow-blue-900/5`}>
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: idx * 0.1 }}
            className="text-center flex flex-col justify-center"
          >
            <span className={`text-2xl sm:text-3xl md:text-4xl font-black ${valueClass} tracking-tight mb-1`}>
              {stat.value}{stat.suffix || ''}
            </span>
            <span className={`text-[9px] sm:text-[10px] md:text-xs font-semibold ${textClass} uppercase tracking-widest`}>
              {stat.label}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
