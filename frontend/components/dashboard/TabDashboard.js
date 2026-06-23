'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Activity, Clock, DollarSign, ArrowUpRight, ArrowRight } from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
import { Button } from '../ui/Button';
import EstadoBadge from '../ui/EstadoBadge';
import { TableWrapper, TableHeader, TableRow, TableCell } from '../ui/Table';
import LoadingSpinner from '../ui/LoadingSpinner';
import { EmptyState } from '../ui/EmptyState';
import { api } from '../../lib/api';

export default function TabDashboard() {
  const [loading, setLoading] = useState(true);
  const [citas, setCitas] = useState([]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.getCitas();
        if (res && res.citas) {
          setCitas(res.citas);
        }
      } catch (error) {
        console.error("Error cargando datos del dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="h-full flex items-center justify-center"><LoadingSpinner text="Cargando resumen operativo..." /></div>;
  }

  // Cálculos visuales simples
  const hoyStr = new Date().toISOString().split('T')[0];
  const citasHoy = citas.filter(c => c.fecha_cita?.startsWith(hoyStr));
  const trabajosActivos = citas.filter(c => ['en_proceso', 'evaluacion_en_curso', 'validada', 'en_progreso', 'en_curso'].includes(c.estado));
  const pendientes = citas.filter(c => ['pendiente', 'reserva', 'pendiente_confirmacion'].includes(c.estado));
  
  const ingresosEstimados = citasHoy.reduce((acc, curr) => acc + (Number(curr.precio_final) || 0), 0);

  // Distribución de estados
  const estadoCounts = citas.reduce((acc, curr) => {
    const st = curr.estado || 'desconocido';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  const totalCitas = citas.length || 1; // Para porcentajes

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Dashboard" 
        description="Resumen operativo del negocio en tiempo real"
        actions={
          <Button variant="primary" icon={CalendarIcon} disabled>
            Nueva cita
          </Button>
        }
      />

      {/* Métricas superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Citas hoy</CardTitle>
            <CalendarIcon className="w-4 h-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{citasHoy.length}</div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +1 vs ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Trabajos activos</CardTitle>
            <Activity className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{trabajosActivos.length}</div>
            <p className="text-xs text-gray-500 mt-1">En taller actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Pendientes</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{pendientes.length}</div>
            <p className="text-xs text-yellow-500/70 mt-1">Requieren confirmación</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Ingresos estim.</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              S/ {ingresosEstimados > 0 ? ingresosEstimados.toLocaleString('es-PE') : '---'}
            </div>
            <p className="text-xs text-gray-500 mt-1">Proyectado para hoy</p>
          </CardContent>
        </Card>
      </div>

      {/* Bloque medio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agenda de hoy */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Agenda de hoy</CardTitle>
            <CardDescription>Citas programadas para la fecha actual</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            {citasHoy.length > 0 ? (
              <div className="space-y-4">
                {citasHoy.slice(0, 5).map((cita, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-gray-900/30 border border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-dark-aside flex items-center justify-center text-xs font-bold text-primary border border-gray-700">
                        {new Date(cita.fecha_cita).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{cita.nombre_cliente || cita.cliente?.nombre || 'Cliente'}</p>
                        <p className="text-xs text-gray-500">{cita.tipo_cita || 'Servicio'}</p>
                      </div>
                    </div>
                    <EstadoBadge estado={cita.estado} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Agenda libre" description="No hay citas programadas para el día de hoy." icon={CalendarIcon} />
            )}
          </CardContent>
        </Card>

        {/* Estado operativo */}
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Estado operativo</CardTitle>
            <CardDescription>Distribución del volumen de trabajo</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {citas.length > 0 ? (
              <div className="space-y-5">
                {[
                  { key: 'pendiente', label: 'Pendientes', color: 'bg-yellow-500' },
                  { key: 'en_proceso', label: 'En proceso', color: 'bg-blue-500' },
                  { key: 'listo', label: 'Listos para entrega', color: 'bg-emerald-500' },
                  { key: 'completada', label: 'Completados/Entregados', color: 'bg-gray-500' }
                ].map((st, idx) => {
                  const count = estadoCounts[st.key] || 0;
                  // Si no hay 'listo' exacto, sumamos variantes
                  let finalCount = count;
                  if (st.key === 'en_proceso') finalCount += (estadoCounts['evaluacion_en_curso'] || 0) + (estadoCounts['en_progreso'] || 0);
                  if (st.key === 'completada') finalCount += (estadoCounts['entregado'] || 0) + (estadoCounts['ok'] || 0);

                  const percent = Math.min(100, Math.round((finalCount / totalCitas) * 100));

                  return (
                    <div key={idx}>
                      <div className="flex justify-between items-center mb-1.5 text-xs">
                        <span className="text-gray-300 font-medium">{st.label}</span>
                        <span className="text-gray-500 font-mono">{finalCount} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden border border-gray-700/50">
                        <div className={`h-2 rounded-full ${st.color} shadow-[0_0_10px_currentColor] transition-all duration-1000`} style={{ width: `${percent}%`, opacity: finalCount > 0 ? 1 : 0.2 }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="Sin datos" description="Aún no hay suficiente historial para mostrar la distribución." icon={Activity} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actividad reciente */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
          <CardDescription>Últimos movimientos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {citas.length > 0 ? (
            <TableWrapper className="border-x-0 border-b-0 rounded-none bg-transparent border-t border-gray-700/50">
              <TableHeader>
                <TableCell isHeader>Cliente</TableCell>
                <TableCell isHeader>Servicio / Vehículo</TableCell>
                <TableCell isHeader>Estado Actual</TableCell>
                <TableCell isHeader className="text-right">Fecha</TableCell>
              </TableHeader>
              <tbody>
                {citas.slice(0, 5).map((cita, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="font-medium text-white">{cita.nombre_cliente || cita.cliente?.nombre || 'Desconocido'}</div>
                      <div className="text-xs text-gray-500">{cita.numero_telefono || cita.cliente?.telefono || '--'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-gray-300">{cita.tipo_cita || 'Servicio General'}</div>
                      {cita.vehiculo?.patente && (
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{cita.vehiculo.patente}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={cita.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-gray-300">
                        {new Date(cita.fecha_cita).toLocaleDateString('es-PE', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(cita.fecha_cita).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </tbody>
            </TableWrapper>
          ) : (
            <div className="p-6">
               <EmptyState title="Sin actividad" description="No se registran eventos recientes en el sistema." />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
