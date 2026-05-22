'use client';

import { useState, useEffect } from 'react';
import useScrollReveal from '../hooks/useScrollReveal.js';
import Navbar from '../components/ui/Navbar.js';
import Hero from '../components/landing/Hero.js';
import StatsBar from '../components/landing/StatsBar.js';
import Servicios from '../components/landing/Servicios.js';
import SobreNosotros from '../components/landing/SobreNosotros.js';
import ComoFunciona from '../components/landing/ComoFunciona.js';
import Galeria from '../components/landing/Galeria.js';
import Contacto from '../components/landing/Contacto.js';
import Footer from '../components/landing/Footer.js';
import ChatAsistente from '../components/landing/ChatAsistente.js';
import CarSpeedStrip from '../components/landing/CarSpeedStrip.js';
import CarBrands from '../components/landing/CarBrands.js';
import InsurancePartners from '../components/landing/InsurancePartners.js';
import { api } from '../lib/api.js';

export default function Home() {
  const [taller, setTaller] = useState({});
  const [servicios, setServicios] = useState([]);
  const [triggerOpenMessage, setTriggerOpenMessage] = useState('');

  // ─── Activate scroll reveal for all .reveal elements ───
  useScrollReveal();

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
      }
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (taller?.nombre_taller) {
      document.title = `${taller.nombre_taller} — ${taller.slogan || 'Tu vehículo en las mejores manos'}`;
    }
  }, [taller]);

  const handleOpenChat = (mensajePrefijado) => {
    setTriggerOpenMessage(mensajePrefijado);
  };

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
        <Hero taller={taller} onOpenChat={() => handleOpenChat(`Hola ${taller.config_agente?.nombre_agente || 'Max'}, quiero agendar una cita`)} />

        {/* Wave separator */}
        <div className="relative h-0 z-20">
          <svg viewBox="0 0 1440 60" className="w-full -mt-1" preserveAspectRatio="none" style={{ display: 'block', height: 60 }}>
            <path d="M0,30 C360,60 1080,0 1440,30 L1440,60 L0,60 Z" fill='var(--lavender)' />
          </svg>
        </div>

        <StatsBar taller={taller} />
        <CarSpeedStrip />
        <CarBrands />

        {/* Wave separator into Servicios */}
        <div className="relative z-20" style={{ marginTop: -2 }}>
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ display: 'block', height: 60 }}>
            <path d="M0,0 C480,60 960,0 1440,40 L1440,0 Z" fill='var(--lavender)' />
          </svg>
        </div>

        <Servicios servicios={servicios} onOpenChat={handleOpenChat} />

        {/* Wave separator into SobreNosotros */}
        <div className="relative z-20" style={{ marginTop: -2 }}>
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ display: 'block', height: 60 }}>
            <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" fill="#F4F5FF" />
          </svg>
        </div>

        <SobreNosotros taller={taller} />
        <ComoFunciona taller={taller} />
        <Galeria taller={taller} />
        {/* <InsurancePartners /> */}

        {/* Wave separator into Contacto */}
        <div className="relative z-20" style={{ marginTop: -2 }}>
          <svg viewBox="0 0 1440 60" className="w-full" preserveAspectRatio="none" style={{ display: 'block', height: 60 }}>
            <path d="M0,20 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill='var(--lavender)' />
          </svg>
        </div>

        <Contacto taller={taller} onOpenChat={handleOpenChat} />
        <Footer taller={taller} />
      </main>

      <ChatAsistente
        taller={taller}
        triggerOpenMessage={triggerOpenMessage}
        setTriggerOpenMessage={setTriggerOpenMessage}
      />
    </div>
  );
}
