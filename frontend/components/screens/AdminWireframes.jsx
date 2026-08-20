'use client';

import { useState } from 'react';
import { Wrench, LayoutDashboard, ClipboardList, CheckSquare, Users, Package, MessageSquare, Briefcase, Settings, Edit3, Menu, X } from 'lucide-react';
const navItems = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['orders', 'Ordenes', ClipboardList],
  ['admission', 'Admision', CheckSquare],
  ['execution', 'Bahias', Wrench],
  ['clients', 'Clientes', Users],
  ['services', 'Servicios', Package],
  ['messages', 'Mensajes', MessageSquare],
  ['team', 'Equipo', Briefcase],
  ['builder', 'Landing', Edit3],
  ['settings', 'Ajustes', Settings],
];

import { DashboardScreen } from './DashboardScreen';
import { OrdersScreen } from './OrdersScreen';
import { AdmissionScreen } from './AdmissionScreen';
import { ExecutionScreen } from './ExecutionScreen';
import { ClientsScreen } from './ClientsScreen';
import { ServicesScreen } from './ServicesScreen';
import { MessagesScreen } from './MessagesScreen';
import { TeamScreen } from './TeamScreen';
import { LandingBuilderScreen } from './LandingBuilderScreen';
import { SettingsScreen } from './SettingsScreen';
import { useBusinessProfile } from '@/contexts/BusinessProfileContext';

export function AdminWireframes({ initialScreen = 'dashboard' }) {
  const { profile } = useBusinessProfile();
  const [active, setActive] = useState(initialScreen);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const screenMeta = {
    dashboard: [profile.labels.dashboard || 'Resumen Operativo', 'Hoy, cupos disponibles y carga del taller', <DashboardScreen key="dashboard" />],
    orders: [profile.labels.workOrders || 'Ordenes de Taller', 'Decision y control de una orden completa', <OrdersScreen key="orders" />],
    admission: [profile.labels.admission || 'Admision y Diagnostico', 'Recepcion tecnica sin mezclar cotizacion', <AdmissionScreen key="admission" />],
    execution: [profile.labels.execution || 'Bahias y Ejecucion', 'Trabajo, bloqueos, tiempo en estado y entrega', <ExecutionScreen key="execution" />],
    clients: ['Cartera de Clientes', 'Atencion, historial y acciones rapidas', <ClientsScreen key="clients" />],
    services: [profile.labels.catalog || 'Catalogo de Servicios', 'Oferta comercial-operativa y riesgos publicos', <ServicesScreen key="services" />],
    messages: ['Centro de Mensajes', 'Bandeja de atencion y fallos operativos', <MessagesScreen key="messages" />],
    team: ['Personal y Equipos', 'Capacidad humana y operativa del taller', <TeamScreen key="team" />],
    builder: ['Landing Builder', 'Draft, publicacion y versiones de la Landing Gallo Autos', <LandingBuilderScreen key="builder" />],
    settings: ['Ajustes Generales', 'BusinessProfile activo y reglas de integracion', <SettingsScreen key="settings" />],
  };

  const [title, description, content] = screenMeta[active] || screenMeta.dashboard;
  const selectTab = (id) => {
    setActive(id);
    setMobileNavOpen(false);
  };

  return (
    <div className="fixed inset-0 flex overflow-hidden bg-surface-app text-text-primary">
      <AdminSidebar profile={profile} active={active} onSelect={selectTab} />
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Cerrar navegacion"
            className="absolute inset-0 bg-black/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative h-full">
            <AdminSidebar profile={profile} active={active} onSelect={selectTab} mobile onClose={() => setMobileNavOpen(false)} />
          </div>
        </div>
      )}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-inverse bg-surface-header-dark px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir navegacion"
              onClick={() => setMobileNavOpen(true)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-disabled hover:bg-surface-sidebar hover:text-text-inverse md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-text-inverse">{title}</h1>
              <p className="hidden text-[13px] text-text-disabled sm:block">{description}</p>
            </div>
          </div>
        </header>
        <section className={`min-h-0 flex-1 overflow-hidden ${active === 'builder' ? 'p-0' : 'p-3 sm:p-4 lg:p-6'}`}>
          <div className="h-full min-h-0">{content}</div>
        </section>
      </main>
    </div>
  );
}

function AdminSidebar({ profile, active, onSelect, mobile = false, onClose }) {
  return (
    <aside className={`${mobile ? 'flex h-full w-[min(86vw,280px)]' : 'hidden w-64 md:flex'} shrink-0 flex-col justify-between border-r border-border-inverse bg-surface-sidebar`}>
      <div>
        <div className="flex h-14 items-center justify-between gap-2 border-b border-border-inverse px-5 text-text-inverse">
          <div className="flex min-w-0 items-center gap-2">
            <Wrench className="h-4 w-4 shrink-0 text-action-primary" />
            <span className="truncate text-sm font-black uppercase tracking-widest">{profile.branding.name}</span>
          </div>
          {mobile && (
            <button
              type="button"
              aria-label="Cerrar navegacion"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-disabled hover:bg-surface-header-dark hover:text-text-inverse"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => onSelect(id)}
              className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                active === id ? 'bg-action-primary text-on-action-primary' : 'text-text-disabled hover:bg-surface-header-dark hover:text-text-inverse'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="border-t border-border-inverse p-3">
        <div className="rounded-lg bg-surface-header-dark p-3 text-sm text-text-inverse">
          <div className="font-bold">Admin Web</div>
          <div className="text-[13px] text-text-muted">rol: owner</div>
        </div>
      </div>
    </aside>
  );
}
