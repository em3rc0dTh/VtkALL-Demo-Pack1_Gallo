'use client';

import { Mail, MapPin, Phone, MessageSquare, Clock } from 'lucide-react';

export default function Contacto({ taller = {}, onOpenChat }) {
  const nombreTaller = taller.nombre_taller || 'Gallo Autos';
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  const anio = new Date().getFullYear();

  return (
    <section 
      id="contacto" 
      className="min-h-screen lg:h-screen bg-light-bg relative border-b border-gray-200/50 flex flex-col justify-between py-8 md:py-12 overflow-hidden scroll-mt-20 select-none"
    >
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-8 w-full flex-1 flex flex-col justify-center gap-6 md:gap-10 relative z-10">
        
        {/* Title Header */}
        <div className="reveal">
          <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-1">
            CONTACTO & ATENCIÓN
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-navy tracking-tight leading-tight">
            ¿Tienes Consultas? Escríbenos
          </h2>
        </div>

        {/* 2-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center reveal delay-2">
          
          {/* COLUMNA 1: Información & Horarios (Lado Izquierdo) */}
          <div className="lg:col-span-6 flex flex-col justify-between gap-6 md:gap-8 h-full">
            <div className="space-y-5">
              
              {/* Dirección */}
              <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200/60 text-primary flex-shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                    Ubicación del Taller
                  </h4>
                  <p className="text-navy text-sm font-semibold leading-relaxed">
                    {taller.direccion || 'Av. Javier Prado Este 2465, San Borja, Lima'}
                  </p>
                </div>
              </div>

              {/* Teléfono */}
              <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200/60 text-primary flex-shrink-0 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                    Atención Telefónica
                  </h4>
                  <p className="text-navy text-sm font-semibold">
                    {taller.telefono || '+51 1 617-6800'}
                  </p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200/60 text-primary flex-shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">
                    Correo Electrónico
                  </h4>
                  <p className="text-navy text-sm font-semibold">
                    {taller.email || 'contacto@mecanicapro.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Redes Sociales e Horarios agrupados */}
            <div className="flex flex-col gap-4">
              {/* Horarios Inline */}
              <div className="bg-white/40 border border-slate-200/20 backdrop-blur-sm rounded-2xl p-5 max-w-xl">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Horarios de Atención
                </h4>
                <div className="grid grid-cols-3 gap-4 text-xs text-[#54595F]">
                  <div>
                    <span className="font-semibold text-navy block mb-0.5">Lunes a Viernes</span>
                    <span className="text-[11px]">8:00 AM - 6:00 PM</span>
                  </div>
                  <div>
                    <span className="font-semibold text-navy block mb-0.5">Sábados</span>
                    <span className="text-[11px]">9:00 AM - 3:00 PM</span>
                  </div>
                  <div>
                    <span className="font-semibold text-red-500 block mb-0.5">Domingos</span>
                    <span className="text-[11px] text-red-500 italic">Cerrado</span>
                  </div>
                </div>
              </div>

              {/* Botones de Redes Sociales */}
              <div className="flex gap-2.5">
                <a 
                  href={taller.redes_sociales?.facebook || 'https://facebook.com'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-250/50 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                  </svg>
                </a>
                <a 
                  href={taller.redes_sociales?.instagram || 'https://instagram.com'} 
                  target="_blank" 
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-250/50 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Agenda tu Cita (Lado Derecho - Foco Principal) */}
          <div className="lg:col-span-6 flex flex-col justify-center w-full">
            <div className="p-8 md:p-10 rounded-[32px] bg-white border border-gray-200/80 shadow-form-card relative overflow-hidden flex flex-col justify-between min-h-[360px] w-full">
              {/* Ambient glows */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-navy tracking-tight leading-tight flex items-center gap-2">
                  Agenda tu Cita al Instante
                </h3>
                <p className="text-[#54595F] font-light text-sm leading-relaxed">
                  Conversa con <span className="text-navy font-semibold">{nombreAgente}</span>, de nuestro equipo de atención al cliente.
                  Coordinará tus dudas sobre precios y horarios, y registrará tu cita al instante.
                </p>
              </div>

              <button
                onClick={() => onOpenChat(`Hola ${nombreAgente}, me gustaría agendar una cita`)}
                className="w-full flex items-center justify-center gap-3 py-4 mt-6 rounded-2xl text-xs font-bold text-white bg-secondary hover:bg-secondary-hover transition-all duration-300 shadow-btn-secondary hover:shadow-btn-secondary-hover hover:scale-[1.02] active:scale-[0.98] cursor-pointer uppercase tracking-wider"
              >
                <MessageSquare className="w-5 h-5 fill-current" /> AGENDAR AHORA
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Footer Ribbon al pie de la pantalla */}
      <div className="max-w-7xl mx-auto px-6 md:px-8 w-full border-t border-slate-200/50 pt-5 mt-auto relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-gray-500">
        <p className="text-center sm:text-left">
          &copy; {anio} <span className="font-semibold text-navy">{nombreTaller}</span>. Powered by Vertical. Todos los derechos reservados.
        </p>
        <div className="flex gap-4">
          <a href="#servicios" className="hover:text-primary transition-colors">Servicios</a>
          <span>•</span>
          <a href="#galeria" className="hover:text-primary transition-colors">Galería</a>
          <span>•</span>
          <a href="#nosotros" className="hover:text-primary transition-colors">Nosotros</a>
        </div>
      </div>
    </section>
  );
}
