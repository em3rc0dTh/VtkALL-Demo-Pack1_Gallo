'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Phone, MessageSquare } from 'lucide-react';

export default function Contacto({ taller = {}, onOpenChat }) {
  return (
    <section id="contacto" className="py-28 bg-light-bg relative border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Información de Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-xs font-bold tracking-widest text-primary uppercase block mb-3">
              CONTACTO
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-navy tracking-tight mb-8">
              ¿Tienes Consultas? Escríbenos
            </h2>
            
            <div className="space-y-6 mb-8">
              <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-primary flex-shrink-0 shadow-sm">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#54595F] uppercase tracking-wider mb-1">
                    Ubicación del Taller
                  </h4>
                  <p className="text-navy text-sm font-medium">
                    {taller.direccion || 'Av. Javier Prado Este 2465, San Borja, Lima'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-primary flex-shrink-0 shadow-sm">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#54595F] uppercase tracking-wider mb-1">
                    Atención Telefónica
                  </h4>
                  <p className="text-navy text-sm font-medium">
                    {taller.telefono || '+51 1 617-6800'}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="p-3 bg-white rounded-xl border border-gray-200 text-primary flex-shrink-0 shadow-sm">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#54595F] uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </h4>
                  <p className="text-navy text-sm font-medium">
                    {taller.email || 'contacto@mecanicapro.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Redes Sociales */}
            <div className="flex gap-3">
              <a 
                href={taller.redes_sociales?.instagram || 'https://instagram.com'} 
                target="_blank" 
                rel="noreferrer"
                className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-200 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a 
                href={taller.redes_sociales?.facebook || 'https://facebook.com'} 
                target="_blank" 
                rel="noreferrer"
                className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-200 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
            </div>
          </motion.div>

          {/* Formulario / CTA de Citas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="p-8 md:p-10 rounded-3xl bg-white border border-gray-200/80 shadow-form-card relative overflow-hidden"
          >
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <h3 className="text-2xl font-bold text-navy mb-4">
              Agenda tu Cita al Instante
            </h3>
            <p className="text-[#54595F] font-light text-sm leading-relaxed mb-8">
              Conversa con <span className="text-navy font-semibold">{taller.config_agente?.nombre_agente || 'Max'}</span>, el asistente del taller.
              {taller.config_agente?.nombre_agente || 'Max'} responderá tus dudas sobre precios, horarios, y registrará tu cita directamente en nuestro sistema.
            </p>

            <button
              onClick={() => onOpenChat(`Hola ${taller.config_agente?.nombre_agente || 'Max'}, me gustaría agendar una cita`)}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-bold text-navy bg-secondary hover:bg-secondary-hover transition-all duration-300 shadow-btn-secondary hover:shadow-btn-secondary-hover hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <MessageSquare className="w-5 h-5 fill-current" /> AGENDAR AHORA
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
