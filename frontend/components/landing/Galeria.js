'use client';

import { motion } from 'framer-motion';

export default function Galeria({ taller = {} }) {
  const defaultGaleria = [
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1517524206127-48bbd363f3d7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1617886326072-1be7c2329c22?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=800',
    'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=800'
  ];

  const imagenes = taller.galeria && taller.galeria.length > 0 ? taller.galeria : defaultGaleria;

  return (
    <section id="galeria" className="py-28 bg-[#070b13] relative border-b border-gray-900">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <span className="text-xs font-bold tracking-widest text-orange-500 uppercase block mb-3">
            GALERÍA DE TRABAJOS
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            Nuestras Instalaciones y Proyectos
          </h2>
          <div className="w-12 h-1 bg-orange-500 mx-auto mt-4 rounded-full" />
        </div>

        {/* Grid de Imágenes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {imagenes.map((url, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative group h-64 rounded-2xl overflow-hidden border border-gray-800 bg-gray-950"
            >
              {/* Imagen */}
              <div 
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                style={{ backgroundImage: `url('${url}')` }}
              />
              {/* Filtro Hover */}
              <div className="absolute inset-0 bg-orange-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              {/* Borde sutil hover */}
              <div className="absolute inset-0 border border-transparent group-hover:border-orange-500/30 rounded-2xl transition-all duration-300 pointer-events-none" />
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
