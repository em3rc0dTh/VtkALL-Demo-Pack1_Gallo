'use client';

import { useState, useEffect } from 'react';
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
import { api } from '../lib/api.js';

export default function Home() {
  const [taller, setTaller] = useState({});
  const [servicios, setServicios] = useState([]);
  const [triggerOpenMessage, setTriggerOpenMessage] = useState('');

  useEffect(() => {
    async function cargarDatos() {
      try {
        const config = await api.getConfiguracion();
        if (config) setTaller(config);
      } catch (error) {
        console.warn('No se pudo cargar la configuración del taller (usando datos por defecto)');
      }

      try {
        const serv = await api.getServicios();
        if (serv) setServicios(serv);
      } catch (error) {
        console.warn('No se pudieron cargar los servicios de la API (usando datos por defecto)');
      }
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (taller && taller.nombre_taller) {
      document.title = `${taller.nombre_taller} - ${taller.slogan || 'Tu vehículo en las mejores manos'}`;
    }
  }, [taller]);

  const handleOpenChat = (mensajePrefijado) => {
    setTriggerOpenMessage(mensajePrefijado);
  };

  return (
    <div className="relative min-h-screen bg-[#0b0f19] text-white">
      <Navbar taller={taller} />
      <Hero taller={taller} onOpenChat={() => handleOpenChat(`Hola ${taller.config_agente?.nombre_agente || 'Max'}, quiero agendar una cita`)} />
      <StatsBar taller={taller} />
      <Servicios servicios={servicios} onOpenChat={handleOpenChat} />
      <SobreNosotros taller={taller} />
      <ComoFunciona taller={taller} />
      <Galeria taller={taller} />
      <Contacto taller={taller} onOpenChat={handleOpenChat} />
      <Footer taller={taller} />
      <ChatAsistente 
        taller={taller}
        triggerOpenMessage={triggerOpenMessage} 
        setTriggerOpenMessage={setTriggerOpenMessage} 
      />
    </div>
  );
}
