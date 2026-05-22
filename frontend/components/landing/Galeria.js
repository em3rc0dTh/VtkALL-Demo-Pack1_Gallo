'use client';

import { useState } from 'react';

const galeria = [
  { url: '/images/Mecanicos-certificados.png',      label: 'Instalaciones Premium',          desc: 'Equipos de última generación', size: 'lg' },
  { url: '/images/galeria_pintura.png',     label: 'Cabina de Pintura Profesional',  desc: 'Acabado perfecto al horno',      size: 'sm' },
  { url: '/images/galeria_flota.png',       label: 'Atención a Flotas de Lujo',      desc: 'Mercedes, Ferrari, Porsche',    size: 'sm' },
  { url: '/images/galeria_diagnostico.png', label: 'Diagnóstico Computarizado',       desc: 'Escaneo OBD-II avanzado',        size: 'sm' },
  { url: '/images/galeria_detailing.png',   label: 'Detailing & Cerámica',            desc: "Productos Meguiar's cert.",     size: 'sm' },
  { url: '/images/galeria_planchado.png',   label: 'Planchado y Carrocería',           desc: 'Restauración total de chasis',  size: 'lg' },
];

export default function Galeria({ taller = {} }) {
  const [isPaused, setIsPaused] = useState(false);

  const imagenes = Array.from({ length: galeria.length }, (_, i) => {
    const url = taller.galeria && taller.galeria[i] ? taller.galeria[i] : galeria[i].url;
    return {
      url,
      label: galeria[i]?.label || `Proyecto ${i + 1}`,
      desc: galeria[i]?.desc || '',
      size: galeria[i]?.size || 'sm',
    };
  });

  return (
    <section id="galeria" className="py-20 bg-transparent relative overflow-hidden flex flex-col justify-center min-h-screen">
      
      {/* Inyección de estilos CSS para perspectiva de perspectiva 3D y scroll infinito */}
      <style jsx global>{`
        @keyframes wallScroll {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }
        .perspective-container {
          perspective: 1200px;
          perspective-origin: 50% 50%;
        }
        .gallery-wall {
          display: flex;
          gap: 16px;
          width: max-content;
          transform-style: preserve-3d;
          animation: wallScroll 40s linear infinite;
        }
        .gallery-wall.paused {
          animation-play-state: paused;
        }
        .gallery-card-3d {
          transform: rotateY(-15deg) translateZ(0px);
          transition: transform 0.5s cubic-bezier(0.25, 1, 0.5, 1), filter 0.5s ease;
        }
        /* Al hacer hover individual, la tarjeta se endereza y resalta */
        .gallery-card-3d:hover {
          transform: rotateY(0deg) translateZ(40px) scale(1.05);
          z-index: 50;
        }
      `}</style>

      {/* Luces de ambiente traseras */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/08 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-secondary/08 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full relative z-10">

        {/* Encabezado */}
        <div className="text-center max-w-2xl mx-auto mb-16 px-4">
          <span className="text-secondary uppercase tracking-[0.2em] text-xs font-bold bg-secondary/10 px-4 py-2 rounded-full">
            📸 Portafolio de Trabajos
          </span>
          <h2
            className="text-4xl md:text-5xl font-black text-navy tracking-tight leading-tight mt-6"
            style={{ fontFamily: "'Readex Pro', sans-serif" }}
          >
            Nuestras Instalaciones<br />y Proyectos
          </h2>
          <div className="w-16 h-1.5 bg-secondary mx-auto mt-5 rounded-full" />
          <p className="text-slate-600 font-light text-sm mt-4 leading-relaxed">
            Explora nuestra infraestructura premium. Posa el cursor para detener el movimiento y examinar los detalles.
          </p>
        </div>

        {/* Contenedor con Perspectiva */}
        <div 
          className="perspective-container w-full overflow-hidden py-10 path-mask"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Muro en movimiento */}
          <div className={`gallery-wall ${isPaused ? 'paused' : ''}`}>
            
            {/* Duplicamos el array completo para que la transición de reinicio sea invisible */}
            {[...imagenes, ...imagenes, ...imagenes].map((item, idx) => (
              <div 
                key={idx} 
                className="gallery-card-3d flex-shrink-0 rounded-[24px] overflow-hidden border border-slate-200/20 bg-white shadow-xl"
                style={{ width: 'clamp(200px, calc((100vw - 140px) / 6), 280px)' }}
              >
                {/* Respetando la altura h-64 solicitada */}
                <div className="relative h-64 overflow-hidden bg-slate-100">
                  <img
                    src={item.url}
                    alt={item.label}
                    className="h-full w-full object-cover transition-transform duration-700"
                    loading="lazy"
                    onError={(e) => { 
                      e.currentTarget.onerror = null; 
                      e.currentTarget.src = '/images/Mecanicos-certificados.png'; 
                    }}
                  />
                </div>
                
                <div className="space-y-1.5 px-6 py-5 relative bg-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                    {item.desc}
                  </p>
                  <h4 className="text-lg font-bold text-navy tracking-tight" style={{ fontFamily: "'Readex Pro', sans-serif" }}>
                    {item.label}
                  </h4>
                </div>
              </div>
            ))}

          </div>
        </div>

      </div>
    </section>
  );
}