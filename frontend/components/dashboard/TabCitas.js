'use client';

import { useState, useEffect } from 'react';
import { Calendar, List, Clock, Video, Phone, User, CheckCircle2, AlertCircle, Plus, ChevronLeft, ChevronRight, UserCircle, X } from 'lucide-react';
import Swal from 'sweetalert2';
import CloseModalButton from '../ui/CloseModalButton.js';
import { api } from '../../lib/api';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import EstadoBadge from '../ui/EstadoBadge';

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
        <div key={slot.hora} className="flex gap-4 p-4 rounded-xl border border-gray-700/50 border-dashed bg-dark-card/20 hover:border-primary/50 hover:bg-primary/5 transition-colors cursor-pointer group" onClick={() => handleNuevaReserva(slot.hora)}>
          <div className="w-16 font-mono text-gray-500 font-bold mt-0.5 group-hover:text-primary">{slot.hora}</div>
          <div className="flex-1 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">Slot Disponible</span>
            <Button variant="ghost" size="sm" className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
              + AGENDAR
            </Button>
          </div>
        </div>
      );
    }
    
    if (slot.estado === 'bloqueado') {
      return (
        <div key={slot.hora} className="flex gap-4 p-4 rounded-xl border border-gray-800 bg-gray-900/50 opacity-60">
          <div className="w-16 font-mono text-gray-600 font-bold mt-0.5">{slot.hora}</div>
          <div className="flex-1 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-500 font-medium">Bloqueado: {slot.notas}</span>
          </div>
        </div>
      );
    }

    // Ocupado (Cita)
    return (
      <div key={slot.hora} className="flex gap-4 p-4 rounded-xl border border-gray-700/60 bg-dark-card/60 shadow-sm hover:border-gray-500/50 transition-colors">
        <div className="w-16 font-mono text-white font-bold mt-0.5">{slot.hora}</div>
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1.5 mb-2">
              <span className="text-sm font-bold text-white">{slot.cliente}</span>
              <div className="flex items-center gap-2">
                {renderIconoTipo(slot.tipo)}
                <span className="text-[10px] font-medium text-gray-400">{slot.tipo}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <EstadoBadge estado={slot.citaOriginal.estado} />
              <Button 
                variant="outline" size="sm" 
                onClick={() => { 
                  setCitaDetalle(slot.citaOriginal); 
                  setEditEstado(slot.citaOriginal.estado); 
                  setEditPrecio(slot.citaOriginal.precio_final || ''); 
                  setModalCitaOpen(true); 
                }} 
                className="text-[10px] h-6 py-0 px-2 font-bold"
              >
                Editar
              </Button>
            </div>
          </div>
          
          {slot.citaOriginal?.detalles_reserva && Object.keys(slot.citaOriginal.detalles_reserva).length > 0 && (
            <div className="mt-3 text-[10px] bg-gray-900/50 p-2.5 rounded-lg border border-gray-800/50 grid grid-cols-2 gap-2">
              {Object.entries(slot.citaOriginal.detalles_reserva).map(([key, value]) => (
                <div key={key}><span className="text-gray-500 uppercase tracking-wide">{key.replace(/_/g, ' ')}:</span> <span className="text-gray-300 font-medium">{value}</span></div>
              ))}
            </div>
          )}
          {slot.citaOriginal?.imagenes && slot.citaOriginal.imagenes.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {slot.citaOriginal.imagenes.map((img, idx) => (
                <a key={idx} href={img} target="_blank" rel="noreferrer" className="shrink-0">
                  <img src={img} alt="Ref" className="w-12 h-12 object-cover rounded-md shadow-sm border border-gray-700 hover:scale-105 transition-transform" />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const citasHoy = citasReal.length;
  const confirmadas = citasReal.filter(c => c.estado === 'confirmada' || c.estado === 'completada').length;
  const pendientes = citasReal.filter(c => c.estado === 'pendiente' || c.estado === 'evaluacion_en_curso').length;
  const canceladas = citasReal.filter(c => c.estado === 'cancelada').length;

  return (
    <div className="space-y-6">
      
      <PageHeader 
        title="Agenda y Citas"
        description="Organiza reservas, confirmaciones y atención diaria."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-900/50 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setVista('slots')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${vista === 'slots' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <Clock className="w-4 h-4" /> Motor de Reservas
              </button>
              <button
                onClick={() => setVista('lista')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${vista === 'lista' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" /> Todas las citas
              </button>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => handleNuevaReserva()}>
              Nueva reserva
            </Button>
          </div>
        }
      />

      {/* Métricas superiores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Citas hoy</CardTitle>
            <Calendar className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{citasHoy}</div>
            <p className="text-xs text-gray-500 mt-1">Total del día</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Confirmadas</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{confirmadas}</div>
            <p className="text-xs text-gray-500 mt-1">Aseguradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Pendientes</CardTitle>
            <Clock className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pendientes}</div>
            <p className="text-xs text-gray-500 mt-1">Requieren atención</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Canceladas</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-400/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{canceladas}</div>
            <p className="text-xs text-gray-500 mt-1">Rechazadas</p>
          </CardContent>
        </Card>
      </div>

      {/* VISTA SLOTS (Motor de Reservas para Expertos) */}
      {vista === 'slots' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Grilla de Disponibilidad (Agenda) */}
          <div className="lg:col-span-3">
            <Card className="flex flex-col overflow-hidden h-full">
              <CardHeader className="bg-gray-900/30 border-b border-gray-800 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <CardTitle>Agenda del día</CardTitle>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                        const d = new Date(fechaFiltro);
                        d.setDate(d.getDate() - 1);
                        setFechaFiltro(d.toISOString().split('T')[0]);
                      }} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"><ChevronLeft className="w-4 h-4" />
                    </button>
                    <input type="date" className="bg-gray-950 border border-gray-700 text-gray-300 text-xs px-3 py-1.5 rounded-lg outline-none font-semibold" value={fechaFiltro} onChange={e => setFechaFiltro(e.target.value)} />
                    <button onClick={() => {
                        const d = new Date(fechaFiltro);
                        d.setDate(d.getDate() + 1);
                        setFechaFiltro(d.toISOString().split('T')[0]);
                      }} className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"><ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar bg-dark-card/10">
                  {timeSlots.map(renderSlot)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Panel Lateral: Selector de Experto y Resumen */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Experto a consultar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expertos.map(exp => (
                  <button 
                    key={exp._id}
                    onClick={() => setExpertoActivo(exp._id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      expertoActivo === exp._id ? 'bg-primary/10 border-primary shadow-sm shadow-primary/20 text-white' : 'bg-gray-900/50 border-gray-800 text-gray-400 hover:bg-gray-800'
                    }`}
                  >
                    <UserCircle className={`w-5 h-5 ${expertoActivo === exp._id ? 'text-primary' : 'text-gray-500'}`} />
                    <span className="text-xs font-bold">{exp.nombre}</span>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Resumen del día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-gray-400 font-medium">Confirmadas</span>
                      <span className="text-gray-400 font-mono">{confirmadas}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${citasHoy > 0 ? (confirmadas/citasHoy)*100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-gray-400 font-medium">Pendientes</span>
                      <span className="text-gray-400 font-mono">{pendientes}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-yellow-500 h-1.5 rounded-full transition-all" style={{ width: `${citasHoy > 0 ? (pendientes/citasHoy)*100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1 text-xs">
                      <span className="text-gray-400 font-medium">Canceladas</span>
                      <span className="text-gray-400 font-mono">{canceladas}</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${citasHoy > 0 ? (canceladas/citasHoy)*100 : 0}%` }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
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
            <CloseModalButton onClick={() => setModalCitaOpen(false)} />
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
