'use client';

import { motion } from 'framer-motion';
import { Star, User } from 'lucide-react';

export default function Testimonios({ conf = {} }) {
  const tituloSeccion = conf.tituloSeccion || 'Clientes Satisfechos';
  const subtitulo = conf.subtitulo || 'Reseñas reales de conductores que confían en nuestro taller.';
  const estiloTarjeta = conf.estiloTarjeta || 'Estándar'; // Borde Neón (Cyberpunk), Glassmorphism, Estándar
  const fondoSeccion = conf.fondoSeccion || 'Oscuro Estándar'; // Acentuado, Oscuro Estándar, Claro
  const mostrarEstrellas = conf.mostrarEstrellas !== false;
  const mostrarAvatares = conf.mostrarAvatares !== false;
  const mostrarEmpresa = conf.mostrarEmpresa !== false;

  const defaultTestimonios = [
    {
      nombre: 'Carlos Mendoza',
      vehiculo: 'Audi A4 2.0 TFSI',
      texto: 'El diagnóstico computarizado fue sumamente preciso. Me ahorró mucho dinero y tiempo en la reparación de la transmisión de mi auto. El staff es súper profesional.',
      estrellas: 5,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150',
    },
    {
      nombre: 'Patricia Silva',
      vehiculo: 'Toyota Corolla',
      texto: 'Excelente atención en planchado y pintura. El acabado en la cabina al horno quedó impecable, del mismo tono que de fábrica. ¡Muy contenta con el resultado!',
      estrellas: 5,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150',
    },
    {
      nombre: 'Roberto Pérez',
      vehiculo: 'Hyundai Tucson',
      texto: 'El asistente virtual me agendó la cita en menos de 2 minutos un domingo por la noche. El lunes a primera hora ya me estaban esperando. Gran optimización del tiempo.',
      estrellas: 5,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150',
    },
  ];

  // Estilos de contenedor de sección
  let sectionBg = 'bg-[#F4F5FF] text-navy';
  if (fondoSeccion === 'Acentuado') {
    sectionBg = 'bg-gradient-to-br from-navy via-slate-900 to-primary/10 text-white';
  } else if (fondoSeccion === 'Oscuro Estándar') {
    sectionBg = 'bg-[#0B0F19] text-white border-t border-gray-800';
  }

  // Estilos de tarjetas
  const getCardClasses = () => {
    if (estiloTarjeta === 'Borde Neón (Cyberpunk)') {
      return 'border border-primary/50 shadow-[0_0_15px_rgba(0,174,239,0.25)] bg-slate-950/80 backdrop-blur-md text-white';
    } else if (estiloTarjeta === 'Glassmorphism') {
      return 'bg-white/5 backdrop-blur-md border border-white/10 text-white shadow-xl';
    } else {
      // Estándar
      return fondoSeccion === 'Claro'
        ? 'bg-white border border-gray-250/60 shadow-md text-navy'
        : 'bg-[#111827] border border-gray-800 text-white shadow-lg';
    }
  };

  return (
    <section className={`py-20 relative overflow-hidden ${sectionBg}`}>
      {/* Decorative Blur Orbs */}
      {fondoSeccion !== 'Claro' && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      )}

      <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-bold tracking-widest text-primary uppercase block mb-1"
          >
            TESTIMONIOS
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-4xl font-black tracking-tight"
            style={{ fontFamily: "'Readex Pro', sans-serif" }}
          >
            {tituloSeccion}
          </motion.h2>
          <p className={`text-sm mt-3 font-light ${fondoSeccion === 'Claro' ? 'text-gray-500' : 'text-gray-400'}`}>
            {subtitulo}
          </p>
          <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full" />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {defaultTestimonios.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.15 }}
              className={`p-8 rounded-[24px] flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${getCardClasses()}`}
            >
              <div>
                {/* Stars */}
                {mostrarEstrellas && (
                  <div className="flex gap-1 mb-5">
                    {[...Array(item.estrellas)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-[#ffc800] text-[#ffc800] drop-shadow-[0_0_3px_rgba(255,200,0,0.3)]" />
                    ))}
                  </div>
                )}
                {/* Review Text */}
                <p className="text-sm font-light leading-relaxed italic mb-6">
                  &quot;{item.texto}&quot;
                </p>
              </div>

              {/* Profile Card */}
              <div className="flex items-center gap-4 border-t border-slate-700/10 pt-5 mt-auto">
                {mostrarAvatares ? (
                  <img
                    src={item.avatar}
                    alt={item.nombre}
                    className="w-11 h-11 rounded-full object-cover border-2 border-primary/25"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold tracking-tight">{item.nombre}</h4>
                  {mostrarEmpresa && (
                    <span className="text-[10px] text-primary font-mono tracking-wider uppercase block mt-0.5">
                      {item.vehiculo}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
