'use client';

import { useState } from 'react';
import { Calendar as CalendarIcon, RefreshCw, Plus, Phone, AlertCircle, Zap } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import Badge from '../ui/Badge';

export default function TabDashboard() {
  const [vistaActiva, setVistaActiva] = useState('hoy');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* HEADER FIJO COMPACTO */}
      <div className="shrink-0 mb-3">
        <PageHeader 
          title="Resumen Operativo" 
          description="Hoy, cupos disponibles y carga del taller"
          actions={
            <>
              <Button variant="primary" icon={Plus}>Nueva cita</Button>
              <Button variant="outline" icon={CalendarIcon}>Agenda</Button>
              <Button variant="ghost" icon={RefreshCw}>Refresh</Button>
            </>
          }
        />
        <div className="flex items-center justify-between bg-surface-panel p-1 rounded-lg border border-border-subtle w-fit mt-3">
          <Button variant={vistaActiva === 'hoy' ? 'primary' : 'ghost'} size="sm" onClick={() => setVistaActiva('hoy')} className="h-7 text-xs">Hoy</Button>
          <Button variant={vistaActiva === 'manana' ? 'primary' : 'ghost'} size="sm" onClick={() => setVistaActiva('manana')} className="h-7 text-xs">Mañana</Button>
          <Button variant={vistaActiva === 'semana' ? 'primary' : 'ghost'} size="sm" onClick={() => setVistaActiva('semana')} className="h-7 text-xs">Semana</Button>
          <div className="ml-4 px-3 text-xs text-text-secondary font-medium">Fecha: 07 Jul 2026</div>
        </div>
      </div>

      {/* GRID PRINCIPAL SIN SCROLL */}
      <div className="flex flex-col gap-3 flex-1 min-h-0 overflow-hidden">
        
        {/* ROW 1: ESTADOS (4 COLUMNAS) */}
        <div className="grid grid-cols-4 gap-3 shrink-0">
          <Card className="bg-surface-panel">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold text-text-secondary mb-1 tracking-wider">CITAS HOY</span>
              <span className="text-3xl font-bold text-text-primary leading-none">8</span>
              <span className="text-[10px] text-text-muted mt-1">3 próximas</span>
            </CardContent>
          </Card>
          <Card className="bg-surface-panel">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold text-text-secondary mb-1 tracking-wider">CONFIRM.</span>
              <span className="text-3xl font-bold text-text-primary leading-none">5</span>
              <span className="text-[10px] text-text-muted mt-1">asistencia segura</span>
            </CardContent>
          </Card>
          <Card className="border-status-warning/30 bg-status-warning-soft/10">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold text-status-warning mb-1 tracking-wider">PENDIENT.</span>
              <span className="text-3xl font-bold text-status-warning leading-none">2</span>
              <span className="text-[10px] text-status-warning mt-1 flex items-center gap-1"><Phone className="w-2.5 h-2.5"/> llamar ahora</span>
            </CardContent>
          </Card>
          <Card className="border-status-danger/30 bg-status-danger-soft/10">
            <CardContent className="p-3 flex flex-col justify-between h-full">
              <span className="text-[10px] font-bold text-status-danger mb-1 tracking-wider">RIESGO</span>
              <span className="text-3xl font-bold text-status-danger leading-none">1</span>
              <span className="text-[10px] text-status-danger mt-1 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5"/> sin respuesta</span>
            </CardContent>
          </Card>
        </div>

        {/* ROW 2: DOS COLUMNAS - SECCIONES MEDIAS */}
        <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
          
          {/* COLUMNA IZQUIERDA */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* CUPOS PARA OFRECER HOY */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-2 px-3 border-b border-border-subtle bg-surface-subtle/50 shrink-0">
                <CardTitle className="text-[10px] font-bold text-text-secondary tracking-wider">CUPOS PARA OFRECER HOY</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="divide-y divide-border-subtle">
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-hover-row">
                    <div>
                      <div className="text-xs font-semibold text-text-primary">10:30 <span className="text-text-muted font-normal">· Frontdesk · 30m</span></div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Evaluación rápida</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Crear cita</Button>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-hover-row">
                    <div>
                      <div className="text-xs font-semibold text-text-primary">12:00 <span className="text-text-muted font-normal">· Bahía 2 · 60m</span></div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Diagnóstico general</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Crear cita</Button>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-hover-row">
                    <div>
                      <div className="text-xs font-semibold text-text-primary">15:30 <span className="text-text-muted font-normal">· Carlos · 90m</span></div>
                      <div className="text-[10px] text-text-secondary mt-0.5">Frenos / suspensión</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Crear cita</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CARGA MECÁNICOS / BAHÍAS */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-2 px-3 border-b border-border-subtle bg-surface-subtle/50 shrink-0">
                <CardTitle className="text-[10px] font-bold text-text-secondary tracking-wider">CARGA MECÁNICOS / BAHÍAS</CardTitle>
              </CardHeader>
              <CardContent className="p-3 grid grid-cols-2 gap-x-4 gap-y-2 flex-1 overflow-hidden">
                <div className="flex justify-between items-center text-xs"><span className="font-medium">Luis</span><span className="text-status-danger font-semibold">90% <span className="text-[10px] text-text-muted font-normal ml-1">sin huecos</span></span></div>
                <div className="flex justify-between items-center text-xs"><span className="font-medium">Bahía 1</span><span className="text-status-warning font-semibold">85% <span className="text-[10px] text-text-muted font-normal ml-1">libre 16:00</span></span></div>
                <div className="flex justify-between items-center text-xs"><span className="font-medium">Carlos</span><span className="text-status-success font-semibold">55% <span className="text-[10px] text-text-muted font-normal ml-1">2 huecos</span></span></div>
                <div className="flex justify-between items-center text-xs"><span className="font-medium">Bahía 2</span><span className="text-status-success font-semibold">40% <span className="text-[10px] text-text-muted font-normal ml-1">libre 12:00</span></span></div>
                <div className="flex justify-between items-center text-xs"><span className="font-medium">Ana</span><span className="text-status-warning font-semibold">70% <span className="text-[10px] text-text-muted font-normal ml-1">1 hueco</span></span></div>
                <div className="flex justify-between items-center text-xs"><span className="font-medium">Bahía 3</span><span className="text-status-info font-semibold">0% <span className="text-[10px] text-text-muted font-normal ml-1">disponible</span></span></div>
              </CardContent>
            </Card>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* ACCIONES URGENTES */}
            <Card className="flex-1 flex flex-col border-status-danger/30 min-h-0">
              <CardHeader className="py-2 px-3 border-b border-border-subtle bg-status-danger-soft/10 shrink-0">
                <CardTitle className="text-[10px] font-bold text-status-danger tracking-wider flex items-center gap-1.5"><Zap className="w-3 h-3"/> ACCIONES URGENTES</CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-hidden">
                <div className="divide-y divide-border-subtle">
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-hover-row">
                    <div>
                      <Badge variant="danger" estado="ALTA" className="px-1.5 py-0 text-[9px]" />
                      <div className="text-xs font-semibold text-text-primary mt-1">2 citas sin confirmar</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Revisar</Button>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-hover-row">
                    <div>
                      <Badge variant="warning" estado="MEDIA" className="px-1.5 py-0 text-[9px]" />
                      <div className="text-xs font-semibold text-text-primary mt-1">1 cotización pend.</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Ver</Button>
                  </div>
                  <div className="px-3 py-2 flex items-center justify-between hover:bg-hover-row">
                    <div>
                      <Badge variant="neutral" estado="BAJA" className="px-1.5 py-0 text-[9px]" />
                      <div className="text-xs font-semibold text-text-primary mt-1">Mensaje fallido</div>
                    </div>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Revisar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DEMANDA RECIENTE */}
            <Card className="flex-1 flex flex-col min-h-0">
              <CardHeader className="py-2 px-3 border-b border-border-subtle bg-surface-subtle/50 flex flex-row items-center justify-between shrink-0">
                <CardTitle className="text-[10px] font-bold text-text-secondary tracking-wider">DEMANDA RECIENTE</CardTitle>
                <span className="text-[9px] text-text-muted">Últimos 7 días</span>
              </CardHeader>
              <CardContent className="p-3 flex-1 overflow-hidden">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs"><span className="text-text-primary font-medium">Frenos</span><span className="font-bold text-text-secondary">12</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-text-primary font-medium">Diagnóstico gral</span><span className="font-bold text-text-secondary">9</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-text-primary font-medium">Pre-compra</span><span className="font-bold text-text-secondary">6</span></div>
                  <div className="flex items-center justify-between text-xs"><span className="text-text-primary font-medium">Mantenimiento</span><span className="font-bold text-text-secondary">5</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ROW 3: AGENDA COMPACTA */}
        <Card className="shrink-0 mb-1">
          <CardHeader className="py-2 px-3 border-b border-border-subtle bg-surface-subtle/50">
            <CardTitle className="text-[10px] font-bold text-text-secondary tracking-wider">AGENDA COMPACTA</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border-subtle">
              <div className="px-3 py-1.5 flex items-center justify-between bg-surface-panel hover:bg-hover-row">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">09:00</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-status-success"></span>
                  <span className="text-xs text-text-primary font-medium">Carlos</span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-xs text-text-secondary">ABC-123</span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-xs text-text-secondary truncate max-w-[120px]">Frenos</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge estado="confirmada" className="px-1.5 py-0 text-[9px]" />
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2">Ver</Button>
                </div>
              </div>
              <div className="px-3 py-1.5 flex items-center justify-between bg-status-warning-soft/5 hover:bg-hover-row">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">10:30</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-status-warning"></span>
                  <span className="text-xs text-text-primary font-medium">María</span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-xs text-text-secondary">XYZ-789</span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-xs text-text-secondary truncate max-w-[120px]">Diagnóstico</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge estado="pendiente" className="px-1.5 py-0 text-[9px]" />
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2">Conf.</Button>
                </div>
              </div>
              <div className="px-3 py-1.5 flex items-center justify-between bg-surface-subtle hover:bg-hover-row border-l-2 border-l-status-info">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text-primary">12:00</span>
                  <span className="text-xs text-text-secondary italic">Cupo libre</span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-xs text-text-secondary">Bahía 2</span>
                  <span className="text-text-muted text-[10px]">·</span>
                  <span className="text-xs text-text-secondary">60m</span>
                </div>
                <Button variant="primary" size="sm" className="h-6 text-[10px] px-2">Crear</Button>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
