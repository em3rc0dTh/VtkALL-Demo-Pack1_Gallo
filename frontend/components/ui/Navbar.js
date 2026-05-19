'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Wrench, Shield } from 'lucide-react';

export default function Navbar({ taller = {} }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuItems = [
    { name: 'Inicio', href: '#inicio' },
    { name: 'Servicios', href: '#servicios' },
    { name: 'Nosotros', href: '#nosotros' },
    { name: 'Cómo Funciona', href: '#como-funciona' },
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'py-4 bg-[#0b0f19]/90 backdrop-blur-md border-b border-gray-800/50 shadow-lg shadow-black/20' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        {/* Brand Brand */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="p-2 bg-orange-600/10 rounded-lg group-hover:bg-orange-600/20 transition-all duration-300">
            <Wrench className="w-6 h-6 text-orange-500" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
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
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Actions Button */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/admin/login"
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider text-gray-300 bg-gray-900 border border-gray-800 hover:text-white hover:bg-gray-800 transition-all duration-200"
          >
            <Shield className="w-3.5 h-3.5" /> ACCESO TALLER
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-gray-400 hover:text-white bg-gray-900/50 border border-gray-850 hover:bg-gray-800/50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full p-4 mt-2 bg-[#0b0f19]/95 backdrop-blur-lg border-b border-gray-800 shadow-xl rounded-b-2xl">
          <div className="flex flex-col gap-4 py-2">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-base font-medium text-gray-400 hover:text-white hover:bg-gray-800/40 rounded-xl transition-all duration-200"
              >
                {item.name}
              </a>
            ))}
            <div className="h-px bg-gray-800 my-1"></div>
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 transition-all duration-200"
            >
              <Shield className="w-4 h-4" /> ACCESO TALLER
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
