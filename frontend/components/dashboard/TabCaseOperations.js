'use client';

import { useState } from 'react';
import { 
  Plus, CalendarIcon, RefreshCw, Search, Filter, 
  ChevronLeft, ChevronRight, CheckCircle2, Clock, 
  AlertTriangle, FileText, Wrench, ShieldAlert 
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import Badge from '../ui/Badge';
import { Input, Select } from '../ui/Input';

const mockOrders = [
  {
    id: 'TUR-2026-0001',
    cliente: 'Carlos Ramírez',
    vehiculo: 'Toyota Yaris',
    placa: 'ABC-123',
    servicio: 'Frenos / ruido al frenar',
    estado: 'Espera decisión',
    montoCotizado: 850,
    montoAprobado: 0,
    tecnico: 'sin asignar',
    alerta: 'Falta aprobación',
    variant: 'warning'
  },
  {
    id: 'TUR-2026-0002',
    cliente: 'María Torres',
    vehiculo: 'Honda Civic',
    placa: 'XYZ-789',
    servicio: 'Diagnóstico general',
    estado: 'En diagnóstico',
    montoCotizado: 0,
    montoAprobado: 0,
    tecnico: 'Luis',
    alerta: 'Vence: hoy',
    variant: 'info'
  },
  {
    id: 'TUR-2026-0003',
    cliente: 'Jorge Pérez',
    vehiculo: 'Nissan Sentra',
    placa: 'DEF-456',
    servicio: 'Mantenimiento 60k',
    estado: 'En ejecución',
    montoCotizado: 1200,
    montoAprobado: 1200,
    tecnico: 'Carlos',
    alerta: 'Sin bloqueos',
    variant: 'success'
  },
  {
    id: 'TUR-2026-0004',
    cliente: 'Ana Gómez',
    vehiculo: 'Kia Rio',
    placa: 'GHI-789',
    servicio: 'Suspensión',
    estado: 'Bloqueado',
    montoCotizado: 1500,
    montoAprobado: 1500,
    tecnico: 'Ana',
    alerta: 'Falta repuesto',
    variant: 'danger'
  }
];

export default function TabCaseOperations() {
  const [selectedOrder, setSelectedOrder] = useState(mockOrders[0]);
  const [activeTab, setActiveTab] = useState('resumen');

  return (
    <div className="flex flex-col h-full max-h-full overflow-hidden">
      {/* HEADER FIJO */}
      <div className="shrink-0 mb-4">
        <PageHeader 
          title="Órdenes de Taller" 
          description="Control de orden, autorización, ejecución y cierre"
          actions={
            <>
              <Button variant="primary" icon={Plus}>Crear orden</Button>
              <Button variant="outline" icon={CalendarIcon}>Agenda</Button>
              <Button variant="ghost" icon={RefreshCw}>Refresh</Button>
            </>
          }
        />

        {/* FILTROS COMPACTOS */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-panel p-3 rounded-lg border border-border-subtle mt-4">
          <Select className="w-40 py-1.5 text-xs">
            <option>Estado: Todos</option>
            <option>Espera decisión</option>
            <option>En diagnóstico</option>
          </Select>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input className="w-60 pl-9 py-1.5 text-xs" placeholder="Buscar cliente / placa / orden" />
          </div>
          <Select className="w-36 py-1.5 text-xs">
            <option>Fecha: Hoy</option>
            <option>Esta semana</option>
          </Select>
          <Select className="w-40 py-1.5 text-xs">
            <option>Etapa: Todas</option>
            <option>Cotización</option>
          </Select>
          <Select className="w-40 py-1.5 text-xs">
            <option>Resp: Todos</option>
            <option>Luis</option>
            <option>Carlos</option>
          </Select>
          <Button variant="secondary" size="sm">Filtrar</Button>
          <Button variant="ghost" size="sm">Limpiar</Button>
        </div>
      </div>

      {/* SPLIT VIEW - BODY */}
      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden pb-4">
        
        {/* PANEL IZQUIERDO: LISTA DE ÓRDENES (30%) */}
        <div className="w-1/3 flex flex-col border border-border-subtle bg-surface-subtle rounded-xl overflow-hidden shrink-0">
          <div className="p-3 bg-surface-panel border-b border-border-subtle font-semibold text-sm text-text-secondary tracking-wider">
            LISTA DE ÓRDENES
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {mockOrders.map((order) => (
              <div 
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-surface-panel p-3 rounded-lg border cursor-pointer transition-all hover:border-focus-ring/50 ${selectedOrder.id === order.id ? 'border-focus-ring ring-1 ring-focus-ring shadow-sm' : 'border-border-default'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-sm text-text-primary">{order.cliente}</span>
                  <span className="text-xs font-mono text-text-muted">{order.id}</span>
                </div>
                <div className="text-xs text-text-secondary mb-2">{order.placa} · {order.vehiculo}</div>
                <div className="text-xs text-text-primary font-medium mb-3 truncate">{order.servicio}</div>
                <div className="flex flex-col gap-1.5 mt-2 pt-2 border-t border-border-subtle">
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-text-muted">Estado:</span>
                    <span className="text-xs font-semibold text-text-primary">{order.estado}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-text-muted">Cotizado:</span>
                    <span className="text-xs font-medium text-text-primary">S/ {order.montoCotizado}</span>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <Badge variant={order.variant} estado={order.alerta} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border-subtle bg-surface-panel flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Página 1 de 1</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="px-2"><ChevronLeft className="w-4 h-4"/></Button>
              <Button variant="outline" size="sm" className="px-2"><ChevronRight className="w-4 h-4"/></Button>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: CONSOLA DE ÓRDEN (70%) */}
        <div className="w-2/3 flex flex-col bg-surface-panel border border-border-subtle rounded-xl overflow-hidden shrink-0">
          
          {/* HEADER DE ORDEN */}
          <div className="p-4 border-b border-border-subtle bg-surface-panel flex justify-between items-start shrink-0">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-lg font-bold text-text-primary">{selectedOrder.id}</h2>
                <Badge variant={selectedOrder.variant} estado={selectedOrder.estado} />
              </div>
              <div className="text-sm text-text-secondary mb-1">{selectedOrder.vehiculo} <span className="font-mono bg-surface-subtle px-1 rounded">{selectedOrder.placa}</span></div>
              <div className="text-sm text-text-secondary">Cliente: <span className="font-semibold text-text-primary">{selectedOrder.cliente}</span></div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className="text-xs text-text-muted mb-1.5 uppercase font-semibold tracking-wider">Próxima acción</span>
              <span className="text-sm font-bold text-text-primary mb-3">Registrar aprobación</span>
              <div className="flex gap-2">
                <Button variant="primary" size="sm">Registrar decisión</Button>
                <Button variant="outline" size="sm">Copiar cotización</Button>
                <Button variant="ghost" size="sm">Más acciones</Button>
              </div>
            </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* COLUMNA RESUMEN DECISIÓN (Izquierda del panel derecho) */}
            <div className="w-1/3 border-r border-border-subtle bg-surface-subtle/30 p-4 shrink-0 overflow-y-auto">
              <h3 className="text-xs font-bold text-text-secondary tracking-wider mb-4">RESUMEN DE DECISIÓN</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="text-sm text-text-muted">Cotizado:</span>
                  <span className="text-sm font-semibold text-text-primary">S/ {selectedOrder.montoCotizado}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="text-sm text-text-muted">Aprobado:</span>
                  <span className="text-sm font-semibold text-text-primary">S/ {selectedOrder.montoAprobado}</span>
                </div>
                <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                  <span className="text-sm text-text-muted">Pendiente:</span>
                  <span className="text-sm font-bold text-status-warning">S/ {selectedOrder.montoCotizado - selectedOrder.montoAprobado}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border-subtle pb-2 mt-2">
                  <span className="text-xs text-text-muted">Validez:</span>
                  <span className="text-sm font-medium text-text-primary flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-status-warning"/> vence mañana</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border-subtle pb-2">
                  <span className="text-xs text-text-muted">Técnico:</span>
                  <span className="text-sm font-medium text-text-primary">{selectedOrder.tecnico}</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border-subtle pb-2">
                  <span className="text-xs text-text-muted">Bahía:</span>
                  <span className="text-sm font-medium text-text-secondary">sin asignar</span>
                </div>
                <div className="flex flex-col gap-1 border-b border-border-subtle pb-2">
                  <span className="text-xs text-text-muted">Bloqueos:</span>
                  <span className="text-sm font-medium text-status-success flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5"/> ninguno</span>
                </div>
                <div className="flex flex-col gap-1 pb-2">
                  <span className="text-xs text-text-muted">Evidencia OK:</span>
                  <span className="text-sm font-medium text-status-danger flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5"/> faltante</span>
                </div>
              </div>
            </div>

            {/* ZONA TABS (Derecha del panel derecho) */}
            <div className="w-2/3 flex flex-col shrink-0">
              <div className="flex border-b border-border-subtle bg-surface-subtle/50 px-2 shrink-0">
                <button onClick={() => setActiveTab('resumen')} className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors ${activeTab === 'resumen' ? 'border-focus-ring text-focus-ring' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Resumen</button>
                <button onClick={() => setActiveTab('cotizacion')} className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-colors ${activeTab === 'cotizacion' ? 'border-focus-ring text-focus-ring' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>Cotización</button>
                <button className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-transparent text-text-disabled cursor-not-allowed">Admisión</button>
                <button className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-transparent text-text-disabled cursor-not-allowed">Diagnóstico</button>
                <button className="px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-transparent text-text-disabled cursor-not-allowed">Ejecución</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-5">
                {activeTab === 'resumen' && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-text-secondary tracking-wider border-b border-border-subtle pb-2">TAB ACTIVO: RESUMEN</h3>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <div className="text-xs text-text-muted mb-1">Cliente</div>
                        <div className="text-sm font-medium text-text-primary">{selectedOrder.cliente}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-1">Teléfono</div>
                        <div className="text-sm font-medium text-text-primary">+51 999 888 777</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-1">Vehículo</div>
                        <div className="text-sm font-medium text-text-primary">{selectedOrder.vehiculo}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-1">Placa</div>
                        <div className="text-sm font-mono text-text-primary">{selectedOrder.placa}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-text-muted mb-1">Problema reportado</div>
                        <div className="text-sm font-medium text-text-primary p-3 bg-surface-subtle rounded border border-border-subtle">{selectedOrder.servicio}</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-1">Fecha ingreso</div>
                        <div className="text-sm font-medium text-text-primary">07 Jul 09:00</div>
                      </div>
                      <div>
                        <div className="text-xs text-text-muted mb-1">Responsable</div>
                        <div className="text-sm font-medium text-text-primary">{selectedOrder.tecnico}</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-border-subtle flex gap-2">
                      <Button variant="secondary" size="sm">Editar datos</Button>
                      <Button variant="outline" size="sm">Ver cliente</Button>
                    </div>
                  </div>
                )}
                {activeTab === 'cotizacion' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-border-subtle pb-2">
                      <h3 className="text-sm font-bold text-text-secondary tracking-wider">TAB ACTIVO: COTIZACIÓN</h3>
                      <span className="text-xs text-text-muted">Estado: <span className="font-semibold text-text-primary">Preparada · Versión v2</span></span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 hover:bg-hover-row rounded">
                        <div className="text-sm text-text-primary"><span className="font-medium">Mano de obra</span> <span className="text-text-muted ml-2 text-xs">[2 líneas]</span></div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold">S/ 300</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">Ver/Editar</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 hover:bg-hover-row rounded">
                        <div className="text-sm text-text-primary"><span className="font-medium">Repuestos</span> <span className="text-text-muted ml-2 text-xs">[3 líneas]</span></div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold">S/ 420</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">Ver/Editar</Button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 hover:bg-hover-row rounded">
                        <div className="text-sm text-text-primary"><span className="font-medium">Terceros</span> <span className="text-text-muted ml-2 text-xs">[1 línea]</span></div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold">S/ 130</span>
                          <Button variant="ghost" size="sm" className="h-6 text-xs px-2">Ver/Editar</Button>
                        </div>
                      </div>
                    </div>
                    <div className="pt-4 border-t-2 border-border-subtle space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Total cotizado</span>
                        <span className="font-bold">S/ 850</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Total aprobado</span>
                        <span className="font-bold text-status-success">S/ 0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-text-muted">Pendiente aprob.</span>
                        <span className="font-bold text-status-warning">S/ 850</span>
                      </div>
                    </div>
                    <div className="pt-4 flex gap-2">
                      <Button variant="primary" size="sm">Nueva versión</Button>
                      <Button variant="secondary" size="sm">Enviar / Marcar enviada</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
