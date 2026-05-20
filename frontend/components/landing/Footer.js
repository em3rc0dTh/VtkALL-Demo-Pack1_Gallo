'use client';

import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export default function Footer({ taller = {} }) {
  const anio = new Date().getFullYear();
  const nombreTaller = taller.nombre_taller || 'Gallo Autos';

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200/50 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        
        {/* Grid de 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-10">
          
          {/* COLUMNA 1: Contacto Directo */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Contacto</h4>
            <div className="space-y-3 text-sm text-[#54595F]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2908F1] shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{taller.direccion || 'Lima, Perú'}</p>
                  <p className="text-xs text-gray-500 mt-1">Zona Premium de Servicios</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-[#2908F1] shrink-0" />
                <span className="font-medium">{taller.telefono || '+51 1 000-0000'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#2908F1] shrink-0" />
                <span className="text-xs">{taller.email || 'contacto@tallermecanica.pe'}</span>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Horarios y Servicios */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider">Horarios</h4>
            <div className="space-y-2.5 text-xs text-[#54595F] bg-white/50 rounded-lg p-3 border border-slate-200/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2908F1]" />
                <span><strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2908F1]" />
                <span><strong>Sábados:</strong> 9:00 AM - 3:00 PM</span>
              </div>
              <div className="pt-2 border-t border-slate-200/30">
                <p className="text-[10px] text-gray-500">Domingos cerrado</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-[#0F172A]">WhatsApp Disponible</h5>
              <a href={`https://wa.me/${taller.whatsapp || '51999888777'}`} className="inline-flex items-center gap-2 px-3 py-2 bg-[#25D366] text-white rounded-lg text-xs font-medium hover:bg-[#1FAD51] transition-colors">
                💬 Contactar por WhatsApp
              </a>
            </div>
          </div>

          {/* COLUMNA 3: Enlaces Rápidos y Redes */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">Enlaces Rápidos</h4>
              <ul className="space-y-2 text-xs font-medium text-[#54595F]">
                <li><a href="#servicios" className="hover:text-[#2908F1] transition-colors">→ Nuestros Servicios</a></li>
                <li><a href="#galeria" className="hover:text-[#2908F1] transition-colors">→ Galería de Trabajos</a></li>
                <li><a href="#nosotros" className="hover:text-[#2908F1] transition-colors">→ Sobre Nosotros</a></li>
                <li><a href="#contacto" className="hover:text-[#2908F1] transition-colors">→ Agendar Cita</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider mb-3">Síguenos</h4>
              <div className="flex gap-3">
                <a href="#facebook" className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 text-[#2908F1] rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium" title="Facebook">
                  f Facebook
                </a>
                <a href="#instagram" className="inline-flex items-center gap-1 px-2 py-1.5 bg-pink-100 text-[#2908F1] rounded-lg hover:bg-pink-200 transition-colors text-xs font-medium" title="Instagram">
                  📷 Instagram
                </a>
                <a href="#linkedin" className="inline-flex items-center gap-1 px-2 py-1.5 bg-blue-100 text-[#2908F1] rounded-lg hover:bg-blue-200 transition-colors text-xs font-medium" title="LinkedIn">
                  in LinkedIn
                </a>
              </div>
            </div>
          </div>

        </div>

        {/* Separador y Copyright */}
        <div className="border-t border-slate-200/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p className="text-center sm:text-left">
            &copy; {anio} <span className="font-semibold text-[#0F172A]">{nombreTaller}</span>. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <span className="hover:text-[#2908F1] transition-colors cursor-default">Privacidad</span>
            <span>•</span>
            <span className="hover:text-[#2908F1] transition-colors cursor-default">Términos</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
