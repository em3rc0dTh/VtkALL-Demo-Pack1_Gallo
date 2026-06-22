'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, Shield, UserCog, Clock, CalendarDays, Wrench } from 'lucide-react';
import Swal from 'sweetalert2';
import CloseModalButton from '../ui/CloseModalButton.js';

import { api } from '../../lib/api';

export default function TabTeam() {
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  const [trabajadores, setTrabajadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  // UI States
  const [equipoActivo, setEquipoActivo] = useState(null);
  
  // Modals States
  const [modalEquipoOpen, setModalEquipoOpen] = useState(false);
  const [equipoNombre, setEquipoNombre] = useState('');
  
  const [modalTrabajadorOpen, setModalTrabajadorOpen] = useState(false);
  const [trabajadorEditando, setTrabajadorEditando] = useState(null);
  const [trabajadorNombre, setTrabajadorNombre] = useState('');
  const [trabajadorRol, setTrabajadorRol] = useState('');
  const [trabajadorContrato, setTrabajadorContrato] = useState('Planilla');
  const [trabajadorTeam, setTrabajadorTeam] = useState('');
  
  const [guardandoUi, setGuardandoUi] = useState(false);

  // Estados para Disponibilidad
  const [duracionSlot, setDuracionSlot] = useState(30);
  const [diasLaborables, setDiasLaborables] = useState([1, 2, 3, 4, 5, 6]);
  const [horaInicio, setHoraInicio] = useState('08:00');
  const [horaFin, setHoraFin] = useState('18:00');
  const [guardandoHorario, setGuardandoHorario] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [teamsData, trabajadoresData] = await Promise.all([
        api.getTeams(),
        api.getTrabajadores()
      ]);
      setEquipos(teamsData);
      setTrabajadores(trabajadoresData);

      if (!equipoActivo) {
        setEquipoActivo('todos');
      } else if (equipoActivo !== 'todos' && equipoActivo !== 'sin_equipo' && !teamsData.find(e => e._id === equipoActivo)) {
        setEquipoActivo('todos');
      }
    } catch (error) {
      console.error('Error cargando equipos:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleAbrirHorario = async (eq) => {
    setEquipoSeleccionado(eq);
    try {
      const res = await api.getDisponibilidad(eq._id);
      if (res) {
        setDuracionSlot(res.duracion_slot_minutos ?? 30);
        setDiasLaborables(res.dias_laborables || [1, 2, 3, 4, 5, 6]);
        setHoraInicio(res.hora_inicio || '08:00');
        setHoraFin(res.hora_fin || '18:00');
      } else {
        setDuracionSlot(30);
        setDiasLaborables([1, 2, 3, 4, 5, 6]);
        setHoraInicio('08:00');
        setHoraFin('18:00');
      }
    } catch (error) {
      console.error('Error al cargar disponibilidad:', error);
      setDuracionSlot(30);
      setDiasLaborables([1, 2, 3, 4, 5, 6]);
      setHoraInicio('08:00');
      setHoraFin('18:00');
    }
    setModalHorarioOpen(true);
  };

  const handleGuardarDisponibilidad = async () => {
    setGuardandoHorario(true);
    try {
      await api.guardarDisponibilidad({
        entidad_id: equipoSeleccionado._id,
        tipo_entidad: 'Team',
        duracion_slot_minutos: duracionSlot,
        dias_laborables: diasLaborables,
        hora_inicio: horaInicio,
        hora_fin: horaFin
      });

      let diasText = '';
      if (diasLaborables.length === 0) {
        diasText = 'Sin días';
      } else if (diasLaborables.length === 7) {
        diasText = 'Lun-Dom';
      } else {
        const diasNombresCortos = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const isContiguous = (arr) => {
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] !== arr[i - 1] + 1) return false;
          }
          return true;
        };
        if (isContiguous(diasLaborables)) {
          diasText = `${diasNombresCortos[diasLaborables[0] - 1]}-${diasNombresCortos[diasLaborables[diasLaborables.length - 1] - 1]}`;
        } else {
          diasText = diasLaborables.map(d => diasNombresCortos[d - 1]).join(',');
        }
      }

      const slotText = duracionSlot === 0 ? 'Continúo' : `Slots ${duracionSlot} min`;
      const horarioReferencial = `${diasText} ${horaInicio} - ${horaFin} (${slotText})`;

      await api.actualizarTeam(equipoSeleccionado._id, {
        horario_referencial: horarioReferencial
      });

      Swal.fire({
        title: 'Guardado',
        text: 'La disponibilidad se actualizó correctamente.',
        icon: 'success',
        background: '#111827',
        color: '#fff',
        showConfirmButton: false,
        timer: 1500
      });

      setModalHorarioOpen(false);
      cargarDatos();
    } catch (error) {
      console.error('Error al guardar disponibilidad:', error);
      Swal.fire({ title: 'Error', text: error.message, icon: 'error', background: '#111827', color: '#fff' });
    } finally {
      setGuardandoHorario(false);
    }
  };

  const handleGuardarEquipo = async (e) => {
    e.preventDefault();
    if (!equipoNombre.trim()) return;
    setGuardandoUi(true);
    try {
      await api.crearTeam({
        nombre: equipoNombre.trim(),
        horario_referencial: 'Por configurar',
        capacidad: 1
      });
      Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
      setModalEquipoOpen(false);
      cargarDatos();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setGuardandoUi(false);
    }
  };

  const abrirModalCrearTrabajador = () => {
    setTrabajadorEditando(null);
    setTrabajadorNombre('');
    setTrabajadorRol('');
    setTrabajadorContrato('Planilla');
    setTrabajadorTeam(equipoActivo !== 'sin_equipo' && equipoActivo ? equipoActivo : '');
    setModalTrabajadorOpen(true);
  };

  const abrirModalEditarTrabajador = (t) => {
    setTrabajadorEditando(t);
    setTrabajadorNombre(t.nombre || '');
    setTrabajadorRol(t.rol || '');
    setTrabajadorContrato(t.contrato || 'Planilla');
    setTrabajadorTeam(t.team?._id || '');
    setModalTrabajadorOpen(true);
  };

  const handleGuardarTrabajador = async (e) => {
    e.preventDefault();
    if (!trabajadorNombre.trim()) return;
    setGuardandoUi(true);
    
    const payload = {
      nombre: trabajadorNombre.trim(),
      rol: trabajadorRol.trim(),
      contrato: trabajadorContrato,
      team: trabajadorTeam || null
    };

    try {
      if (trabajadorEditando) {
        await api.actualizarTrabajador(trabajadorEditando._id, payload);
        Swal.fire({ title: 'Actualizado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
      } else {
        await api.crearTrabajador(payload);
        Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
      }
      setModalTrabajadorOpen(false);
      cargarDatos();
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    } finally {
      setGuardandoUi(false);
    }
  };

  const handleEliminarTrabajador = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar trabajador?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      background: '#111827',
      color: '#fff'
    });
    if (result.isConfirmed) {
      try {
        await api.eliminarTrabajador(id);
        cargarDatos();
      } catch (e) {}
    }
  };

  // Filtrado
  const trabajadoresFiltrados = trabajadores.filter(t => {
    if (equipoActivo === 'todos') return true;
    if (equipoActivo === 'sin_equipo') {
      return !t.team;
    }
    return t.team?._id === equipoActivo;
  });

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Especialidades y Personal
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Administra tus grupos de trabajo y asigna a tus técnicos.</p>
        </div>
        <button 
          onClick={() => { setEquipoNombre(''); setModalEquipoOpen(true); }} 
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all uppercase tracking-wide cursor-pointer"
        >
          <Plus className="w-4 h-4" /> AGREGAR EQUIPO
        </button>
      </div>

      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: EQUIPOS */}
        <div className="space-y-4 xl:col-span-1 sticky top-24">
          <h4 className="text-sm font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400" /> Grupos de Trabajo</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
            {/* "TODOS" TILE */}
            <div 
              onClick={() => setEquipoActivo('todos')}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                equipoActivo === 'todos' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-850 bg-gray-950/40 hover:border-gray-700'
              }`}
            >
              <h5 className={`font-bold text-sm ${equipoActivo === 'todos' ? 'text-blue-400' : 'text-gray-500'}`}>Todos los Trabajadores</h5>
              <p className="text-[10px] text-gray-600 mt-1">Ver lista completa</p>
            </div>

            {equipos.map((eq) => (
              <div 
                key={eq._id} 
                onClick={() => setEquipoActivo(eq._id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                  equipoActivo === eq._id ? 'border-primary bg-primary/10' : 'border-gray-850 bg-gray-950/40 hover:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className={`font-bold text-sm ${equipoActivo === eq._id ? 'text-white' : 'text-gray-400'}`}>{eq.nombre}</h5>
                    <p className="text-[10px] text-gray-500 mt-1">Horario: {eq.horario_referencial || 'No configurado'}</p>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleAbrirHorario(eq); }} 
                    className="p-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors" 
                    title="Configurar Horario"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* "SIN EQUIPO" TILE */}
            <div 
              onClick={() => setEquipoActivo('sin_equipo')}
              className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${
                equipoActivo === 'sin_equipo' ? 'border-orange-500 bg-orange-500/10' : 'border-gray-850 bg-gray-950/40 hover:border-gray-700'
              }`}
            >
              <h5 className={`font-bold text-sm ${equipoActivo === 'sin_equipo' ? 'text-orange-400' : 'text-gray-500'}`}>Sin Equipo Asignado</h5>
              <p className="text-[10px] text-gray-600 mt-1">Técnicos libres o por asignar</p>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: TRABAJADORES DEL EQUIPO */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-4 px-1 pb-3 border-b border-gray-800">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCog className="w-4 h-4 text-gray-400" /> 
                {equipoActivo === 'todos' ? 'Todos los Trabajadores' : (equipoActivo === 'sin_equipo' ? 'Trabajadores sin Equipo' : (equipos.find(e => e._id === equipoActivo)?.nombre || 'Trabajadores'))}
              </h4>
              <p className="text-[10px] text-gray-500 mt-0.5">{trabajadoresFiltrados.length} miembros encontrados</p>
            </div>
            <button 
              onClick={abrirModalCrearTrabajador}
              className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 hover:text-white transition-colors cursor-pointer text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> AÑADIR TRABAJADOR
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 auto-rows-max">
            {trabajadoresFiltrados.length === 0 ? (
              <div className="sm:col-span-2 p-12 text-center flex flex-col items-center justify-center bg-gray-950/20 rounded-2xl border border-gray-850 border-dashed">
                <UserCog className="w-8 h-8 text-gray-700 mb-3" />
                <p className="text-xs text-gray-500 italic">No hay trabajadores registrados en esta lista.</p>
              </div>
            ) : trabajadoresFiltrados.map((t) => (
              <div key={t._id} className="p-4 rounded-2xl border border-gray-850 bg-gray-950/20 hover:bg-gray-900/40 transition-all flex flex-col justify-between h-full group shadow-sm">
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="block font-bold text-white text-sm">{t.nombre}</span>
                      <span className="text-[10px] text-gray-400">{t.rol || 'Sin rol'}</span>
                    </div>
                    <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                      t.contrato === 'Planilla' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                    }`}>
                      {t.contrato}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 mt-2 border-t border-gray-850 flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button title="Editar" aria-label="Editar Trabajador" onClick={() => abrirModalEditarTrabajador(t)} className="p-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-primary cursor-pointer border border-gray-850 transition-colors flex items-center gap-1.5 text-[10px] font-bold">
                    <Edit3 className="w-3.5 h-3.5" /> EDITAR
                  </button>
                  <button title="Eliminar" aria-label="Eliminar Trabajador" onClick={() => handleEliminarTrabajador(t._id)} className="p-2 rounded-lg bg-gray-900 hover:bg-red-500/10 text-gray-500 hover:text-red-500 cursor-pointer border border-gray-850 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* MODAL: Agregar Equipo */}
      {modalEquipoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">Nuevo Equipo</h3>
              <CloseModalButton onClick={() => setModalEquipoOpen(false)} />
            </div>
            <form onSubmit={handleGuardarEquipo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Nombre del Equipo o Especialidad</label>
                <input 
                  type="text" 
                  value={equipoNombre} 
                  onChange={(e) => setEquipoNombre(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Ej: Mecánica Rápida"
                  required 
                />
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={guardandoUi} className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer">
                  {guardandoUi ? 'Guardando...' : 'Crear Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Agregar/Editar Trabajador */}
      {modalTrabajadorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">
                {trabajadorEditando ? 'Editar Trabajador' : 'Nuevo Trabajador'}
              </h3>
              <CloseModalButton onClick={() => setModalTrabajadorOpen(false)} />
            </div>
            <form onSubmit={handleGuardarTrabajador} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={trabajadorNombre} 
                  onChange={(e) => setTrabajadorNombre(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Ej: Juan Pérez"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Rol / Cargo</label>
                <input 
                  type="text" 
                  value={trabajadorRol} 
                  onChange={(e) => setTrabajadorRol(e.target.value)} 
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors" 
                  placeholder="Ej: Técnico Especialista"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Tipo de Contrato</label>
                  <select 
                    value={trabajadorContrato} 
                    onChange={(e) => setTrabajadorContrato(e.target.value)} 
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer appearance-none"
                  >
                    <option value="Planilla">Planilla</option>
                    <option value="Recibo por Honorarios">Recibos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Equipo Asignado</label>
                  <select 
                    value={trabajadorTeam} 
                    onChange={(e) => setTrabajadorTeam(e.target.value)} 
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors cursor-pointer appearance-none"
                  >
                    <option value="">-- Ninguno --</option>
                    {equipos.map(eq => (
                      <option key={eq._id} value={eq._id}>{eq.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={guardandoUi} className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-bold transition-all disabled:opacity-50 cursor-pointer">
                  {guardandoUi ? 'Guardando...' : (trabajadorEditando ? 'Guardar Cambios' : 'Crear Trabajador')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Configurar Horarios y Time Slots */}
      {modalHorarioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">
                Disponibilidad: <span className="text-primary">{equipoSeleccionado?.nombre}</span>
              </h3>
              <CloseModalButton onClick={() => setModalHorarioOpen(false)} />
            </div>

            <div className="space-y-6">
              {/* Generador de Slots */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Duración por defecto del Slot</label>
                <div className="flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setDuracionSlot(30)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      duracionSlot === 30 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    30 Minutos
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDuracionSlot(60)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      duracionSlot === 60 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    1 Hora
                  </button>
                  <button 
                    type="button"
                    onClick={() => setDuracionSlot(0)}
                    className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      duracionSlot === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-gray-800 bg-gray-900 text-gray-400 hover:text-white'
                    }`}
                  >
                    Continúo
                  </button>
                </div>
              </div>

              {/* Días Laborales */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Días de Atención</label>
                <div className="flex flex-wrap gap-2">
                  {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map((dia, idx) => {
                    const diaNum = idx + 1; // 1 = LUN, 7 = DOM
                    const seleccionado = diasLaborables.includes(diaNum);
                    return (
                      <button 
                        key={dia} 
                        type="button"
                        onClick={() => {
                          if (seleccionado) {
                            setDiasLaborables(prev => prev.filter(d => d !== diaNum));
                          } else {
                            setDiasLaborables(prev => [...prev, diaNum].sort());
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer ${
                          seleccionado 
                            ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' 
                            : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        {dia}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rango de Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hora Inicio</label>
                  <input 
                    type="time" 
                    value={horaInicio} 
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hora Fin</label>
                  <input 
                    type="time" 
                    value={horaFin} 
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs outline-none" 
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalHorarioOpen(false)}
                  disabled={guardandoHorario}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarDisponibilidad}
                  disabled={guardandoHorario}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover disabled:opacity-50 cursor-pointer"
                >
                  {guardandoHorario ? 'Guardando...' : 'Guardar Disponibilidad'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
