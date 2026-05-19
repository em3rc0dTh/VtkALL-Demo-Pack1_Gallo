'use client';

import { motion } from 'framer-motion';
import { Award, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SobreNosotros({ taller = {} }) {
  const caracteristicas = [
    { titulo: 'Técnicos Certificados', desc: 'Profesionales altamente capacitados en mecánica general y electrónica automotriz.' },
    { titulo: 'Garantía Escrita', desc: 'Todos nuestros trabajos cuentan con garantía de repuestos y mano de obra.' },
    { titulo: 'Equipamiento de Fábrica', desc: 'Escáneres y herramientas de diagnóstico originales homologadas.' }
  ];

  return (
    <section id="nosotros" className="py-28 bg-[#070b13] relative border-b border-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Columna Izquierda: Imagen Decorativa */}
          <motion.div 
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="relative h-[480px] rounded-3xl overflow-hidden border border-gray-800"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url('https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800')` }}
            />
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070b13] via-transparent to-transparent" />
            
            {/* Badge de Experiencia flotante */}
            <div className="absolute bottom-6 left-6 p-6 rounded-2xl glass-panel border border-orange-500/30 flex items-center gap-4">
              <Award className="w-10 h-10 text-orange-500" />
              <div>
                <h4 className="text-xl font-bold text-white">{taller.anos_experiencia || 12} Años</h4>
                <p className="text-xs text-gray-400">Trayectoria Ininterrumpida</p>
              </div>
            </div>
          </motion.div>

          {/* Columna Derecha: Texto e Información */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-xs font-bold tracking-widest text-orange-500 uppercase block mb-3">
              ¿QUIÉNES SOMOS?
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">
              Compromiso Con La Calidad De Tu Auto
            </h2>
            <p className="text-gray-400 font-light leading-relaxed mb-8">
              {taller.sobre_nosotros || 'En MecánicaPro contamos con más de 10 años de trayectoria brindando servicios mecánicos integrales de alta calidad. Contamos con tecnología de diagnóstico computarizado avanzada y un equipo de profesionales apasionados por el cuidado de tu automóvil.'}
            </p>

            {/* Listado de características */}
            <div className="space-y-6">
              {caracteristicas.map((item, idx) => (
                <div key={item.titulo} className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-md font-semibold text-white mb-1">{item.titulo}</h4>
                    <p className="text-sm text-gray-400 font-light">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
