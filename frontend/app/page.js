'use client';

import { useState, useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal.js';
import Navbar from '../components/ui/Navbar.js';
import Hero from '../components/landing/Hero.js';
import StatsBar from '../components/landing/StatsBar.js';
import Servicios from '../components/landing/Servicios.js';
import SobreNosotros from '../components/landing/SobreNosotros.js';
import Contacto from '../components/landing/Contacto.js';
import Testimonios from '../components/landing/Testimonios.js';
import CTA from '../components/landing/CTA.js';
import ChatAsistente from '../components/landing/ChatAsistente.js';
import EmbedBlock from '../components/landing/EmbedBlock.js';
import { api } from '../lib/api.js';
import Galeria from '@/components/landing/Galeria.js';

export default function Home() {
  const [taller, setTaller] = useState({});
  const [servicios, setServicios] = useState([]);
  const [triggerOpenMessage, setTriggerOpenMessage] = useState('');
  const [openChat, setOpenChat] = useState(false);

  // Activate scroll reveal after data is loaded (moved down)

  useEffect(() => {
    if (typeof globalThis !== 'undefined' && globalThis.window) {
      const params = new URLSearchParams(globalThis.window.location.search);
      const chatMsg = params.get('chat_msg');
      const openChatParam = params.get('open_chat');
      
      if (chatMsg) {
        setTriggerOpenMessage(chatMsg);
      } else if (openChatParam === 'true') {
        setOpenChat(true);
      }
      
      if (chatMsg || openChatParam) {
        const newUrl = globalThis.window.location.pathname;
        globalThis.window.history.replaceState({}, '', newUrl);
      }

      const storedTaller = globalThis.window.localStorage.getItem('taller-config');
      if (storedTaller) {
        try {
          setTaller(JSON.parse(storedTaller));
        } catch (e) {
          console.warn('No se pudo parsear taller-config desde localStorage', e);
        }
      }
    }
  }, []);

  const [cargando, setCargando] = useState(true);

  // ─── Activate scroll reveal for all .reveal elements ───
  useScrollReveal([cargando, taller]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const config = await api.getConfiguracion();
        if (config) setTaller(config);
      } catch {
        console.warn('No se pudo cargar la configuración del taller (usando datos por defecto)');
      }
      try {
        const serv = await api.getServicios();
        if (serv) setServicios(serv);
      } catch {
        console.warn('No se pudieron cargar los servicios de la API (usando datos por defecto)');
      } finally {
        setCargando(false);
      }
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (typeof globalThis !== 'undefined' && globalThis.window && taller?.nombre_taller) {
      try {
        globalThis.window.localStorage.setItem('taller-config', JSON.stringify(taller));
      } catch (e) {
        console.warn('No se pudo guardar taller-config en localStorage', e);
      }
    }
  }, [taller]);

  useEffect(() => {
    if (taller?.nombre_taller) {
      document.title = `${taller.nombre_taller} — ${taller.slogan || 'Expertos en cuidado automotriz'}`;
    }
    if (taller?.tema_global?.color) {
      document.documentElement.style.setProperty('--primary', taller.tema_global.color);
      const hoverColors = {
        '#00aeef': '#008fcc',
        '#ef4444': '#dc2626',
        '#10b981': '#059669',
        '#f97316': '#ea580c',
        '#8b5cf6': '#7c3aed',
        '#f36c84': '#e65c74',
        '#7db053': '#6a9c42',
        '#ffb6c1': '#f5a3af',
        '#d8e8ee': '#c3dbe4',
        '#5eaeb9': '#4d9da8'
      };
      const hoverVal = hoverColors[taller.tema_global.color] || taller.tema_global.color;
      document.documentElement.style.setProperty('--primary-hover', hoverVal);
      document.documentElement.style.setProperty('--color-primary', taller.tema_global.color);
      
      try {
        localStorage.setItem('tema-color', taller.tema_global.color);
      } catch (e) {}
    }
  }, [taller]);

  const handleOpenChat = (mensajePrefijado) => {
    setTriggerOpenMessage(mensajePrefijado);
  };

  const bloquesActivos = (taller.constructor_bloques || []).filter(b => b.activo);
  const bloquesARenderizar = bloquesActivos.length > 0 ? bloquesActivos : [
    { id: 'hero-default', tipo: 'HeroBlock', conf: {} },
    { id: 'services-default', tipo: 'ServicesBlock', conf: {} },
    { id: 'us-default', tipo: 'SobreNosotrosBlock', conf: {} },
    { id: 'contact-default', tipo: 'ContactoBlock', conf: {} }
  ];

  if (cargando) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-solid rounded-full animate-spin" style={{ borderColor: 'var(--primary, #f36c84)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-white text-navy overflow-x-hidden">

      {/* ── Ambient background orbs that follow the page ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
        <div className="orb w-[500px] h-[500px] bg-primary/8 top-[-120px] right-[-100px]" />
        <div className="orb w-[380px] h-[380px] bg-cyan/10 bottom-[20%] left-[-80px]" style={{ animationDelay: '2s' }} />
        <div className="orb w-[300px] h-[300px] bg-secondary/6 top-[55%] right-[5%]" style={{ animationDelay: '4s' }} />
      </div>

      {/* ── Navigation ── */}
      <Navbar taller={taller} />

      {/* ── Sections ── */}
      <main className="relative z-10">
        {bloquesARenderizar.map((bloque, index) => {
          let sectionEl = null;

          switch (bloque.tipo) {
            case 'HeroBlock':
              sectionEl = (
                <Hero
                  taller={taller}
                  conf={bloque.conf}
                  onOpenChat={() => handleOpenChat(`Hola ${taller.config_agente?.nombre_agente || 'Max'}, quiero agendar una cita`)}
                />
              );
              break;
            case 'StatsBlock':
              sectionEl = <StatsBar taller={taller} conf={bloque.conf} />;
              break;
            case 'ServicesBlock':
              sectionEl = (
                <>
              <div className="relative z-20" style={{ marginTop: -12 }}>
                <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ display: 'block', height: 24 }}>
                  <path d="M0,0 C480,60 960,0 1440,40 L1440,0 Z" fill='var(--lavender)' />
                </svg>
              </div>
                  <Servicios servicios={servicios} onOpenChat={handleOpenChat} taller={taller} conf={bloque.conf} />
                </>
              );
              break;
            case 'SobreNosotrosBlock':
              sectionEl = (
                <>
                  {/* Wave separator into SobreNosotros */}
                  <div className="relative z-20" style={{ marginTop: -2 }}>
                    <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ display: 'block', height: 30 }}>
                      <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#F4F5FF" />
                    </svg>
                  </div>
                  <SobreNosotros taller={taller} conf={bloque.conf} />
                </>
              );
              break;
            case 'ContactoBlock':
              sectionEl = (
                <>
                  {/* Wave separator into Contacto */}
                  <div className="relative z-20" style={{ marginTop: -2 }}>
                    <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ display: 'block', height: 30 }}>
                      <path d="M0,20 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill='var(--lavender)' />
                    </svg>
                  </div>
                  <Contacto taller={taller} onOpenChat={handleOpenChat} conf={bloque.conf} />
                </>
              );
              break;
            case 'TestimonialsBlock':
              sectionEl = <Testimonios conf={bloque.conf} />;
              break;
            case 'EmbedBlock':
              sectionEl = <EmbedBlock conf={bloque.conf} />;
              break;
            case 'CTABlock':
              sectionEl = <CTA conf={bloque.conf} onOpenChat={handleOpenChat} />;
              break;
            default:
              sectionEl = null;
          }

          return <div key={bloque.id || index}>{sectionEl}</div>;
        })}
        {/* <Galeria taller={taller} /> */}
      </main>

      <ChatAsistente
        taller={taller}
        triggerOpenMessage={triggerOpenMessage}
        setTriggerOpenMessage={setTriggerOpenMessage}
        openChat={openChat}
        setOpenChat={setOpenChat}
      />
    </div>
  );
}
