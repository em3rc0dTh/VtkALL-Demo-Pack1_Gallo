"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Footer({ taller = {}, onOpenChat }) {
  const anio = new Date().getFullYear();
  const nombreTaller = taller.nombre_taller || "Gallo Autos";
  const nombreAgente = taller.config_agente?.nombre_agente || "Max";

  return (
    <footer className="bg-gradient-to-b from-slate-50 to-slate-100 border-t border-slate-200/50 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8">
        {/* Grid de 3 columnas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-10">
          {/* COLUMNA 1: Contacto Directo */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-navy uppercase tracking-wider">
              Contacto
            </h4>
            <div className="space-y-3 text-sm text-[#54595F]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {taller.direccion || "Lima, Perú"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Zona Premium de Servicios
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium">
                  {taller.telefono || "+51 1 000-0000"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span className="text-xs">
                  {taller.email || "contacto@tallermecanica.pe"}
                </span>
              </div>
            </div>
          </div>

          {/* COLUMNA 2: Horarios y Servicios */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-navy uppercase tracking-wider">
              Horarios
            </h4>
            <div className="space-y-2.5 text-xs text-[#54595F] bg-white/50 rounded-lg p-3 border border-slate-200/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  <strong>Lunes a Viernes:</strong> 8:00 AM - 6:00 PM
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>
                  <strong>Sábados:</strong> 9:00 AM - 3:00 PM
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200/30">
                <p className="text-[10px] text-gray-500">Domingos cerrado</p>
              </div>
            </div>

            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-navy">
                Atención al Cliente
              </h5>
              <button
                onClick={() =>
                  onOpenChat &&
                  onOpenChat(`Hola ${nombreAgente}, quiero agendar una cita`)
                }
                className="inline-flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
              >
                💬 Chatear con {nombreAgente}
              </button>
            </div>
          </div>

          {/* COLUMNA 3: Enlaces Rápidos y Redes */}
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
                Enlaces Rápidos
              </h4>
              <ul className="space-y-2 text-xs font-medium text-[#54595F]">
                <li>
                  <a
                    href="#servicios"
                    className="hover:text-primary transition-colors"
                  >
                    → Nuestros Servicios
                  </a>
                </li>
                <li>
                  <a
                    href="#galeria"
                    className="hover:text-primary transition-colors"
                  >
                    → Galería de Trabajos
                  </a>
                </li>
                <li>
                  <a
                    href="#nosotros"
                    className="hover:text-primary transition-colors"
                  >
                    → Sobre Nosotros
                  </a>
                </li>
                <li>
                  <a
                    href="#contacto"
                    className="hover:text-primary transition-colors"
                  >
                    → Agendar Cita
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-navy uppercase tracking-wider mb-3">
                Síguenos
              </h4>
              <div className="flex gap-3">
                <a
                  href={taller.redes_sociales?.facebook || "#facebook"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-200 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
                  title="Facebook"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a
                  href={taller.redes_sociales?.instagram || "#instagram"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-200 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
                  title="Instagram"
                >
                  <svg
                    className="w-4 h-4 fill-none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    viewBox="0 0 24 24"
                  >
                    <rect
                      x="2"
                      y="2"
                      width="20"
                      height="20"
                      rx="5"
                      ry="5"
                    ></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </a>
                <a
                  href={taller.redes_sociales?.linkedin || "#linkedin"}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-white hover:bg-primary rounded-xl border border-gray-200 hover:border-primary text-gray-400 hover:text-white transition-all duration-300 shadow-sm"
                  title="LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Separador y Copyright */}
        <div className="border-t border-slate-200/50 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p className="text-center sm:text-left">
            &copy; {anio}{" "}
            <span className="font-semibold text-navy">{nombreTaller}</span>.
            Powered By Vertical. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <span className="hover:text-primary transition-colors cursor-default">
              Privacidad 
            </span>
            <span>•</span>
            <span className="hover:text-primary transition-colors cursor-default">
              Términos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
