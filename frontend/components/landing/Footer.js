'use client';

import Link from 'next/link';
import { Wrench } from 'lucide-react';

export default function Footer({ taller = {} }) {
  const anio = new Date().getFullYear();

  return (
    <footer className="bg-[#070b13] border-t border-gray-900 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-600/10 rounded-lg text-orange-500">
            <Wrench className="w-5 h-5" />
          </div>
          <span className="text-md font-bold tracking-tight text-white">
            {taller.nombre_taller ? (
              <>
                {taller.nombre_taller.includes(' ') ? (
                  <>
                    {taller.nombre_taller.substring(0, taller.nombre_taller.indexOf(' '))}
                    <span className="text-orange-500">{taller.nombre_taller.substring(taller.nombre_taller.indexOf(' '))}</span>
                  </>
                ) : (
                  <>
                    {taller.nombre_taller}
                  </>
                )}
              </>
            ) : (
              <>
                Mecánica<span className="text-orange-500">Pro</span>
              </>
            )}
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-medium text-gray-500">
          <a href="#inicio" className="hover:text-gray-300 transition-colors">Inicio</a>
          <a href="#servicios" className="hover:text-gray-300 transition-colors">Servicios</a>
          <a href="#nosotros" className="hover:text-gray-300 transition-colors">Nosotros</a>
          <a href="#como-funciona" className="hover:text-gray-300 transition-colors">Funcionamiento</a>
          <a href="#contacto" className="hover:text-gray-300 transition-colors">Contacto</a>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-600">
          &copy; {anio} {taller.nombre_taller || 'MecánicaPro'}. Todos los derechos reservados.
        </p>

      </div>
    </footer>
  );
}
