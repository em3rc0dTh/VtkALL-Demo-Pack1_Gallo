'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Edit3, Trash2, Shield, UserCog, Clock, CalendarDays } from 'lucide-react';
import Swal from 'sweetalert2';

import { api } from '../../lib/api';

export default function TabTeam() {
  const [modalHorarioOpen, setModalHorarioOpen] = useState(false);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);

  const [trabajadores, setTrabajadores] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [cargando, setCargando] = useState(true);

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
    } catch (error) {
      console.error('Error cargando equipos:', error);
    } finally {
      setCargando(false);
    }
  };
  const handleCrearTeam = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Team / Especialidad',
      html: `
        <input id="swal-t1" class="swal2-input" placeholder="Nombre (Ej: Mecánica Rápida)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-t1').value,
          horario_referencial: 'Por configurar',
          capacidad: 1
        }
      }
    });

    if (formValues && formValues.nombre) {
      try {
        await api.crearTeam(formValues);
        Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarDatos();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleCrearTrabajador = async () => {
    // Preparar opciones de teams para el select
    const teamOptions = equipos.map(eq => `<option value="${eq._id}">${eq.nombre}</option>`).join('');

    const { value: formValues } = await Swal.fire({
      title: 'Agregar Trabajador',
      html: `
        <input id="swal-tr1" class="swal2-input" placeholder="Nombre Completo">
        <input id="swal-tr2" class="swal2-input" placeholder="Rol (Ej: Especialista)">
        <select id="swal-tr3" class="swal2-select" style="display: flex; margin: 1em auto; width: 70%; max-width: 100%; font-size: 1.125em;">
          <option value="Planilla">Planilla</option>
          <option value="Recibo por Honorarios">Recibo por Honorarios</option>
        </select>
        <select id="swal-tr4" class="swal2-select" style="display: flex; margin: 1em auto; width: 70%; max-width: 100%; font-size: 1.125em;">
          <option value="">-- Seleccionar Team --</option>
          ${teamOptions}
        </select>
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-tr1').value,
          rol: document.getElementById('swal-tr2').value,
          contrato: document.getElementById('swal-tr3').value,
          team: document.getElementById('swal-tr4').value || null
        }
      }
    });

    if (formValues && formValues.nombre) {
      try {
        await api.crearTrabajador(formValues);
        Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarDatos();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
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
  const handleAbrirHorario = (eq) => {
    setEquipoSeleccionado(eq);
    setModalHorarioOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" /> Staff y Disponibilidad (Time Slots)
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Registra a tus técnicos/expertos y define sus intervalos de atención para el motor de reservas.</p>
        </div>
        <button onClick={handleCrearTrabajador} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-btn-primary hover:shadow-btn-primary-hover cursor-pointer">
          <Plus className="w-4 h-4" /> AGREGAR TRABAJADOR
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Lista de Trabajadores */}
        <div className="md:col-span-2 space-y-4">
          <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2"><UserCog className="w-4 h-4 text-gray-400" /> Directorio de Expertos</h4>
          
          <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-950/20">
            <table className="min-w-full divide-y divide-gray-850 text-left text-xs">
              <thead className="bg-dark-card/40 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Nombre y Rol</th>
                  <th className="px-6 py-4">Tipo de Contrato</th>
                  <th className="px-6 py-4">Team (Grupo)</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/60 text-gray-300 font-light">
                {trabajadores.map((t) => (
                  <tr key={t._id} className="hover:bg-gray-900/10">
                    <td className="px-6 py-4">
                      <span className="block font-bold text-white">{t.nombre}</span>
                      <span className="text-[10px] text-gray-500">{t.rol}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[9px] font-bold ${
                        t.contrato === 'Planilla' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                      }`}>
                        {t.contrato}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-300 font-medium">{t.team ? t.team.nombre : 'Sin Equipo'}</span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-1.5">
                      <button className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-primary cursor-pointer border border-gray-850"><Edit3 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleEliminarTrabajador(t._id)} className="p-1.5 rounded-lg bg-gray-900 hover:bg-red-500/10 text-gray-500 hover:text-red-500 cursor-pointer border border-gray-850"><Trash2 className="w-3.5 h-3.5" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gestión de Teams / Slots */}
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2"><Shield className="w-4 h-4 text-gray-400" /> Grupos / Especialidades</h4>
            <button onClick={handleCrearTeam} className="text-primary hover:text-white transition-colors"><Plus className="w-4 h-4 cursor-pointer" /></button>
          </div>

          <div className="space-y-3">
            {equipos.map((eq) => (
              <div key={eq._id} className="p-4 rounded-xl border border-gray-850 bg-gray-950/40 hover:border-primary/50 transition-all group">
                <h5 className="font-bold text-white text-sm">{eq.nombre}</h5>
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <Clock className="w-3 h-3 text-gray-500 mt-0.5" />
                    <p className="text-[10px] text-gray-400 leading-tight">Disponibilidad:<br/><span className="text-gray-300 font-bold">{eq.horario_referencial || 'No configurado'}</span></p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3 h-3 text-gray-500" />
                    <p className="text-[10px] text-gray-400">Expertos asignados: <span className="text-gray-300 font-bold">{eq.capacidad}</span></p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-850 flex justify-end">
                  <button 
                    onClick={() => handleAbrirHorario(eq)}
                    className="flex items-center gap-1.5 text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer transition-colors"
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> CONFIGURAR DISPONIBILIDAD
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal Wireframe para Configurar Horarios y Time Slots */}
      {modalHorarioOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">
                Disponibilidad: <span className="text-primary">{equipoSeleccionado?.nombre}</span>
              </h3>
              <button 
                onClick={() => setModalHorarioOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Generador de Slots */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Duración por defecto del Slot</label>
                <div className="flex gap-3">
                  <button className="flex-1 py-2 rounded-xl border border-primary bg-primary/10 text-primary text-xs font-bold">30 Minutos</button>
                  <button className="flex-1 py-2 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:text-white text-xs font-bold">45 Minutos</button>
                  <button className="flex-1 py-2 rounded-xl border border-gray-800 bg-gray-900 text-gray-400 hover:text-white text-xs font-bold">1 Hora</button>
                </div>
              </div>

              {/* Días Laborales */}
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Días de Atención</label>
                <div className="flex flex-wrap gap-2">
                  {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map((dia, idx) => (
                    <button key={dia} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${idx < 6 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
                      {dia}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hora Inicio</label>
                  <input type="time" defaultValue="08:00" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Hora Fin</label>
                  <input type="time" defaultValue="18:00" className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-white text-xs outline-none" />
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  onClick={() => setModalHorarioOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setModalHorarioOpen(false)}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover"
                >
                  Guardar Disponibilidad
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
