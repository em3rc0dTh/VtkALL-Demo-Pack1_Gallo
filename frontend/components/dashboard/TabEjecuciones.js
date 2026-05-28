'use client';

import { useState, useEffect } from 'react';
import { LayoutGrid, Wrench, Clock, PlayCircle, CheckCircle, CarFront, Calendar as CalendarIcon, ChevronLeft, ChevronRight, AlertCircle, XCircle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { api } from '../../lib/api';
import Swal from 'sweetalert2';

const obtenerLunesDeLaSemana = (fecha) => {
  const d = new Date(fecha);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(d.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};

const obtenerDiaActualId = () => {
  const hoyIdx = new Date().getDay();
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  if (hoyIdx === 0) return 'Lun';
  return nombresDias[hoyIdx];
};

const HOUR_HEIGHT = 70;

const getTeamColorClass = (teamName) => {
  const name = teamName?.toLowerCase() || '';
  if (name.includes('planchado') || name.includes('pintura')) {
    return {
      bg: 'bg-purple-500/10 border-purple-500/30 hover:border-purple-500/60',
      text: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      bar: 'bg-purple-500'
    };
  }
  if (name.includes('cliente') || name.includes('rápida') || name.includes('rapida')) {
    return {
      bg: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/60',
      text: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      bar: 'bg-amber-500'
    };
  }
  return {
    bg: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60',
    text: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    bar: 'bg-blue-500'
  };
};

export default function TabEjecuciones() {
  const [vista, setVista] = useState('calendario'); // 'pizarra' o 'calendario'
  const [fechaPivote, setFechaPivote] = useState(() => obtenerLunesDeLaSemana(new Date()));
  const [diaSeleccionado, setDiaSeleccionado] = useState(obtenerDiaActualId());
  const [teamSeleccionado, setTeamSeleccionado] = useState('Todos');
  
  const [ejecuciones, setEjecuciones] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [modalFinalizar, setModalFinalizar] = useState(null);
  const [notasFinalizacion, setNotasFinalizacion] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [subiendoImg, setSubiendoImg] = useState(false);

  const diasSemana = Array.from({ length: 6 }).map((_, idx) => {
    const diaFecha = new Date(fechaPivote);
    diaFecha.setDate(fechaPivote.getDate() + idx);
    const nombresDias = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const nombresCompletos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return {
      id: nombresDias[idx],
      num: diaFecha.getDate().toString().padStart(2, '0'),
      label: nombresCompletos[idx],
      fecha: diaFecha
    };
  });

  const cargarEjecuciones = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCitas('', '', 1, 100);
      if (res && res.citas) {
        // Filtrar citas que tienen equipo asignado
        const citasConEquipo = res.citas.filter(c => c.team_asignado);
        
        const mapped = citasConEquipo.map(c => {
          const fechaObj = new Date(c.fecha_cita);
          const hora = fechaObj.getHours();
          const minutos = fechaObj.getMinutes();
          const horaNum = hora + minutos / 60;
          const inicio = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
          
          const duracionNum = (c.duracion_estimada_minutos || 60) / 60;
          const duracionHoras = Math.max(1, Math.round(duracionNum));
          
          const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
          const diaId = nombresDias[fechaObj.getDay()];
          
          return {
            id: c._id,
            dia: diaId,
            fechaCompleta: fechaObj,
            cliente: c.nombre_cliente || c.cliente?.nombre || 'Cliente de Dashboard',
            servicio: c.servicio || 'Servicio General',
            equipo: c.team_asignado?.nombre || 'Mecánica General',
            tiempoEst: c.duracion_estimada_minutos >= 60 ? `${duracionHoras} ${duracionHoras === 1 ? 'hr' : 'hrs'}` : `${c.duracion_estimada_minutos} min`,
            precioFinal: `S/. ${(c.precio_final || c.precio_estimado || 0).toFixed(2)}`,
            estado: c.estado_trabajo || 'pendiente',
            inicio,
            horaNum,
            duracionNum,
            notas_mecanico: c.notas_mecanico || '',
            descripcion_trabajo: c.descripcion_trabajo || '',
            imagenes: c.imagenes || []
          };
        });
        setEjecuciones(mapped);
      }
    } catch (err) {
      console.error('Error al cargar ejecuciones:', err);
      setError('Error al cargar datos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const cargarTeams = async () => {
    try {
      const data = await api.getTeams();
      if (data) {
        setTeams(data);
      }
    } catch (err) {
      console.error('Error al cargar teams:', err);
    }
  };

  useEffect(() => {
    cargarEjecuciones();
    cargarTeams();
  }, []);

  const filtrarEjecucionesPorSemana = (ejec) => {
    const lunes = new Date(fechaPivote);
    lunes.setHours(0, 0, 0, 0);
    const sabado = new Date(fechaPivote);
    sabado.setDate(lunes.getDate() + 5);
    sabado.setHours(23, 59, 59, 999);
    
    return ejec.filter(e => {
      const d = new Date(e.fechaCompleta);
      return d >= lunes && d <= sabado;
    });
  };

  const iniciarTrabajo = async (id) => {
    try {
      const res = await api.actualizarCita(id, { estado_trabajo: 'en_curso' });
      if (res && res.ok) {
        setEjecuciones(prev => prev.map(e => e.id === id ? { ...e, estado: 'en_curso' } : e));
      }
    } catch (err) {
      console.error('Error al iniciar trabajo:', err);
      alert('Error al iniciar trabajo: ' + err.message);
    }
  };

  const handleOpenFinalizar = (id) => {
    setModalFinalizar(id);
    const ejec = ejecuciones.find(e => e.id === id);
    setNotasFinalizacion(ejec?.notas_mecanico || ejec?.descripcion_trabajo || '');
    setUploadedImages(ejec?.imagenes || []);
  };

  const handleUploadImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSubiendoImg(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('imagen', file);
        
        const res = await api.subirImagenGeneral(formData);
        if (res && res.ok && res.imageUrl) {
          setUploadedImages(prev => [...prev, res.imageUrl]);
        }
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al subir una o más imágenes: ' + err.message);
    } finally {
      setSubiendoImg(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitFinalizacion = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        estado_trabajo: 'finalizado',
        notas_mecanico: notasFinalizacion,
        imagenes: uploadedImages
      };
      
      const res = await api.actualizarCita(modalFinalizar, payload);
      if (res && res.ok) {
        setEjecuciones(prev => prev.map(item => item.id === modalFinalizar ? { 
          ...item, 
          estado: 'finalizado',
          notas_mecanico: notasFinalizacion,
          imagenes: uploadedImages
        } : item));
      }
    } catch (err) {
      console.error('Error al finalizar trabajo:', err);
      alert('Error al finalizar el trabajo: ' + err.message);
    } finally {
      setModalFinalizar(null);
    }
  };

  const handleGuardarProgreso = async () => {
    try {
      const payload = {
        estado_trabajo: 'en_curso',
        notas_mecanico: notasFinalizacion,
        imagenes: uploadedImages
      };
      
      const res = await api.actualizarCita(modalFinalizar, payload);
      if (res && res.ok) {
        setEjecuciones(prev => prev.map(item => item.id === modalFinalizar ? { 
          ...item, 
          notas_mecanico: notasFinalizacion,
          imagenes: uploadedImages
        } : item));
        
        Swal.fire({
          icon: 'success',
          title: 'Progreso Guardado',
          text: 'Se registraron las notas y evidencias fotográficas del avance actual.',
          background: '#111827',
          color: '#fff',
          toast: true,
          position: 'top-end',
          timer: 3000,
          showConfirmButton: false
        });
        
        setModalFinalizar(null);
      }
    } catch (err) {
      console.error('Error al guardar progreso:', err);
      alert('Error al guardar progreso: ' + err.message);
    }
  };

  const finalizarTrabajo = (id) => {
    handleOpenFinalizar(id);
  };

  const anteriorSemana = () => {
    setFechaPivote(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() - 7);
      return d;
    });
  };

  const siguienteSemana = () => {
    setFechaPivote(prev => {
      const d = new Date(prev);
      d.setDate(prev.getDate() + 7);
      return d;
    });
  };

  const equipos = teams.length > 0 ? teams.map(t => t.nombre) : ['Mecánica General', 'Planchado y Pintura', 'Atención Rápida'];
  const horasDia = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

  const ejecucionesSemana = filtrarEjecucionesPorSemana(ejecuciones);

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

      {/* Team Selector - Independent Calendars */}
      <div className="bg-dark-card/20 p-3 rounded-2xl border border-gray-850 flex items-center gap-3">
        <span className="text-[10px] font-bold uppercase text-gray-500">Equipo de Trabajo:</span>
        <div className="flex gap-1.5 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setTeamSeleccionado('Todos')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
              teamSeleccionado === 'Todos' ? 'bg-primary text-white shadow-md' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
            }`}
          >
            Todos los Equipos
          </button>
          {equipos.map(eq => (
            <button
              key={eq}
              onClick={() => setTeamSeleccionado(eq)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                teamSeleccionado === eq ? 'bg-primary text-white shadow-md' : 'bg-gray-900 text-gray-400 hover:bg-gray-800 border border-gray-800'
              }`}
            >
              {eq}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest animate-pulse">
          Cargando Taller...
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-500 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      ) : (
        <>
          {vista === 'pizarra' ? (
            <div className="grid grid-cols-1 gap-6">
              {/* Day Selector for Pizarra */}
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

              {equipos.filter(eq => teamSeleccionado === 'Todos' || eq === teamSeleccionado).map((equipoName) => {
                const tareasEquipo = ejecucionesSemana.filter(e => e.equipo === equipoName && e.estado !== 'finalizado' && (diaSeleccionado === 'Todo' || e.dia === diaSeleccionado));
                
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
            /* VISTA CALENDARIO SEMANAL (GOOGLE CALENDAR STYLE) */
            <div className="space-y-4">
              
              {/* Componente Navegador de Semanas */}
              <div className="flex items-center justify-between bg-gray-950/40 p-3 rounded-2xl border border-gray-850">
                <button 
                  onClick={anteriorSemana} 
                  className="px-3 py-1.5 rounded-xl hover:bg-gray-800 text-gray-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-800"
                >
                  <ChevronLeft className="w-3.5 h-3.5"/> Semana Anterior
                </button>
                <div className="text-[11px] font-bold text-gray-300 uppercase tracking-widest bg-gray-950 px-4 py-2 rounded-xl border border-gray-850">
                  {diasSemana[0]?.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })} — {diasSemana[5]?.fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <button 
                  onClick={siguienteSemana} 
                  className="px-3 py-1.5 rounded-xl hover:bg-gray-800 text-gray-400 transition-colors cursor-pointer flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider bg-gray-900 border border-gray-800"
                >
                  Siguiente Semana <ChevronRight className="w-3.5 h-3.5"/>
                </button>
              </div>

              <div className="flex justify-between items-center px-2">
                <h4 className="text-white text-xs font-bold uppercase tracking-wider">
                  Calendario Semanal ({teamSeleccionado === 'Todos' ? 'Todos los Equipos' : `Team: ${teamSeleccionado}`})
                </h4>
                <div className="flex gap-4 text-[9px] font-bold text-gray-500 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div> En Curso</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-gray-600"></div> Pendiente</span>
                </div>
              </div>

              {/* Timeline Grid (Google Calendar style) */}
              <div className="border border-gray-850 rounded-2xl overflow-hidden bg-gray-950/20 relative">
                <div className="overflow-x-auto custom-scrollbar">
                  <div className="min-w-[1000px]">
                    
                    {/* Header de horas y días */}
                    <div className="flex border-b border-gray-850 bg-gray-900 sticky top-0 z-30">
                      {/* Corner Hour block */}
                      <div className="w-16 border-r border-gray-850 bg-gray-900 shrink-0"></div>
                      
                      {/* Day headers */}
                      <div className="flex-1 grid grid-cols-6 divide-x divide-gray-850/60">
                        {diasSemana.map((dia) => {
                          const esHoy = new Date().toLocaleDateString('es-PE') === dia.fecha.toLocaleDateString('es-PE');
                          const esSeleccionado = diaSeleccionado === dia.id;
                          
                          return (
                            <div 
                              key={dia.id} 
                              onClick={() => setDiaSeleccionado(dia.id)}
                              className={`p-3 text-center bg-gray-900 cursor-pointer hover:bg-gray-850 transition-colors flex flex-col items-center justify-center select-none ${
                                esSeleccionado ? 'bg-primary/5' : ''
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{dia.id}</span>
                              <span className={`text-xs font-black mt-1 w-6 h-6 flex items-center justify-center rounded-full ${
                                esHoy ? 'bg-primary text-white shadow-md' : 'text-gray-300'
                              }`}>
                                {dia.num}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    {/* Grid de Horas y Columnas de Citas */}
                    <div className="flex relative max-h-[550px] overflow-y-auto custom-scrollbar" style={{ height: `${horasDia.length * HOUR_HEIGHT}px` }}>
                      
                      {/* Columna de etiquetas de horas */}
                      <div className="w-16 border-r border-gray-850 flex flex-col select-none bg-gray-950/20 z-10 shrink-0">
                        {horasDia.map((h) => (
                          <div 
                            key={h} 
                            className="text-right text-[10px] font-bold text-gray-500 pr-2 flex items-start justify-end pt-1"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                          >
                            {h}:00
                          </div>
                        ))}
                      </div>
                      
                      {/* Grid de fondo (Líneas horizontales) */}
                      <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none z-0">
                        {horasDia.map((h) => (
                          <div 
                            key={h} 
                            className="border-b border-gray-850/45 border-dashed w-full"
                            style={{ height: `${HOUR_HEIGHT}px` }}
                          />
                        ))}
                      </div>
                      
                      {/* Columnas de los días */}
                      <div className="flex-1 grid grid-cols-6 divide-x divide-gray-850/40 relative z-10">
                        {diasSemana.map((dia) => {
                          const tareasDelDia = ejecucionesSemana.filter(
                            e => (teamSeleccionado === 'Todos' || e.equipo === teamSeleccionado) && 
                                 e.dia === dia.id && 
                                 e.estado !== 'finalizado'
                          );
                          
                          return (
                            <div key={dia.id} className="relative h-full">
                              {/* Citas de este día */}
                              {tareasDelDia.map((e) => {
                                const colors = getTeamColorClass(e.equipo);
                                const top = (e.horaNum - 8) * HOUR_HEIGHT;
                                const height = e.duracionNum * HOUR_HEIGHT;
                                
                                return (
                                  <div
                                    key={e.id}
                                    onClick={() => handleOpenFinalizar(e.id)}
                                    className={`absolute left-1 right-1 rounded-xl p-2 border transition-all hover:scale-[1.01] hover:z-20 shadow-lg cursor-pointer flex flex-col justify-between ${colors.bg}`}
                                    style={{ top: `${top}px`, height: `${height - 4}px` }}
                                  >
                                    <div className="flex flex-col h-full justify-between">
                                      <div className="min-w-0">
                                        <div className="flex justify-between items-start gap-1">
                                          <span className="block text-[10px] font-bold truncate leading-tight text-white" title={e.servicio}>{e.servicio}</span>
                                          {e.estado === 'en_curso' && (
                                            <span className="flex h-2 w-2 relative flex-shrink-0 mt-0.5">
                                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                            </span>
                                          )}
                                        </div>
                                        <span className="block text-[8px] text-gray-400 truncate mt-0.5 flex items-center gap-1 font-medium">
                                          <CarFront className="w-2.5 h-2.5 text-gray-500" /> {e.cliente}
                                        </span>
                                      </div>
                                      
                                      <div className="flex justify-between items-center border-t border-white/5 pt-1.5 mt-1">
                                        <span className="text-[8px] font-mono text-gray-500">{e.inicio} ({e.tiempoEst})</span>
                                        <div className="flex gap-1" onClick={(ev) => ev.stopPropagation()}>
                                          {e.estado === 'pendiente' ? (
                                            <button 
                                              onClick={() => iniciarTrabajo(e.id)} 
                                              className="p-1 bg-primary/20 hover:bg-primary text-primary hover:text-white rounded transition-colors cursor-pointer" 
                                              title="Iniciar Trabajo"
                                            >
                                              <PlayCircle className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <button 
                                              onClick={() => handleOpenFinalizar(e.id)} 
                                              className="p-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white rounded transition-colors cursor-pointer" 
                                              title="Finalizar Trabajo"
                                            >
                                              <CheckCircle className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                      
                    </div>
                    
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE FINALIZACIÓN DE TRABAJO */}
      {modalFinalizar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl p-6 relative">
            <button 
              onClick={() => setModalFinalizar(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="w-5 h-5 text-primary" /> Actualizar Progreso / Finalizar Trabajo
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Registra el avance diario, sube fotos del procedimiento o finaliza el trabajo para la entrega al cliente.
              </p>
            </div>

            <form onSubmit={handleSubmitFinalizacion} className="space-y-6">
              
              {/* Notas del Trabajo Realizado */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Detalles del Trabajo Realizado *</label>
                <textarea 
                  name="notas_finalizacion"
                  rows="4" 
                  required
                  value={notasFinalizacion}
                  onChange={(e) => setNotasFinalizacion(e.target.value)}
                  placeholder="Ej: Se realizó el cambio de pastillas de frenos y rectificado de discos. Se probó el frenado y responde de forma de manera óptima..."
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none custom-scrollbar"
                />
              </div>

              {/* Evidencia Fotográfica */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5 text-primary" /> Evidencias (Fotos de avance y entrega)
                </label>
                <div className="grid grid-cols-4 gap-3">
                  <label className="aspect-square bg-gray-950 border-2 border-dashed border-gray-800 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                    <UploadCloud className="w-6 h-6 mb-1" />
                    <span className="text-[9px] font-bold">{subiendoImg ? 'Subiendo...' : 'Subir Foto'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadImage}
                      disabled={subiendoImg}
                    />
                  </label>
                  {uploadedImages.map((img, idx) => (
                    <div key={idx} className="aspect-square bg-gray-850 rounded-xl overflow-hidden relative group border border-gray-705">
                      <img src={img} alt="Evidencia" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 shadow-md cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-gray-300">
                        {idx === 0 ? 'Antes (Evidencia)' : `Foto #${idx + 1}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acciones */}
              <div className="pt-6 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                <button 
                  type="button" 
                  onClick={() => setModalFinalizar(null)} 
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-gray-950 hover:bg-gray-800 border border-gray-800 transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                
                <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2.5">
                  <button 
                    type="button"
                    onClick={handleGuardarProgreso}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all cursor-pointer"
                  >
                    GUARDAR AVANCE
                  </button>
                  <button 
                    type="submit" 
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg transition-all cursor-pointer"
                  >
                    FINALIZAR Y ENTREGAR
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
