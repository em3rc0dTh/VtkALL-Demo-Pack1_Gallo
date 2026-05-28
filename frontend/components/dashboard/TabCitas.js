'use client';

import { useState, useEffect } from 'react';
import { Calendar, List, Clock, Video, Phone, User, CheckCircle2, AlertCircle, Plus, ChevronLeft, ChevronRight, UserCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../lib/api';

export default function TabCitas() {
  const [vista, setVista] = useState('slots'); // 'slots' | 'lista'
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  
  const [expertos, setExpertos] = useState([]);
  const [expertoActivo, setExpertoActivo] = useState(null);
  const [citasReal, setCitasReal] = useState([]);

  const [citaDetalle, setCitaDetalle] = useState(null);
  const [modalCitaOpen, setModalCitaOpen] = useState(false);
  const [editEstado, setEditEstado] = useState('');
  const [editPrecio, setEditPrecio] = useState('');

  const handleGuardarCita = async (e) => {
    e.preventDefault();
    try {
      await api.actualizarCita(citaDetalle._id, {
        estado: editEstado,
        precio_final: editPrecio ? Number(editPrecio) : undefined
      });
      Swal.fire({ title: 'Cita Actualizada', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false, background: '#111827', color: '#fff' });
      setModalCitaOpen(false);
      cargarCitas();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#111827', color: '#fff' });
    }
  };

  useEffect(() => {
    cargarDatosInit();
  }, []);

  useEffect(() => {
    if (expertoActivo) {
      cargarCitas();
    }
  }, [fechaFiltro, expertoActivo]);

  const cargarDatosInit = async () => {
    try {
      const trabs = await api.getTrabajadores();
      setExpertos(trabs);
      if (trabs.length > 0) setExpertoActivo(trabs[0]._id);
    } catch (e) {
      console.error(e);
    }
  };

  const cargarCitas = async () => {
    try {
      const res = await api.getCitas(fechaFiltro);
      setCitasReal(res.citas || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNuevaReserva = async (horaPredefinida = '') => {
    const { value: formValues } = await Swal.fire({
      title: 'Agendar Nueva Cita',
      html: `
        <input id="swal-c1" class="swal2-input" placeholder="Nombre del Cliente">
        <input id="swal-c2" class="swal2-input" placeholder="Teléfono / WhatsApp">
        <select id="swal-c3" class="swal2-select" style="display: flex; margin: 1em auto; width: 70%; max-width: 100%; font-size: 1.125em;">
          <option value="Evaluación Presencial">Evaluación Presencial (Taller)</option>
          <option value="Evaluación con Fotos">Evaluación con Fotos (Remoto)</option>
          <option value="Llamada Directa">Llamada Directa (Sin Fotos)</option>
        </select>
        <input id="swal-c4" type="time" class="swal2-input" value="${horaPredefinida || '09:00'}">
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        const horaStr = document.getElementById('swal-c4').value;
        const d = new Date(fechaFiltro);
        d.setHours(parseInt(horaStr.split(':')[0]), parseInt(horaStr.split(':')[1]));
        return {
          nombre_cliente: document.getElementById('swal-c1').value,
          telefono_cliente: document.getElementById('swal-c2').value,
          tipo_cita: document.getElementById('swal-c3').value,
          fecha_cita: d.toISOString(),
          experto_asignado: expertoActivo,
          estado: 'pendiente'
        }
      }
    });

    if (formValues && formValues.nombre_cliente) {
      try {
        await api.crearCita(formValues);
        Swal.fire({ title: 'Agendado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarCitas();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  // Generador de Slots básico (8:00 a 18:00, 30 min)
  const timeSlots = [];
  for (let i = 8; i < 18; i++) {
    for (let j = 0; j < 60; j += 30) {
      const horaStr = `${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}`;
      
      // Buscar si hay cita para este experto en esta hora
      const cita = citasReal.find(c => {
        const d = new Date(c.fecha_cita);
        const horaCita = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
        return horaCita === horaStr && c.experto_asignado?._id === expertoActivo;
      });

      if (cita) {
        timeSlots.push({
          hora: horaStr,
          estado: 'ocupado',
          tipo: cita.tipo_cita || 'Evaluación Presencial',
          cliente: cita.cliente?.nombre || cita.nombre_cliente || 'Desconocido',
          citaOriginal: cita
        });
      } else {
        timeSlots.push({ hora: horaStr, estado: 'disponible' });
      }
    }
  }

  const renderIconoTipo = (tipo) => {
    switch (tipo) {
      case 'Evaluación Presencial': return <User className="w-4 h-4 text-blue-400" />;
      case 'Evaluación con Fotos': return <Video className="w-4 h-4 text-purple-400" />;
      case 'Llamada Directa': return <Phone className="w-4 h-4 text-green-400" />;
      default: return null;
    }
  };

  const renderSlot = (slot) => {
    if (slot.estado === 'disponible') {
      return (
        <div key={slot.hora} className="flex gap-4 p-4 rounded-xl border border-gray-800 border-dashed bg-gray-900/20 hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group">
          <div className="w-16 font-mono text-gray-500 font-bold mt-1 group-hover:text-primary">{slot.hora}</div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Slot Disponible</span>
            <button onClick={() => handleNuevaReserva(slot.hora)} className="text-[10px] bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg font-bold group-hover:bg-primary group-hover:text-white transition-colors">
              + AGENDAR
            </button>
          </div>
        </div>
      );
    }
    
    if (slot.estado === 'bloqueado') {
      return (
        <div key={slot.hora} className="flex gap-4 p-4 rounded-xl border border-gray-850 bg-gray-950 opacity-60">
          <div className="w-16 font-mono text-gray-600 font-bold mt-1">{slot.hora}</div>
          <div className="flex-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">Bloqueado: {slot.notas}</span>
          </div>
        </div>
      );
    }

    // Ocupado (Cita)
    return (
      <div key={slot.hora} className="flex gap-4 p-4 rounded-xl border border-gray-700 bg-gray-900 shadow-md">
        <div className="w-16 font-mono text-white font-bold mt-1">{slot.hora}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 mb-1">
              {renderIconoTipo(slot.tipo)}
              <span className="text-xs font-bold text-white">{slot.tipo}</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { 
                  setCitaDetalle(slot.citaOriginal); 
                  setEditEstado(slot.citaOriginal.estado); 
                  setEditPrecio(slot.citaOriginal.precio_final || ''); 
                  setModalCitaOpen(true); 
                }} 
                className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded font-bold hover:bg-blue-500 hover:text-white transition-colors"
              >
                Editar / Status
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Cliente: <span className="font-semibold text-gray-300">{slot.cliente}</span></p>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Barra superior de navegación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-2 bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setVista('slots')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              vista === 'slots' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" /> Time Slots (Motor de Reservas)
          </button>
          <button
            onClick={() => setVista('lista')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              vista === 'lista' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" /> Todas las citas
          </button>
        </div>

        <button onClick={() => handleNuevaReserva()} className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-btn-primary cursor-pointer">
          <Plus className="w-4 h-4" /> NUEVA RESERVA
        </button>
      </div>

      {/* VISTA SLOTS (Motor de Reservas para Expertos) */}
      {vista === 'slots' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Panel Lateral: Selector de Experto y Filtros */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-950/40 border border-gray-850 p-5 rounded-2xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Experto a consultar</h4>
              <div className="space-y-2">
                {expertos.map(exp => (
                  <button 
                    key={exp._id}
                    onClick={() => setExpertoActivo(exp._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      expertoActivo === exp._id ? 'bg-primary/10 border-primary text-white' : 'bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <UserCircle className={`w-5 h-5 ${expertoActivo === exp._id ? 'text-primary' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold">{exp.nombre}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gray-950/40 border border-gray-850 p-5 rounded-2xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Leyenda de Citas</h4>
              <ul className="space-y-3 text-[10px] text-gray-400">
                <li className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-blue-400" /> Evaluación Presencial (Taller)</li>
                <li className="flex items-center gap-2"><Video className="w-3.5 h-3.5 text-purple-400" /> Evaluación con Fotos (Remoto)</li>
                <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-green-400" /> Llamada Directa (Sin Fotos)</li>
              </ul>
            </div>
          </div>

          {/* Grilla de Disponibilidad */}
          <div className="lg:col-span-3">
            <div className="bg-gray-950/20 border border-gray-850 rounded-2xl overflow-hidden flex flex-col">
              
              {/* Header Día */}
              <div className="bg-gray-900 border-b border-gray-800 p-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <button className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                  <h3 className="text-sm font-black text-white w-40 text-center">Jueves, 26 Mayo</h3>
                  <button className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
                </div>
                <input type="date" className="bg-gray-950 border border-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-lg outline-none" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} />
              </div>

              {/* Lista de Slots */}
              <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                {timeSlots.map(renderSlot)}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* VISTA LISTA GENÉRICA */}
      {vista === 'lista' && (
        <div className="text-center py-12 text-sm text-gray-500 border border-gray-850 rounded-2xl bg-gray-950/20">
          Vista de tabla genérica para ver historial (Ya implementada en la versión anterior).
        </div>
      )}

    {/* MODAL EDITAR CITA */}
    {modalCitaOpen && citaDetalle && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white">Editar Estado de Cita</h3>
            <button onClick={() => setModalCitaOpen(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
          <form onSubmit={handleGuardarCita} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Estado</label>
              <select value={editEstado} onChange={e => setEditEstado(e.target.value)} className="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-xl text-sm outline-none">
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="evaluacion_en_curso">Evaluación en Curso</option>
                <option value="completada">Completada (Cobra el pago)</option>
                <option value="cancelada">Cancelada (Libera el slot)</option>
              </select>
            </div>
            {editEstado === 'completada' && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Precio Final a Cobrar ($)</label>
                <input 
                  type="number" 
                  value={editPrecio} 
                  onChange={e => setEditPrecio(e.target.value)} 
                  required 
                  className="w-full bg-gray-900 border border-gray-800 text-white p-2 rounded-xl text-sm outline-none"
                  placeholder="Ej: 150.00"
                />
              </div>
            )}
            <div className="pt-4 flex justify-end gap-3">
              <button type="button" onClick={() => setModalCitaOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold bg-gray-800 text-white hover:bg-gray-700">Cancelar</button>
              <button type="submit" className="px-4 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover">Guardar Cambios</button>
            </div>
          </form>
        </div>
      </div>
    )}

    </div>
  );
}
