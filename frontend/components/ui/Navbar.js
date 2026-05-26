'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X, Shield } from 'lucide-react';

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
    { name: 'Contacto', href: '#contacto' },
  ];

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled 
        ? 'py-4 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-md shadow-gray-200/25' 
        : 'py-6 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        {/* Brand Brand */}
        <Link href="/" className="flex items-center group select-none">
          <div className="flex items-center justify-center w-32 h-12 md:w-40 md:h-16 p-2 rounded-2xl bg-transparent shadow-navbar ring-1 ring-primary/15 transition-all duration-300 group-hover:shadow-navbar-hover group-hover:ring-primary/25 flex-shrink-0">
            <img
              src="/images/turagua.jpg"
              alt="Turagua"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="max-w-0 opacity-0 overflow-hidden group-hover:max-w-[200px] group-hover:opacity-100 group-hover:ml-3 transition-all duration-500 ease-in-out whitespace-nowrap">
            <span className="text-xl font-bold tracking-tight text-navy">
              {taller.nombre_taller ? (
                <>
                  {taller.nombre_taller.includes(' ') ? (
                    <>
                      {taller.nombre_taller.substring(0, taller.nombre_taller.indexOf(' '))}
                      <span className="text-primary">{taller.nombre_taller.substring(taller.nombre_taller.indexOf(' '))}</span>
                    </>
                  ) : (
                    <>
                      {taller.nombre_taller}
                    </>
                  )}
                </>
              ) : (
                <>
                  Turagua<span className="text-primary"> Racing</span>
                </>
              )}
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-base font-semibold text-[#54595F] hover:text-primary transition-colors duration-200"
            >
              {item.name}
            </a>
          ))}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-[#54595F] hover:text-primary bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full p-4 mt-2 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-xl rounded-b-2xl">
          <div className="flex flex-col gap-4 py-2">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-base font-medium text-[#54595F] hover:text-primary hover:bg-gray-50 rounded-xl transition-all duration-200"
              >
                {item.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
