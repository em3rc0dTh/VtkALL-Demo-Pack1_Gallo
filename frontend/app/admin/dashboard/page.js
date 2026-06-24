'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth.js';
import LoadingSpinner from '../../../components/ui/LoadingSpinner.js';
import TabEvaluaciones from '../../../components/dashboard/TabEvaluaciones.js';
import TabDashboard from '../../../components/dashboard/TabDashboard.js';
import TabEjecuciones from '../../../components/dashboard/TabEjecuciones.js';
import TabClientes from '../../../components/dashboard/TabClientes.js';
import TabTeam from '../../../components/dashboard/TabTeam.js';
import TabServicios from '../../../components/dashboard/TabServicios.js';
import TabMensajes from '../../../components/dashboard/TabMensajes.js';
import TabConfiguracion from '../../../components/dashboard/TabConfiguracion.js';
import TabCaseOperations from '../../../components/dashboard/TabCaseOperations.js';
import { Calendar, Users, MessageSquare, Briefcase, Settings, LogOut, Shield, Activity, Wrench, LayoutGrid, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../../lib/api.js';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
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
    if (taller && taller.tema_global?.color) {
      document.documentElement.style.setProperty('--primary', taller.tema_global.color);
      const hoverColors = {
        '#00aeef': '#008fcc',
        '#ef4444': '#dc2626',
        '#10b981': '#059669',
        '#f97316': '#ea580c',
        '#8b5cf6': '#7c3aed'
      };
      const hoverVal = hoverColors[taller.tema_global.color] || taller.tema_global.color;
      document.documentElement.style.setProperty('--primary-hover', hoverVal);
      document.documentElement.style.setProperty('--color-primary', taller.tema_global.color);
      
      try {
        localStorage.setItem('tema-color', taller.tema_global.color);
      } catch (e) {}
    }
  }, [taller]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: 'Resumen Operativo', icon: LayoutGrid },
    { id: 'cases', label: 'Órdenes de Taller', icon: ClipboardList },
    { id: 'evaluaciones', label: 'Admisión y Diagnóstico', icon: Calendar },
    { id: 'ejecuciones', label: 'Bahías y Ejecución', icon: Activity },
    { id: 'clientes', label: 'Cartera de Clientes', icon: Users },
    { id: 'servicios', label: 'Catálogo de Servicios', icon: Briefcase },
    { id: 'mensajes', label: 'Centro de Mensajes', icon: MessageSquare },
    { id: 'team', label: 'Personal y Equipos', icon: Shield },
    { id: 'configuracion', label: 'Ajustes Generales', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-dark-bg text-gray-200 flex font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-dark-aside border-r border-gray-800/50 flex flex-col justify-between flex-shrink-0 z-20 shadow-xl shadow-black/10">
        <div>
          {/* Brand Logo */}
          <div className="h-16 px-6 flex items-center border-b border-gray-800/50">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="p-1.5 bg-primary/10 rounded-lg text-primary border border-primary/20 shadow-inner">
                <Wrench className="w-4 h-4 animate-pulse" />
              </div>
              <span className="text-base font-semibold tracking-tight text-white">
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
                    Mecánica<span className="text-primary">Pro</span>
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
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all text-left cursor-pointer ${
                    active 
                      ? 'bg-primary text-white shadow-md shadow-primary/20' 
                      : 'text-gray-400 hover:bg-gray-800/40 hover:text-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-500 group-hover:text-gray-300'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card Profile y Logout */}
        <div className="p-4 border-t border-gray-800/50 space-y-3 bg-dark-aside">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-800/30 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700/50 flex items-center justify-center text-primary shadow-inner">
              <Shield className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-white truncate">{user.nombre}</span>
              <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-medium">{user.rol}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[12px] font-medium text-gray-400 hover:text-red-400 bg-transparent hover:bg-red-500/10 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> CERRAR SESIÓN
          </button>
        </div>
      </aside>

      {/* VIEWPORT CONTENIDO */}
      <main className="flex-1 flex flex-col min-w-0 bg-dark-bg relative overflow-hidden">
        {/* Glow ambient removed for cleaner look */}
        
        {/* Header Superior del Viewport */}
        <header className="h-16 border-b border-gray-800/50 flex items-center justify-between px-6 lg:px-8 bg-dark-bg/80 relative z-20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">
              {navItems.find(item => item.id === activeTab)?.label}
            </h2>
            <div className="h-4 w-px bg-gray-700/50"></div>
            <span className="console-badge-green">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              OPERATIVO
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-[10px] text-gray-400 font-medium tracking-widest bg-gray-900/50 px-3 py-1.5 rounded-md border border-gray-800/50">
              VERTIKALL OS | v1.0.0
            </div>
          </div>
        </header>

        {/* Contenedor dinámico */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto relative z-10">
          {activeTab === 'dashboard' && <TabDashboard />}
          {activeTab === 'cases' && <TabCaseOperations />}
          {activeTab === 'evaluaciones' && <TabEvaluaciones />}
          {activeTab === 'ejecuciones' && <TabEjecuciones />}
          {activeTab === 'clientes' && <TabClientes />}
          {activeTab === 'team' && <TabTeam />}
          {activeTab === 'mensajes' && <TabMensajes />}
          {activeTab === 'servicios' && <TabServicios />}
          {activeTab === 'configuracion' && <TabConfiguracion user={user} onSaveSuccess={(newData) => setTaller(newData)} />}
        </div>
      </main>

    </div>
  );
}
