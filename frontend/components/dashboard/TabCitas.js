'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import EstadoBadge from '../ui/EstadoBadge.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Calendar, List, LayoutGrid, Plus, CalendarRange, Trash2, Edit3, Check, Play, XCircle } from 'lucide-react';

export default function TabCitas() {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vista, setVista] = useState('lista'); // 'lista' | 'kanban' | 'agenda'
  const [fechaFiltro, setFechaFiltro] = useState(new Date().toISOString().split('T')[0]);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [creando, setCreando] = useState(false);
  const [servicios, setServicios] = useState([]);
  
  // Form states
  const [telefono, setTelefono] = useState('');
  const [nombre, setNombre] = useState('');
  const [servicio, setServicio] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('09:00');
  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [anio, setAnio] = useState('');
  const [patente, setPatente] = useState('');
  const [desc, setDesc] = useState('');
  const [precio, setPrecio] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    cargarCitas();
  }, [fechaFiltro]);

  useEffect(() => {
    if (modalOpen) {
      cargarServicios();
    }
  }, [modalOpen]);

  const cargarCitas = async () => {
    setLoading(true);
    try {
      // Si estamos en vista agenda, filtramos por la fecha seleccionada
      const queryFecha = vista === 'agenda' ? fechaFiltro : '';
      const res = await api.getCitas(queryFecha);
      if (res && res.citas) {
        setCitas(res.citas);
      }
    } catch (err) {
      console.error('Error al cargar citas:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarServicios = async () => {
    try {
      const res = await api.getServicios();
      if (res) {
        setServicios(res);
        if (res.length > 0 && !servicio) setServicio(res[0].nombre);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleCrearCita = async (e) => {
    e.preventDefault();
    setError('');
    setCreando(true);

    try {
      const isoFechaStr = `${fecha}T${hora}:00`;
      
      const payload = {
        numero_telefono: telefono,
        nombre_cliente: nombre,
        servicio,
        fecha_cita: isoFechaStr,
        vehiculo: {
          marca,
          modelo,
          anio: anio ? parseInt(anio) : null,
          patente
        },
        descripcion_trabajo: desc,
        precio_estimado: precio ? parseFloat(precio) : 0
      };

      await api.crearCita(payload);
      setModalOpen(false);
      
      // Limpiar formulario
      setTelefono('');
      setNombre('');
      setMarca('');
      setModelo('');
      setAnio('');
      setPatente('');
      setDesc('');
      setPrecio('');
      
      cargarCitas();
    } catch (err) {
      setError(err.message || 'Error al guardar cita');
    } finally {
      setCreando(false);
    }
  };

  const handleCambiarEstado = async (id, nuevoEstado, precioFinal = null) => {
    try {
      const payload = { estado: nuevoEstado };
      if (precioFinal !== null) payload.precio_final = precioFinal;
      await api.actualizarCita(id, payload);
      cargarCitas();
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  const handleEliminarCita = async (id) => {
    if (!confirm('¿Estás seguro de eliminar esta cita?')) return;
    try {
      await api.eliminarCita(id);
      cargarCitas();
    } catch (error) {
      alert('Solo los administradores pueden borrar citas.');
    }
  };

  // Agrupamiento por estados para la vista Kanban
  const kanbanColumnas = {
    pendiente: citas.filter(c => c.estado === 'pendiente'),
    confirmada: citas.filter(c => c.estado === 'confirmada'),
    en_proceso: citas.filter(c => c.estado === 'en_proceso'),
    completada: citas.filter(c => c.estado === 'completada'),
    cancelada: citas.filter(c => c.estado === 'cancelada')
  };

  // Horarios de la agenda diaria (08:00 a 18:00)
  const horasAgenda = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtros y Vistas */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#111827]/40 p-4 rounded-2xl border border-gray-800">
        
        {/* Toggle de Vistas */}
        <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => { setVista('lista'); cargarCitas(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === 'lista' ? 'bg-[#2908F1] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4" /> Lista
          </button>
          <button
            onClick={() => { setVista('kanban'); cargarCitas(); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === 'kanban' ? 'bg-[#2908F1] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Kanban
          </button>
          <button
            onClick={() => { setVista('agenda'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              vista === 'agenda' ? 'bg-[#2908F1] text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <CalendarRange className="w-4 h-4" /> Agenda Diaria
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          {vista === 'agenda' && (
            <input
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              className="bg-gray-950 border border-gray-800 text-white text-xs font-semibold px-3 py-2 rounded-xl outline-none focus:border-[#2908F1] transition-colors"
            />
          )}

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#2908F1] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-[#2908F1]/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> AGENDAR CITA
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* VISTA 1: LISTA */}
          {vista === 'lista' && (
            <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-950/20">
              {citas.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-500">No hay citas registradas en el sistema.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-850 text-left text-xs">
                  <thead className="bg-[#111827]/40 text-gray-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Cliente / Celular</th>
                      <th className="px-6 py-4">Vehículo</th>
                      <th className="px-6 py-4">Servicio / Descripción</th>
                      <th className="px-6 py-4">Fecha / Hora</th>
                      <th className="px-6 py-4">Estado</th>
                      <th className="px-6 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-850/60 text-gray-300 font-light">
                    {citas.map((c) => {
                      const fechaCita = new Date(c.fecha_cita);
                      return (
                        <tr key={c._id} className="hover:bg-gray-900/10">
                          <td className="px-6 py-4">
                            <span className="block font-bold text-white text-sm">{c.nombre_cliente}</span>
                            <span className="text-gray-500">{c.numero_telefono}</span>
                          </td>
                          <td className="px-6 py-4">
                            {c.vehiculo?.marca ? (
                              <>
                                <span className="block text-white font-medium">{c.vehiculo.marca} {c.vehiculo.modelo}</span>
                                <span className="text-[10px] bg-gray-900 px-1.5 py-0.5 rounded text-gray-450 border border-gray-800 uppercase">{c.vehiculo.patente || 'S/P'}</span>
                              </>
                            ) : (
                              <span className="text-gray-500">—</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="block font-semibold text-blue-400">{c.servicio}</span>
                            <span className="text-gray-500 block max-w-xs truncate">{c.descripcion_trabajo || 'Sin notas'}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="block text-white font-semibold">
                              {fechaCita.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </span>
                            <span className="text-gray-500">
                              {String(fechaCita.getHours()).padStart(2, '0')}:{String(fechaCita.getMinutes()).padStart(2, '0')}hs
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <EstadoBadge estado={c.estado} />
                          </td>
                          <td className="px-6 py-4 text-right space-x-1.5">
                            {c.estado === 'pendiente' && (
                              <button 
                                onClick={() => handleCambiarEstado(c._id, 'confirmada')}
                                title="Confirmar"
                                className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.estado === 'confirmada' && (
                              <button 
                                onClick={() => handleCambiarEstado(c._id, 'en_proceso')}
                                title="Iniciar trabajo"
                                className="p-1.5 rounded-lg bg-[#2908F1]/10 text-blue-400 border border-[#2908F1]/20 hover:bg-[#2908F1] hover:text-white transition-all cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.estado === 'en_proceso' && (
                              <button 
                                onClick={() => {
                                  const pf = prompt('Ingresa el precio final de la orden:', c.precio_estimado);
                                  if (pf !== null) {
                                    handleCambiarEstado(c._id, 'completada', parseFloat(pf));
                                  }
                                }}
                                title="Completar y cobrar"
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white transition-all cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {c.estado !== 'cancelada' && c.estado !== 'completada' && (
                              <button 
                                onClick={() => handleCambiarEstado(c._id, 'cancelada')}
                                title="Cancelar cita"
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleEliminarCita(c._id)}
                              title="Eliminar registro"
                              className="p-1.5 rounded-lg bg-gray-900 text-gray-500 hover:bg-red-650 hover:text-white transition-all cursor-pointer border border-gray-800 hover:border-red-650"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* VISTA 2: KANBAN */}
          {vista === 'kanban' && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.keys(kanbanColumnas).map((colName) => (
                <div key={colName} className="p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300">
                      {colName === 'en_proceso' ? 'En Proceso' : colName}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-gray-900 border border-gray-800 text-[10px] text-gray-400 font-semibold">
                      {kanbanColumnas[colName].length}
                    </span>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto">
                    {kanbanColumnas[colName].map(c => {
                      const fechaCita = new Date(c.fecha_cita);
                      return (
                        <div key={c._id} className="p-3.5 rounded-xl bg-gray-900 border border-gray-850 hover:border-gray-700 transition-all flex flex-col justify-between gap-3">
                          <div>
                            <span className="block text-xs font-bold text-white">{c.nombre_cliente}</span>
                            <span className="block text-[10px] text-gray-500">{c.vehiculo?.marca || ''} {c.vehiculo?.modelo || ''}</span>
                            <span className="block text-xs text-blue-400 font-semibold mt-1">{c.servicio}</span>
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-gray-850">
                            <span>{String(fechaCita.getHours()).padStart(2, '0')}:{String(fechaCita.getMinutes()).padStart(2, '0')} hs</span>
                            <div className="flex gap-1">
                              {colName === 'pendiente' && (
                                <button onClick={() => handleCambiarEstado(c._id, 'confirmada')} className="p-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white cursor-pointer">
                                  ✓
                                </button>
                              )}
                              {colName === 'confirmada' && (
                                <button onClick={() => handleCambiarEstado(c._id, 'en_proceso')} className="p-1 rounded bg-[#2908F1]/10 text-blue-400 border border-[#2908F1]/20 hover:bg-[#2908F1] hover:text-white cursor-pointer">
                                  ▶
                                </button>
                              )}
                              {colName === 'en_proceso' && (
                                <button onClick={() => {
                                  const pf = prompt('Precio final:', c.precio_estimado);
                                  if (pf !== null) handleCambiarEstado(c._id, 'completada', parseFloat(pf));
                                }} className="p-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500 hover:text-white cursor-pointer">
                                  ✓
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VISTA 3: AGENDA DIARIA */}
          {vista === 'agenda' && (
            <div className="border border-gray-850 rounded-2xl overflow-hidden bg-gray-950/20">
              <div className="grid grid-cols-1 divide-y divide-gray-850">
                {horasAgenda.map((hr) => {
                  // Buscar si hay citas agendadas en esta hora específica
                  const citasEnHora = citas.filter(c => {
                    const d = new Date(c.fecha_cita);
                    const hStr = `${String(d.getHours()).padStart(2, '0')}:00`;
                    return hStr === hr;
                  });

                  return (
                    <div key={hr} className="flex min-h-[80px]">
                      <div className="w-20 p-4 border-r border-gray-850 flex items-center justify-center bg-[#111827]/10 font-bold text-xs text-gray-400">
                        {hr}
                      </div>
                      <div className="flex-1 p-3 flex gap-3 overflow-x-auto">
                        {citasEnHora.length === 0 ? (
                          <div className="flex items-center text-xs text-gray-600 font-light pl-3">Slot Disponible</div>
                        ) : (
                          citasEnHora.map(c => (
                            <div key={c._id} className="min-w-[220px] max-w-[280px] p-3 rounded-xl bg-gray-900 border border-gray-850 flex flex-col justify-between text-xs">
                              <div>
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-bold text-white block truncate">{c.nombre_cliente}</span>
                                  <EstadoBadge estado={c.estado} />
                                </div>
                                <span className="text-[10px] text-gray-500 block">{c.vehiculo?.marca || ''} {c.vehiculo?.modelo || ''}</span>
                                <span className="font-semibold text-blue-400 block mt-1">{c.servicio}</span>
                              </div>
                              <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-gray-850 mt-2">
                                <span>Estimado: S/. {c.precio_estimado}</span>
                                <button 
                                  onClick={() => handleEliminarCita(c._id)}
                                  className="text-gray-500 hover:text-red-500"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* MODAL DE NUEVA CITA */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-[#0d1222] border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">Agendar Nueva Cita</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleCrearCita} className="space-y-4">
              
              {/* Sección Cliente */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Celular del Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="51999888777"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#2908F1] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Juan Perez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#2908F1] outline-none"
                  />
                </div>
              </div>

              {/* Sección Vehículo */}
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-850 space-y-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Detalles del Vehículo</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      placeholder="Marca (ej: Ford)"
                      value={marca}
                      onChange={(e) => setMarca(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Modelo (ej: Focus)"
                      value={modelo}
                      onChange={(e) => setModelo(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="Año (ej: 2018)"
                      value={anio}
                      onChange={(e) => setAnio(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="Patente (ej: AA123BB)"
                      value={patente}
                      onChange={(e) => setPatente(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Sección Turno */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Servicio *</label>
                  <select
                    value={servicio}
                    onChange={(e) => setServicio(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    {servicios.map(s => (
                      <option key={s._id} value={s.nombre}>{s.nombre} (S/. {s.precio_base})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Precio Est. (S/.)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Fecha de Cita *</label>
                  <input
                    type="date"
                    required
                    value={fecha}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Hora *</label>
                  <select
                    value={hora}
                    onChange={(e) => setHora(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                  >
                    {horasAgenda.map(h => (
                      <option key={h} value={h}>{h} hs</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Descripción del Trabajo</label>
                <textarea
                  placeholder="Detalles sobre lo que le pasa al auto o indicaciones adicionales..."
                  rows="3"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-[#2908F1]"
                />
              </div>

              <div className="pt-4 border-t border-gray-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[#2908F1] text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {creando ? 'Agendando...' : 'Confirmar Cita'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
