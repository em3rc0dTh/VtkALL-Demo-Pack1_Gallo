'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function Navbar({ taller = {} }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [savedNombreTaller, setSavedNombreTaller] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('taller-config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.nombre_taller) {
          setSavedNombreTaller(parsed.nombre_taller);
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar nombre_taller desde localStorage', e);
    }
  }, []);

  useEffect(() => {
    if (taller?.nombre_taller) {
      setSavedNombreTaller(taller.nombre_taller);
    }
  }, [taller]);

  const brandName = taller.nombre_taller || savedNombreTaller || taller.branding?.displayName || taller.branding?.name || 'Demo Test';
  const [firstBrandWord, ...restBrandWords] = brandName.split(' ');
  const restBrandName = restBrandWords.length ? ` ${restBrandWords.join(' ')}` : '';
  const bloques = taller?.constructor_bloques || [];
  const isActive = (tipo) => {
    const bloque = bloques.find((b) => b.tipo === tipo);
    return bloque ? bloque.activo : true;
  };

  const customItems = bloques
    .filter((b) => b.activo && b.tipo === 'EmbedBlock')
    .map((b) => ({
      name: b.conf?.nombreNavbar || 'Extra',
      href: `#${b.conf?.idSeccion || b.id}`,
      visible: true,
    }));

  const menuItems = [
    { name: 'Inicio', href: '#inicio', visible: isActive('HeroBlock') },
    { name: 'Servicios', href: '#servicios', visible: isActive('ServicesBlock') },
    { name: 'Nosotros', href: '#nosotros', visible: isActive('SobreNosotrosBlock') },
    ...customItems,
    { name: 'Contacto', href: '#contacto', visible: isActive('ContactoBlock') },
  ].filter((item) => item.visible);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isScrolled
        ? 'py-3.5 bg-white/95 backdrop-blur-md border-b border-gray-200/60 shadow-md shadow-gray-200/25'
        : 'py-5 bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-8 flex items-center justify-between">
        <Link href="/#inicio" className="flex items-center group select-none">
          <div className={`flex items-center justify-center w-32 h-16 md:w-36 md:h-14 p-1 rounded-xl md:rounded-2xl bg-white transition-all duration-300 group-hover:scale-105 flex-shrink-0 ${
            isScrolled
              ? 'shadow-md ring-2 ring-primary/45'
              : 'shadow-sm ring-1 ring-primary/20'
          }`}>
            <span className="text-center text-sm font-black uppercase tracking-wide text-navy">
              {firstBrandWord}
            </span>
          </div>
          <div className="hidden md:block ml-3 whitespace-nowrap">
            <span className="text-xl font-bold tracking-tight text-navy">
              {restBrandName ? (
                <>
                  {firstBrandWord}
                  <span className="text-primary">{restBrandName}</span>
                </>
              ) : (
                brandName
              )}
            </span>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {menuItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-[17px] font-bold text-navy/95 hover:text-primary transition-colors duration-200 tracking-wide"
            >
              {item.name}
            </a>
          ))}
        </div>

        <div className="md:hidden flex items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-navy hover:text-primary bg-white border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full p-4 mt-2 bg-white/95 backdrop-blur-lg border-b border-gray-200 shadow-xl rounded-b-2xl">
          <div className="flex flex-col gap-4 py-2">
            {menuItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-lg font-bold text-navy hover:text-primary hover:bg-gray-50 rounded-xl transition-all duration-200"
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
