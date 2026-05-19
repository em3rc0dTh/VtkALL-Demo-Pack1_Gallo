'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth.js';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.js';
import TabCitas from '../../../components/dashboard/TabCitas.js';
import TabClientes from '../../../components/dashboard/TabClientes.js';
import TabMensajes from '../../../components/dashboard/TabMensajes.js';
import TabServicios from '../../../components/dashboard/TabServicios.js';
import TabConfiguracion from '../../../components/dashboard/TabConfiguracion.js';
import { Wrench, Calendar, Users, MessageSquare, Briefcase, Settings, LogOut, Shield } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api.js';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('citas');
  const { user, loading, logout } = useAuth();
  const [taller, setTaller] = useState({});
  const router = useRouter();

  useEffect(() => {
    // Redirigir si ya terminó de cargar y no hay usuario
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading]);

  useEffect(() => {
    const fetchTaller = async () => {
      try {
        const data = await api.getConfiguracion();
        if (data) setTaller(data);
      } catch (err) {
        console.error('Error al cargar config del taller:', err);
      }
    };
    if (user) {
      fetchTaller();
    }
  }, [user]);

  useEffect(() => {
    if (taller && taller.nombre_taller) {
      document.title = `${taller.nombre_taller} - Panel de Control`;
    }
  }, [taller]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const navItems = [
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'clientes', label: 'Clientes y Fichas', icon: Users },
    { id: 'mensajes', label: 'Chats WhatsApp', icon: MessageSquare },
    { id: 'servicios', label: 'Servicios Taller', icon: Briefcase },
    { id: 'configuracion', label: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070b13] text-white flex font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0b0f19] border-r border-gray-850 flex flex-col justify-between flex-shrink-0">
        <div>
          {/* Brand Logo */}
          <div className="p-6 border-b border-gray-850">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 bg-orange-600/10 rounded-lg text-orange-500 border border-orange-500/20">
                <Wrench className="w-5 h-5 animate-pulse" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
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
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-xs font-semibold tracking-wide transition-all text-left cursor-pointer ${
                    active 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/10' 
                      : 'text-gray-450 hover:bg-gray-900/40 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card Profile y Logout */}
        <div className="p-4 border-t border-gray-850 space-y-3 bg-[#0d1222]/30">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-orange-500">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-bold text-white truncate">{user.nombre}</span>
              <span className="block text-[9px] text-gray-500 uppercase tracking-widest font-semibold">{user.rol}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:text-white bg-red-500/5 hover:bg-red-650 transition-all border border-red-500/10 hover:border-red-650 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENIDO */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#070b13] relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Header Superior del Viewport */}
        <header className="h-20 border-b border-gray-850 flex items-center justify-between px-8 bg-[#0b0f19]/30 relative z-10">
          <div>
            <h2 className="text-md font-bold text-white uppercase tracking-wider">
              {navItems.find(item => item.id === activeTab)?.label}
            </h2>
          </div>
          <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
            Consola Taller | v1.0.0
          </div>
        </header>

        {/* Contenedor dinámico */}
        <div className="flex-1 p-8 overflow-y-auto relative z-10">
          {activeTab === 'citas' && <TabCitas />}
          {activeTab === 'clientes' && <TabClientes />}
          {activeTab === 'mensajes' && <TabMensajes />}
          {activeTab === 'servicios' && <TabServicios />}
          {activeTab === 'configuracion' && <TabConfiguracion user={user} onSaveSuccess={(newData) => setTaller(newData)} />}
        </div>
      </main>

    </div>
  );
}
