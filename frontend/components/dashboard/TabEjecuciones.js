'use client';

import { useState } from 'react';
import { LayoutGrid, Wrench, Clock, PlayCircle, CheckCircle, CarFront, Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

export default function TabEjecuciones() {
  const [vista, setVista] = useState('calendario'); // 'pizarra' o 'calendario'
  const [diaSeleccionado, setDiaSeleccionado] = useState('Lun');
  
  const diasSemana = [
    { id: 'Lun', num: '12', label: 'Lunes' },
    { id: 'Mar', num: '13', label: 'Martes' },
    { id: 'Mié', num: '14', label: 'Miércoles' },
    { id: 'Jue', num: '15', label: 'Jueves' },
    { id: 'Vie', num: '16', label: 'Viernes' },
    { id: 'Sáb', num: '17', label: 'Sábado' },
  ];

  const [ejecuciones, setEjecuciones] = useState([
    { id: 101, dia: 'Lun', cliente: 'Ana Santos', servicio: 'Cambio de Frenos', equipo: 'Mecánica General', tiempoEst: '2 hrs', precioFinal: 'S/. 250', estado: 'en_curso', inicio: '10:00', horaNum: 10, duracionNum: 2 },
    { id: 102, dia: 'Lun', cliente: 'Luis Flores', servicio: 'Alineación', equipo: 'Mecánica General', tiempoEst: '1 hr', precioFinal: 'S/. 120', estado: 'pendiente', inicio: '13:00', horaNum: 13, duracionNum: 1 },
    { id: 103, dia: 'Mar', cliente: 'Carlos Ruiz', servicio: 'Planchado Puerta', equipo: 'Planchado y Pintura', tiempoEst: '8 hrs', precioFinal: 'S/. 850', estado: 'pendiente', inicio: '09:00', horaNum: 9, duracionNum: 8 },
    { id: 104, dia: 'Lun', cliente: 'Roberto Silva', servicio: 'Cambio Aceite', equipo: 'Atención Rápida', tiempoEst: '1 hr', precioFinal: 'S/. 80', estado: 'pendiente', inicio: '08:00', horaNum: 8, duracionNum: 1 },
    { id: 105, dia: 'Mié', cliente: 'Julia Gomez', servicio: 'Revisión Motor', equipo: 'Mecánica General', tiempoEst: '4 hrs', precioFinal: 'S/. 400', estado: 'pendiente', inicio: '11:00', horaNum: 11, duracionNum: 4 },
  ]);

  const equipos = ['Mecánica General', 'Planchado y Pintura', 'Atención Rápida'];
  const horasDia = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const iniciarTrabajo = (id) => {
    setEjecuciones(ejecuciones.map(e => e.id === id ? { ...e, estado: 'en_curso' } : e));
  };

  const finalizarTrabajo = (id) => {
    setEjecuciones(ejecuciones.map(e => e.id === id ? { ...e, estado: 'finalizado' } : e));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <LayoutGrid className="w-4 h-4 text-primary" /> Ejecuciones por Equipo
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Supervisa las operaciones en curso y la ocupación semanal de cada Team.</p>
        </div>
        
        {/* Toggle Vistas */}
        <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setVista('pizarra')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === 'pizarra' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white cursor-pointer'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Pizarra
          </button>
          <button
            onClick={() => setVista('calendario')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === 'calendario' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white cursor-pointer'
            }`}
          >
            <CalendarIcon className="w-4 h-4" /> Horarios
          </button>
        </div>
      </div>

      {vista === 'pizarra' ? (
        <div className="grid grid-cols-1 gap-6">
          {/* Day Selector for Pizarra (Optional but good for filtering) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs font-bold text-gray-500 mr-2">Filtrar Pizarra:</span>
            <button onClick={() => setDiaSeleccionado('Todo')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${diaSeleccionado === 'Todo' ? 'bg-primary text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}>Todos</button>
            {diasSemana.map(d => (
              <button 
                key={d.id}
                onClick={() => setDiaSeleccionado(d.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${diaSeleccionado === d.id ? 'bg-primary text-white' : 'bg-gray-900 text-gray-400 hover:bg-gray-800'}`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {equipos.map((equipoName) => {
            const tareasEquipo = ejecuciones.filter(e => e.equipo === equipoName && e.estado !== 'finalizado' && (diaSeleccionado === 'Todo' || e.dia === diaSeleccionado));
            
            return (
              <div key={equipoName} className="border border-gray-850 rounded-2xl bg-gray-950/20 overflow-hidden">
                <div className="bg-gray-900 border-b border-gray-850 p-4 flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" /> Team: {equipoName}
                  </h4>
                  <span className="text-[10px] font-bold px-2 py-1 bg-gray-800 rounded text-gray-400">
                    Horario Base: 08:00 - 18:00
                  </span>
                </div>
                
                <div className="p-4 flex gap-4 overflow-x-auto custom-scrollbar">
                  {tareasEquipo.map(e => (
                    <div key={e.id} className="min-w-[280px] p-4 rounded-xl bg-gray-950 border border-gray-800 relative group transition-all hover:border-gray-600">
                      {e.estado === 'en_curso' && <div className="absolute top-0 left-0 w-full h-1 bg-primary animate-pulse rounded-t-xl"></div>}
                      {e.estado === 'pendiente' && <div className="absolute top-0 left-0 w-full h-1 bg-gray-600 rounded-t-xl"></div>}
                      
                      <div className="flex justify-between items-start mb-2 pt-1">
                        <div>
                          <span className="block font-bold text-white text-sm">{e.servicio}</span>
                          <span className="block text-[10px] text-gray-500 mt-0.5 flex items-center gap-1"><CarFront className="w-3 h-3" /> {e.cliente}</span>
                        </div>
                        <span className="text-[9px] font-bold text-gray-400 bg-gray-900 px-2 py-1 rounded">{e.dia}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4 text-[10px]">
                        <div className="bg-gray-900 p-2 rounded border border-gray-850">
                          <span className="block text-gray-500 mb-0.5">INICIO</span>
                          <span className="font-bold text-gray-300">{e.inicio}</span>
                        </div>
                        <div className="bg-gray-900 p-2 rounded border border-gray-850">
                          <span className="block text-gray-500 mb-0.5">DURACIÓN</span>
                          <span className="font-bold text-blue-400 flex items-center gap-1"><Clock className="w-3 h-3" /> {e.tiempoEst}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between pt-3 border-t border-gray-850">
                        <span className="font-bold text-emerald-500 text-xs">{e.precioFinal}</span>
                        {e.estado === 'pendiente' ? (
                          <button 
                            onClick={() => iniciarTrabajo(e.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-white bg-primary/10 hover:bg-primary px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            <PlayCircle className="w-3.5 h-3.5" /> INICIAR
                          </button>
                        ) : (
                          <button 
                            onClick={() => finalizarTrabajo(e.id)}
                            className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-white bg-emerald-500/10 hover:bg-emerald-500 px-3 py-1.5 rounded transition-all cursor-pointer"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> FINALIZAR
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {tareasEquipo.length === 0 && (
                    <div className="w-full text-center py-6 text-[10px] font-bold uppercase tracking-widest text-gray-600">
                      Sin trabajos pendientes para {diaSeleccionado === 'Todo' ? 'esta semana' : 'este día'}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA CALENDARIO SEMANAL (TIMELINE) */
        <div className="space-y-4">
          
          {/* Componente Navegador de Días */}
          <div className="flex items-center justify-between bg-gray-950/40 p-2 rounded-2xl border border-gray-850">
            <button className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 transition-colors cursor-pointer"><ChevronLeft className="w-5 h-5"/></button>
            <div className="flex gap-2 flex-1 justify-center overflow-x-auto custom-scrollbar">
              {diasSemana.map((dia) => (
                <button
                  key={dia.id}
                  onClick={() => setDiaSeleccionado(dia.id)}
                  className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl transition-all cursor-pointer ${
                    diaSeleccionado === dia.id 
                      ? 'bg-primary text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)] border border-primary/50' 
                      : 'bg-gray-900 text-gray-500 hover:bg-gray-800 border border-gray-850'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">{dia.id}</span>
                  <span className={`text-lg font-black ${diaSeleccionado === dia.id ? 'text-white' : 'text-gray-300'}`}>{dia.num}</span>
                </button>
              ))}
            </div>
            <button className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 transition-colors cursor-pointer"><ChevronRight className="w-5 h-5"/></button>
          </div>

          <div className="flex justify-between items-end px-2">
            <h4 className="text-white font-bold flex items-center gap-2">
              Agenda del <span className="text-primary">{diasSemana.find(d => d.id === diaSeleccionado)?.label} {diasSemana.find(d => d.id === diaSeleccionado)?.num}</span>
            </h4>
            <div className="flex gap-4 text-[10px] font-bold text-gray-500">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div> En Curso</span>
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-600"></div> Pendiente</span>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="border border-gray-850 rounded-2xl overflow-hidden bg-gray-950/20 relative">
            <div className="overflow-x-auto custom-scrollbar">
              <div className="min-w-[1000px]">
                
                {/* Header de horas */}
                <div className="flex border-b border-gray-850 bg-gray-900 sticky top-0 z-10">
                  <div className="w-48 p-3 border-r border-gray-850 text-xs font-bold text-gray-400 flex items-center bg-gray-900">
                    Equipos / Horas
                  </div>
                  <div className="flex-1 flex relative">
                    {horasDia.map(h => (
                      <div key={h} className="flex-1 min-w-[60px] p-2 text-center text-[10px] font-bold text-gray-500 border-r border-gray-850/50">
                        {h}:00
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Filas por equipo */}
                {equipos.map((equipoName) => {
                  const tareasDelDia = ejecuciones.filter(e => e.equipo === equipoName && e.dia === diaSeleccionado && e.estado !== 'finalizado');
                  
                  return (
                    <div key={equipoName} className="flex border-b border-gray-850 group hover:bg-gray-900/20 transition-colors">
                      <div className="w-48 p-3 border-r border-gray-850 text-[10px] font-bold text-white bg-gray-950 group-hover:bg-gray-900 flex items-center gap-2">
                        <Wrench className="w-3 h-3 text-gray-500" /> {equipoName}
                      </div>
                      
                      <div className="flex-1 flex relative min-h-[80px]">
                        {/* Rejilla de fondo (Guías) */}
                        {horasDia.map((h, i) => (
                          <div key={i} className="flex-1 min-w-[60px] border-r border-gray-850/20 border-dashed"></div>
                        ))}
                        
                        {/* Bloques de Tareas */}
                        {tareasDelDia.map(e => {
                          // Calcular posiciones (Asumiendo que el timeline empieza a las 8:00 = index 0)
                          // Cada hora es un "slot" (100% / cantidad de horas)
                          const totalSlots = horasDia.length;
                          const slotIndex = e.horaNum - horasDia[0]; // ej: 10 - 8 = 2
                          const widthPercent = (e.duracionNum / totalSlots) * 100;
                          const leftPercent = (slotIndex / totalSlots) * 100;
                          
                          return (
                            <div 
                              key={e.id}
                              className={`absolute top-2 bottom-2 rounded-xl p-2 border overflow-hidden transition-all hover:scale-[1.01] hover:z-20 shadow-lg cursor-pointer flex flex-col justify-center ${
                                e.estado === 'en_curso' 
                                  ? 'bg-primary/20 border-primary/50 text-white' 
                                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-750'
                              }`}
                              style={{ left: `${leftPercent}%`, width: `calc(${widthPercent}% - 4px)` }}
                            >
                              <div className="flex justify-between items-start">
                                <span className="block text-[10px] font-bold truncate leading-tight pr-1">{e.servicio}</span>
                                {e.estado === 'en_curso' && <span className="flex h-2 w-2 relative flex-shrink-0 mt-0.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span></span>}
                              </div>
                              <span className="block text-[9px] opacity-80 truncate mt-0.5 flex items-center gap-1">
                                <CarFront className="w-2.5 h-2.5" /> {e.cliente}
                              </span>
                              
                              {/* Hover tooltip interactivo (Simulado con group-hover o siempre visible en bloques grandes) */}
                              {e.duracionNum >= 2 && (
                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center">
                                  <span className="text-[8px] font-mono">{e.inicio} - {e.horaNum + e.duracionNum}:00</span>
                                  {e.estado === 'pendiente' && (
                                    <button onClick={(ev) => { ev.stopPropagation(); iniciarTrabajo(e.id); }} className="p-1 bg-white/10 hover:bg-white/20 rounded text-white">
                                      <PlayCircle className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
