'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Search, User, Car, Plus, Trash2, Calendar, Clipboard, Filter, Wrench, Check, MessageCircle } from 'lucide-react';
import EstadoBadge from '../ui/EstadoBadge.js';
import Swal from 'sweetalert2';

export default function TabClientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Filtros UI
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroDni, setFiltroDni] = useState('todos');
  const [filtroOrden, setFiltroOrden] = useState('recientes');
  
  // Detalle Modal
  const [clienteDetalle, setClienteDetalle] = useState(null);
  const [citasHistorial, setCitasHistorial] = useState([]);
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  
  // Editar Modal
  const [modalEditOpen, setModalEditOpen] = useState(false);
  const [editId, setEditId] = useState('');
  const [editNombre, setEditNombre] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editVehiculos, setEditVehiculos] = useState([]);
  const [editNotas, setEditNotas] = useState('');
  const [errorEdit, setErrorEdit] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Vehículo temp form
  const [vMarca, setVMarca] = useState('');
  const [vModelo, setVModelo] = useState('');
  const [vAnio, setVAnio] = useState('');
  const [vPatente, setVPatente] = useState('');

  useEffect(() => {
    cargarClientes();
  }, [busqueda, pagina]);

  const cargarClientes = async () => {
    setLoading(true);
    try {
      const res = await api.getClientes(busqueda, pagina, 15);
      if (res && res.clientes) {
        setClientes(res.clientes);
        setTotal(res.total);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrado local básico para el Mockup
  const clientesFiltrados = clientes.filter(c => {
    if (filtroTipo === 'con_vehiculo' && (!c.vehiculos || c.vehiculos.length === 0)) return false;
    if (filtroTipo === 'sin_vehiculo' && (c.vehiculos && c.vehiculos.length > 0)) return false;
    if (filtroDni === 'con_dni' && !c.dni) return false;
    if (filtroDni === 'sin_dni' && c.dni) return false;
    return true;
  }).sort((a, b) => {
    if (filtroOrden === 'citas') return (b.total_citas || 0) - (a.total_citas || 0);
    if (filtroOrden === 'alfabetico') return (a.nombre || '').localeCompare(b.nombre || '');
    return 0; // 'recientes' (default by API)
  });

  const handleVerDetalle = async (id) => {
    try {
      const res = await api.getClienteDetalle(id);
      if (res) {
        setClienteDetalle(res.cliente);
        setCitasHistorial(res.citas || []);
        setModalDetalleOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    }
  };

  const handleOpenEdit = (cliente) => {
    setEditId(cliente._id);
    setEditNombre(cliente.nombre || '');
    setEditDni(cliente.dni || '');
    setEditTelefono(cliente.numero_telefono || '');
    setEditEmail(cliente.email || '');
    setEditVehiculos([...(cliente.vehiculos || [])]);
    setEditNotas(cliente.notas || '');
    setErrorEdit('');
    setModalEditOpen(true);
  };

  const handleAddVehiculoEdit = () => {
    if (!vMarca || !vModelo) return;
    setEditVehiculos(prev => [...prev, {
      marca: vMarca,
      modelo: vModelo,
      anio: vAnio ? parseInt(vAnio) : null,
      patente: vPatente.toUpperCase()
    }]);
    setVMarca('');
    setVModelo('');
    setVAnio('');
    setVPatente('');
  };

  const handleRemoveVehiculoEdit = (idx) => {
    setEditVehiculos(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGuardarCliente = async (e) => {
    e.preventDefault();
    setErrorEdit('');
    setGuardando(true);

    try {
      const payload = {
        nombre: editNombre,
        dni: editDni,
        numero_telefono: editTelefono,
        email: editEmail,
        vehiculos: editVehiculos,
        notas: editNotas
      };

      await api.actualizarCliente(editId, payload);
      setModalEditOpen(false);
      cargarClientes();
      if (clienteDetalle && clienteDetalle._id === editId) {
        handleVerDetalle(editId); // Recargar panel de detalles si estaba abierto
      }
    } catch (err) {
      setErrorEdit(err.message || 'Error al guardar cambios');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarCliente = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar cliente?',
      text: '¿Seguro que quieres eliminar este cliente? Se borrarán también todas sus citas asociadas.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#111827',
      color: '#fff'
    });
    if (!result.isConfirmed) return;
    try {
      await api.eliminarCliente(id);
      setModalDetalleOpen(false);
      cargarClientes();
    } catch (err) {
      Swal.fire({
        title: 'Error',
        text: 'Solo los administradores pueden borrar clientes.',
        icon: 'error',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Buscador y Filtros */}
      <div className="flex flex-col gap-4 bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div className="flex justify-between items-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o patente..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
              className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-950 border border-gray-850 text-white placeholder-gray-500 text-xs focus:ring-1 focus:ring-primary outline-none transition-all duration-200"
            />
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total: {clientesFiltrados.length} listados de {total}
          </div>
        </div>
        
        {/* Filtros */}
        <div className="flex gap-3 overflow-x-auto pb-1 custom-scrollbar">
          <select 
            value={filtroTipo} 
            onChange={e => setFiltroTipo(e.target.value)} 
            className="bg-gray-950 border border-gray-850 text-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-primary cursor-pointer"
          >
            <option value="todos">Todos (Leads y Clientes)</option>
            <option value="con_vehiculo">Solo Clientes (Con Vehículo)</option>
            <option value="sin_vehiculo">Solo Leads (Sin Vehículo)</option>
          </select>
          <select 
            value={filtroDni} 
            onChange={e => setFiltroDni(e.target.value)} 
            className="bg-gray-950 border border-gray-850 text-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-primary cursor-pointer"
          >
            <option value="todos">Cualquier Estado DNI</option>
            <option value="con_dni">Con DNI Registrado</option>
            <option value="sin_dni">Sin DNI</option>
          </select>
          <select 
            value={filtroOrden} 
            onChange={e => setFiltroOrden(e.target.value)} 
            className="bg-gray-950 border border-gray-850 text-gray-300 rounded-xl px-3 py-1.5 text-[11px] font-bold outline-none focus:border-primary cursor-pointer"
          >
            <option value="recientes">Más Recientes (Defecto)</option>
            <option value="citas">Mayor Cantidad de Citas</option>
            <option value="alfabetico">Orden Alfabético</option>
          </select>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="overflow-x-auto border border-gray-850 rounded-2xl bg-gray-950/20">
          {clientes.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-500">No se encontraron clientes.</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-850 text-left text-xs">
              <thead className="bg-dark-card/40 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Celular</th>
                  <th className="px-6 py-4">Vehículos</th>
                  <th className="px-6 py-4">Total Citas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/60 text-gray-300 font-light">
                {clientesFiltrados.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-900/10 cursor-pointer" onClick={() => handleVerDetalle(c._id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-450 font-bold">
                          {c.nombre?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <span className="block font-bold text-white text-sm">{c.nombre || 'Cliente Nuevo'}</span>
                          <div className="flex gap-2 text-gray-500 text-[10px]">
                            <span>{c.email || 'Sin correo'}</span>
                            {c.dni && <span>• DNI: {c.dni}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-400">
                      {c.numero_telefono}
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex flex-wrap gap-1.5 max-w-xs">
                        {c.vehiculos && c.vehiculos.map((v, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-300 font-medium">
                            <Car className="w-3 h-3 text-primary/80" /> {v.marca} {v.modelo}
                          </span>
                        ))}
                        {(!c.vehiculos || c.vehiculos.length === 0) && (
                          <span className="text-gray-500">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-400">
                      {c.total_citas}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleVerDetalle(c._id)}
                        className="px-2.5 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800 text-[10px] font-bold cursor-pointer"
                      >
                        Ver Perfil
                      </button>
                      <button
                        onClick={() => handleOpenEdit(c)}
                        className="px-2.5 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary text-[10px] font-bold cursor-pointer"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* MODAL DETALLE DE CLIENTE */}
      {modalDetalleOpen && clienteDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-850 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary text-lg border border-primary/20">
                  {clienteDetalle.nombre?.charAt(0) || 'C'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{clienteDetalle.nombre || 'Cliente Nuevo'}</h3>
                  <p className="text-xs text-gray-500">Registrado el {new Date(clienteDetalle.creado_en).toLocaleDateString('es-ES')}</p>
                </div>
              </div>
              <button 
                onClick={() => setModalDetalleOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              
              {/* Información Personal */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5">Datos Personales</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-500 block mb-0.5">Número Celular</span>
                    <span className="font-semibold text-white font-mono">{clienteDetalle.numero_telefono}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block mb-0.5">DNI</span>
                    <span className="font-semibold text-white font-mono">{clienteDetalle.dni || 'No registrado'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-0.5">Correo Electrónico</span>
                    <span className="font-semibold text-white">{clienteDetalle.email || 'No registrado'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block mb-0.5">Notas / Comentarios Internos</span>
                    <p className="text-gray-400 font-light bg-gray-950 p-3 rounded-xl border border-gray-850">
                      {clienteDetalle.notas || 'No hay notas sobre este cliente.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5">Resumen</h4>
                <div className="p-4 rounded-2xl bg-gray-900 border border-gray-850 text-center">
                  <span className="text-3xl font-black text-primary">{clienteDetalle.total_citas}</span>
                  <span className="block text-[10px] text-gray-400 uppercase font-semibold mt-1">Citas Agendadas</span>
                </div>
              </div>

            </div>

            {/* Listado de Vehículos */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4">Vehículos Vinculados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clienteDetalle.vehiculos && clienteDetalle.vehiculos.map((v, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gray-900/60 border border-gray-850 flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                      <Car className="w-5 h-5" />
                    </div>
                    <div className="text-xs">
                      <span className="block font-bold text-white">{v.marca} {v.modelo}</span>
                      <span className="text-[10px] text-gray-400">Año: {v.anio || 'N/C'} | Patente: <b className="uppercase">{v.patente || 'S/P'}</b></span>
                    </div>
                  </div>
                ))}
                {(!clienteDetalle.vehiculos || clienteDetalle.vehiculos.length === 0) && (
                  <p className="text-xs text-gray-500 col-span-2">Este cliente no posee vehículos registrados.</p>
                )}
              </div>
            </div>

            {/* Historial Clínico y Notificaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Timeline Historial Médico del Vehículo */}
              <div className="lg:col-span-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> Historial Clínico (Reparaciones)
                </h4>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                  
                  {/* Item 1 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-panel bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Check className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-gray-900 border border-gray-850 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white text-xs">Alineamiento y Balanceo</h4>
                        <span className="text-[9px] font-bold text-blue-400">Hace 2 meses</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mb-3">Toyota Yaris (ABC-123) • <span className="font-mono text-gray-500">45,000 km</span></p>
                      
                      <div className="space-y-2 border-t border-gray-800 pt-3">
                        <p className="text-[10px] text-gray-300 font-semibold uppercase">Piezas Cambiadas:</p>
                        <ul className="text-[10px] text-gray-500 list-disc pl-4">
                          <li>Juego de Pastillas Delanteras Bosh</li>
                          <li>Líquido de frenos DOT 4</li>
                        </ul>
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden border border-gray-700">
                           <img src="https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover opacity-70" alt="Antes" />
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden border border-primary/50 relative">
                           <img src="https://images.unsplash.com/photo-1503376713356-2e8ab745131a?auto=format&fit=crop&q=80&w=100" className="w-full h-full object-cover" alt="Después" />
                           <span className="absolute bottom-0 right-0 bg-primary text-[8px] font-bold text-white px-1">OK</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-panel bg-gray-800 text-gray-400 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                      <Clipboard className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-gray-900 border border-gray-850 shadow-sm opacity-60">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-bold text-white text-xs">Mantenimiento Preventivo</h4>
                        <span className="text-[9px] font-bold text-gray-500">Hace 1 año</span>
                      </div>
                      <p className="text-[10px] text-gray-400">Toyota Yaris (ABC-123) • <span className="font-mono text-gray-500">35,000 km</span></p>
                      <p className="text-[10px] text-gray-500 mt-2">Revisión de niveles, cambio de aceite y filtro de aire.</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-yellow-500">Próximo Mantenimiento Recomendado</h5>
                    <p className="text-[10px] text-gray-400 mt-1">El vehículo alcanzará los 55,000 km aprox. en <b>Noviembre 2026</b>. Se sugiere programar Cambio de Faja de Distribución.</p>
                  </div>
                </div>
              </div>

              {/* Registro de Notificaciones WhatsApp */}
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-green-500" /> Historial de Notificaciones
                </h4>
                
                <div className="space-y-3 bg-gray-950 p-4 rounded-2xl border border-gray-850 max-h-[400px] overflow-y-auto">
                  <div className="relative pl-4 border-l border-green-500/30">
                    <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                    <span className="text-[9px] font-bold text-green-500">Hoy, 09:30 AM</span>
                    <p className="text-[10px] text-gray-300 mt-1 font-semibold">Mensaje Entregado (Confirmación Cita)</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 italic">"Hola, tu cita para Alineamiento está confirmada..."</p>
                  </div>
                  
                  <div className="relative pl-4 border-l border-green-500/30">
                    <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-green-500"></span>
                    <span className="text-[9px] font-bold text-green-500">Ayer, 16:45 PM</span>
                    <p className="text-[10px] text-gray-300 mt-1 font-semibold">Respuesta del Cliente</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 italic">"Sí, confirmo la asistencia. Gracias."</p>
                  </div>

                  <div className="relative pl-4 border-l border-red-500/30">
                    <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                    <span className="text-[9px] font-bold text-red-500">Hace 2 meses</span>
                    <p className="text-[10px] text-gray-300 mt-1 font-semibold">Fallo al enviar (Presupuesto Final)</p>
                    <p className="text-[9px] text-gray-500 mt-0.5 italic">Error: El número de WhatsApp no existe o no tiene conexión.</p>
                  </div>

                  <div className="relative pl-4 border-l border-gray-800">
                    <span className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-gray-700"></span>
                    <span className="text-[9px] font-bold text-gray-500">Hace 1 año</span>
                    <p className="text-[10px] text-gray-400 mt-1 font-semibold">Mensaje Entregado (Recordatorio)</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Botones de acción inferior */}
            <div className="pt-6 mt-8 border-t border-gray-850 flex justify-between items-center">
              <button
                onClick={() => handleEliminarCliente(clienteDetalle._id)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 cursor-pointer"
              >
                Eliminar Cliente
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalDetalleOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => { setModalDetalleOpen(false); handleOpenEdit(clienteDetalle); }}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Editar Perfil
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL EDITAR CLIENTE */}
      {modalEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <h3 className="text-lg font-bold text-white">Editar Perfil del Cliente</h3>
              <button 
                onClick={() => setModalEditOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {errorEdit && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 font-semibold">
                {errorEdit}
              </div>
            )}

            <form onSubmit={handleGuardarCliente} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={editTelefono}
                    onChange={(e) => setEditTelefono(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">DNI</label>
                  <input
                    type="text"
                    value={editDni}
                    onChange={(e) => setEditDni(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Notas Internas</label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows="3"
                  placeholder="Observaciones de pago, comportamiento, o detalles del cliente..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Edición de Vehículos */}
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-850 space-y-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Gestionar Vehículos</span>
                
                {/* Listado actual */}
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {editVehiculos.map((v, i) => (
                    <div key={i} className="flex justify-between items-center p-2 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                      <span>🚗 <b>{v.marca} {v.modelo}</b> <span className="text-gray-500">({v.patente || 'S/P'})</span></span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveVehiculoEdit(i)} 
                        className="text-red-500 hover:text-red-400 p-1"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  {editVehiculos.length === 0 && (
                    <p className="text-[10px] text-gray-500 italic">No hay vehículos agregados.</p>
                  )}
                </div>

                {/* Formulario rápido para agregar */}
                <div className="h-px bg-gray-850 my-1" />
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <input
                    type="text"
                    placeholder="Marca"
                    value={vMarca}
                    onChange={(e) => setVMarca(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Modelo"
                    value={vModelo}
                    onChange={(e) => setVModelo(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Año"
                    value={vAnio}
                    onChange={(e) => setVAnio(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Patente"
                    value={vPatente}
                    onChange={(e) => setVPatente(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-white px-2.5 py-1.5 rounded-lg outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddVehiculoEdit}
                  className="w-full py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary hover:text-white transition-all cursor-pointer"
                >
                  Agregar Vehículo
                </button>
              </div>

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
