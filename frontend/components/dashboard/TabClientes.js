'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Search, User, Car, Plus, Trash2, Calendar, Clipboard, Filter, Wrench, Check, MessageCircle, ImagePlus, ChevronLeft, ChevronRight } from 'lucide-react';
import EstadoBadge from '../ui/EstadoBadge.js';
import Swal from 'sweetalert2';

const formatRelativeTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMins < 1) return 'Hace un momento';
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
  if (diffDays < 30) return `Hace ${diffDays} ${diffDays === 1 ? 'día' : 'días'}`;
  if (diffMonths < 12) return `Hace ${diffMonths} ${diffMonths === 1 ? 'mes' : 'meses'}`;
  return `Hace ${diffYears} ${diffYears === 1 ? 'año' : 'años'}`;
};

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
  const [editTotalGastado, setEditTotalGastado] = useState(0);
  const [editDeudaActual, setEditDeudaActual] = useState(0);
  const [errorEdit, setErrorEdit] = useState('');
  const [guardando, setGuardando] = useState(false);

  // Detalles Adicionales temp form
  const [vMarca, setVMarca] = useState('');
  const [vModelo, setVModelo] = useState('');
  const [vAnio, setVAnio] = useState('');
  const [vPatente, setVPatente] = useState('');

  // Historial Clínico & Mantenimiento states
  const [mensajesHistorial, setMensajesHistorial] = useState([]);
  const [reparacionVehiculoActivo, setReparacionVehiculoActivo] = useState(null);
  const [modalRepairDetail, setModalRepairDetail] = useState(null);
  
  const [modalReparacionOpen, setModalReparacionOpen] = useState(false);
  const [repTitulo, setRepTitulo] = useState('');
  const [repKilometraje, setRepKilometraje] = useState('');
  const [repPiezas, setRepPiezas] = useState('');
  const [repImagenAntes, setRepImagenAntes] = useState('');
  const [repImagenDespues, setRepImagenDespues] = useState('');
  const [repComentarios, setRepComentarios] = useState('');
  const [repEstado, setRepEstado] = useState('OK');

  const [modalMantenimientoOpen, setModalMantenimientoOpen] = useState(false);
  const [mantKilometraje, setMantKilometraje] = useState('');
  const [mantFechaEstimada, setMantFechaEstimada] = useState('');
  const [mantSugerencia, setMantSugerencia] = useState('');

  const [subiendoImg, setSubiendoImg] = useState(false);

  const handleUploadImage = async (clienteId, patente, file) => {
    if (!file) return;
    setSubiendoImg(true);
    const formData = new FormData();
    formData.append('imagen', file);
    formData.append('descripcion', 'Imagen subida desde Admin Dashboard');
    
    try {
      const url = `/api/upload/vehiculo/${clienteId}/${patente}`;
      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al subir');
      }
      handleVerDetalle(clienteId);
      Swal.fire({
        icon: 'success',
        title: 'Imagen vinculada',
        background: '#111827', color: '#fff', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        background: '#111827', color: '#fff'
      });
    } finally {
      setSubiendoImg(false);
    }
  };

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
        
        // Cargar historial de notificaciones (mensajes de WhatsApp)
        try {
          const resMsgs = await api.getMensajes(res.cliente.numero_telefono);
          if (resMsgs && resMsgs.mensajes) {
            setMensajesHistorial(resMsgs.mensajes);
          } else {
            setMensajesHistorial([]);
          }
        } catch (msgErr) {
          console.error('Error al cargar mensajes:', msgErr);
          setMensajesHistorial([]);
        }
        
        setModalDetalleOpen(true);
      }
    } catch (error) {
      console.error('Error al cargar detalle:', error);
    }
  };

  const handleOpenReparacion = (vehiculo) => {
    setReparacionVehiculoActivo(vehiculo);
    setRepTitulo('');
    setRepKilometraje('');
    setRepPiezas('');
    setRepImagenAntes('');
    setRepImagenDespues('');
    setRepComentarios('');
    setRepEstado('OK');
    setModalReparacionOpen(true);
  };

  const handleOpenMantenimiento = (vehiculo) => {
    setReparacionVehiculoActivo(vehiculo);
    setMantKilometraje(vehiculo.proximo_mantenimiento?.kilometraje || '');
    setMantFechaEstimada(vehiculo.proximo_mantenimiento?.fecha_estimada || '');
    setMantSugerencia(vehiculo.proximo_mantenimiento?.sugerencia || '');
    setModalMantenimientoOpen(true);
  };

  const handleSubirImagenReparacion = async (tipo, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('imagen', file);
    try {
      const res = await fetch('/api/upload/general', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });
      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      if (tipo === 'antes') {
        setRepImagenAntes(data.imageUrl);
      } else {
        setRepImagenDespues(data.imageUrl);
      }
      Swal.fire({
        icon: 'success',
        title: 'Imagen subida',
        background: '#111827', color: '#fff', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        background: '#111827', color: '#fff'
      });
    }
  };

  const handleGuardarReparacion = async (e) => {
    e.preventDefault();
    if (!repTitulo) return;
    try {
      const piezasArray = repPiezas.split(',').map(p => p.trim()).filter(p => p);
      await api.agregarReparacion(clienteDetalle._id, reparacionVehiculoActivo.patente, {
        titulo: repTitulo,
        kilometraje: repKilometraje ? Number(repKilometraje) : undefined,
        piezas_cambiadas: piezasArray,
        imagen_antes: repImagenAntes,
        imagen_despues: repImagenDespues,
        comentarios: repComentarios,
        estado: repEstado
      });
      setModalReparacionOpen(false);
      handleVerDetalle(clienteDetalle._id);
      Swal.fire({
        icon: 'success',
        title: 'Reparación guardada',
        background: '#111827', color: '#fff', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        background: '#111827', color: '#fff'
      });
    }
  };

  const handleGuardarMantenimiento = async (e) => {
    e.preventDefault();
    try {
      await api.actualizarMantenimiento(clienteDetalle._id, reparacionVehiculoActivo.patente, {
        kilometraje: mantKilometraje ? Number(mantKilometraje) : undefined,
        fecha_estimada: mantFechaEstimada,
        sugerencia: mantSugerencia
      });
      setModalMantenimientoOpen(false);
      handleVerDetalle(clienteDetalle._id);
      Swal.fire({
        icon: 'success',
        title: 'Mantenimiento actualizado',
        background: '#111827', color: '#fff', toast: true, position: 'top-end', timer: 3000, showConfirmButton: false
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message,
        background: '#111827', color: '#fff'
      });
    }
  };

  const handleOpenEdit = async (cliente) => {
    try {
      // Fetch latest client data from the API to avoid editing stale cached data
      const res = await api.getClienteDetalle(cliente._id);
      const latestCliente = res ? res.cliente : cliente;

      setEditId(latestCliente._id);
      setEditNombre(latestCliente.nombre || '');
      setEditDni(latestCliente.dni || '');
      setEditTelefono(latestCliente.numero_telefono || '');
      setEditEmail(latestCliente.email || '');
      
      // Normalize plates to uppercase for consistent validation
      const vehiculosNormalizados = (latestCliente.vehiculos || []).map(v => ({
        ...v,
        patente: v.patente?.trim().toUpperCase() || ''
      }));
      setEditVehiculos(vehiculosNormalizados);
      
      setEditNotas(latestCliente.notas || '');
      setEditTotalGastado(latestCliente.total_gastado || 0);
      setEditDeudaActual(latestCliente.deuda_actual || 0);
      setErrorEdit('');
      setModalEditOpen(true);
    } catch (err) {
      console.error("Error al cargar detalles del cliente para editar:", err);
      // Fallback a los datos locales si falla el fetch
      setEditId(cliente._id);
      setEditNombre(cliente.nombre || '');
      setEditDni(cliente.dni || '');
      setEditTelefono(cliente.numero_telefono || '');
      setEditEmail(cliente.email || '');
      
      const vehiculosNormalizados = (cliente.vehiculos || []).map(v => ({
        ...v,
        patente: v.patente?.trim().toUpperCase() || ''
      }));
      setEditVehiculos(vehiculosNormalizados);
      
      setEditNotas(cliente.notas || '');
      setEditTotalGastado(cliente.total_gastado || 0);
      setEditDeudaActual(cliente.deuda_actual || 0);
      setErrorEdit('');
      setModalEditOpen(true);
    }
  };

  const handleAddVehiculoEdit = () => {
    if (!vMarca || !vModelo) return;
    
    const patenteLimpia = vPatente.trim().toUpperCase();
    if (patenteLimpia) {
      const patenteDuplicada = editVehiculos.some(v => v.patente?.trim().toUpperCase() === patenteLimpia);
      if (patenteDuplicada) {
        Swal.fire({
          icon: 'error',
          title: 'Placa duplicada',
          text: `La placa "${patenteLimpia}" ya existe en la lista de detalles adicionales de este cliente.`,
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#3b82f6'
        });
        return;
      }
    }

    setEditVehiculos(prev => [...prev, {
      marca: vMarca,
      modelo: vModelo,
      anio: vAnio ? parseInt(vAnio) : null,
      patente: patenteLimpia
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
        notes: editNotas
      };

      // Ensure notes key matches schema (notas or notes? Let's check: the schema uses 'notas', payload line 330 previously had 'notas: editNotas')
      // Ah! Payload line 330 had: 'notas: editNotas'. Let me keep 'notas: editNotas' instead of 'notes: editNotas'.
      const actualPayload = {
        nombre: editNombre,
        dni: editDni,
        numero_telefono: editTelefono,
        email: editEmail,
        vehiculos: editVehiculos,
        notas: editNotas,
        total_gastado: Number(editTotalGastado),
        deuda_actual: Number(editDeudaActual)
      };

      await api.actualizarCliente(editId, actualPayload);
      setModalEditOpen(false);
      cargarClientes();
      if (clienteDetalle && clienteDetalle._id === editId) {
        handleVerDetalle(editId); // Recargar panel de detalles si estaba abierto
      }
    } catch (err) {
      setErrorEdit(err.message || 'Error al guardar cambios');
      if (err.status === 409 || err.status === 400) {
        Swal.fire({
          icon: 'error',
          title: 'Error de validación',
          text: err.message,
          background: '#111827',
          color: '#fff',
          confirmButtonColor: '#3b82f6'
        });
      }
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
            <option value="con_vehiculo">Solo Clientes (Con Detalles Adicionales)</option>
            <option value="sin_vehiculo">Solo Leads (Sin Detalles Adicionales)</option>
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
                  <th className="px-6 py-4">Detalles Adicionales</th>
                  <th className="px-6 py-4">Total Gastado</th>
                  <th className="px-6 py-4">Deuda / Crédito</th>
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
                          <div className="flex flex-wrap items-baseline gap-1.5">
                            <span className="font-bold text-white text-sm">{c.nombre || 'Cliente Nuevo'}</span>
                            {c.alias && c.alias.length > 0 && (
                              <span className="text-gray-400 text-[10px] font-normal italic">
                                (asociado a: {c.alias.join(', ')})
                              </span>
                            )}
                          </div>
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
                    <td className="px-6 py-4 font-semibold text-emerald-400 font-mono">
                      S/. {(c.total_gastado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 font-mono">
                      {c.deuda_actual > 0 ? (
                        <span className="text-red-400 font-bold">S/. {c.deuda_actual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                      ) : c.deuda_actual < 0 ? (
                        <span className="text-blue-400 font-bold">S/. {Math.abs(c.deuda_actual).toLocaleString('es-PE', { minimumFractionDigits: 2 })} (Favor)</span>
                      ) : (
                        <span className="text-gray-500">S/. 0.00</span>
                      )}
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
          
          {/* Control de Pagina */}
          {total > 15 && (
            <div className="flex justify-between items-center p-4 border-t border-gray-850 bg-dark-card/20 text-xs">
              <button
                onClick={() => setPagina(prev => Math.max(prev - 1, 1))}
                disabled={pagina === 1}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1 font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Anterior
              </button>
              <span className="text-gray-400 font-medium">
                Página <span className="text-white font-bold">{pagina}</span> de <span className="text-white font-bold">{Math.ceil(total / 15)}</span>
              </span>
              <button
                onClick={() => setPagina(prev => Math.min(prev + 1, Math.ceil(total / 15)))}
                disabled={pagina >= Math.ceil(total / 15)}
                className="px-3 py-1.5 rounded-lg bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center gap-1 font-semibold"
              >
                Siguiente <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
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
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5">Resumen Financiero</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 rounded-2xl bg-gray-900 border border-gray-850 text-center">
                    <span className="text-2xl font-black text-blue-400">{clienteDetalle.total_citas}</span>
                    <span className="block text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Citas Agendadas</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-900 border border-gray-850 text-center">
                    <span className="text-xl font-black text-emerald-400 font-mono">
                      S/. {(clienteDetalle.total_gastado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Total Gastado</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-gray-900 border border-gray-850 text-center">
                    {clienteDetalle.deuda_actual > 0 ? (
                      <>
                        <span className="text-xl font-black text-red-400 font-mono">
                          S/. {clienteDetalle.deuda_actual.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[9px] text-red-400 uppercase font-semibold mt-0.5">Deuda Pendiente</span>
                      </>
                    ) : clienteDetalle.deuda_actual < 0 ? (
                      <>
                        <span className="text-xl font-black text-blue-400 font-mono">
                          S/. {Math.abs(clienteDetalle.deuda_actual).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[9px] text-blue-400 uppercase font-semibold mt-0.5">Saldo a Favor</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl font-black text-gray-500 font-mono">
                          S/. 0.00
                        </span>
                        <span className="block text-[9px] text-gray-400 uppercase font-semibold mt-0.5">Sin Deudas</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

            </div>

            {/* Listado de Detalles Adicionales */}
            <div className="mb-8">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4">Detalles Adicionales Vinculados</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clienteDetalle.vehiculos && clienteDetalle.vehiculos.map((v, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-gray-900/60 border border-gray-850 flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary border border-primary/20">
                          <Car className="w-5 h-5" />
                        </div>
                        <div className="text-xs">
                          <span className="block font-bold text-white">{v.marca} {v.modelo}</span>
                          <span className="text-[10px] text-gray-400">Año: {v.anio || 'N/C'} | Patente: <b className="uppercase">{v.patente || 'S/P'}</b></span>
                        </div>
                      </div>
                      {/* Botón de subida de imagen */}
                      {v.patente && (
                        <label className={`cursor-pointer p-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ${subiendoImg ? 'opacity-50 pointer-events-none' : ''}`}>
                          <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/webp" 
                            className="hidden" 
                            onChange={(e) => handleUploadImage(clienteDetalle._id, v.patente, e.target.files[0])}
                          />
                          <ImagePlus className="w-4 h-4" />
                        </label>
                      )}
                    </div>

                    {/* Botones de Acción para Historial Clínico & Mantenimiento */}
                    {v.patente && (
                      <div className="flex gap-2 border-t border-gray-800/60 pt-2">
                        <button
                          onClick={() => handleOpenReparacion(v)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 hover:border-primary text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Wrench className="w-3 h-3" /> + Reparación
                        </button>
                        <button
                          onClick={() => handleOpenMantenimiento(v)}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500 text-yellow-500 hover:text-white border border-yellow-500/20 hover:border-yellow-500 text-[10px] font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <Calendar className="w-3 h-3" /> Mantenimiento
                        </button>
                      </div>
                    )}

                    {/* Galería de Imágenes */}
                    {v.historial_imagenes && v.historial_imagenes.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto custom-scrollbar pt-2 border-t border-gray-800">
                        {v.historial_imagenes.map((img, idx) => (
                          <div key={idx} className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-700 relative group">
                            <img src={img.url} alt="Historia clínico" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <a href={img.url} target="_blank" rel="noreferrer" className="text-[8px] text-white">Ver</a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!clienteDetalle.vehiculos || clienteDetalle.vehiculos.length === 0) && (
                  <p className="text-xs text-gray-500 col-span-2">Este cliente no posee detalles adicionales registrados.</p>
                )}
              </div>
            </div>

            {/* Historial Clínico y Notificaciones */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Timeline Historial Médico del Detalles Adicionales */}
              <div className="lg:col-span-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-primary" /> Historial Clínico (Reparaciones)
                </h4>
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-800 before:to-transparent">
                  
                  {(() => {
                    const obtenerTodasLasReparaciones = () => {
                      if (!clienteDetalle || !clienteDetalle.vehiculos) return [];
                      const reps = [];
                      clienteDetalle.vehiculos.forEach(v => {
                        if (v.reparaciones && v.reparaciones.length > 0) {
                          v.reparaciones.forEach(r => {
                            reps.push({
                              ...r,
                              vehiculoMarca: v.marca,
                              vehiculoModelo: v.modelo,
                              vehiculoPatente: v.patente
                            });
                          });
                        }
                      });
                      return reps.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
                    };

                    const todasLasReparaciones = obtenerTodasLasReparaciones();

                    if (todasLasReparaciones.length === 0) {
                      return (
                        <div className="text-center py-8 text-xs text-gray-550 bg-gray-900/20 border border-gray-850 rounded-2xl">
                          No hay reparaciones registradas en el historial clínico.
                        </div>
                      );
                    }

                    return todasLasReparaciones.map((rep, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-dark-panel bg-primary text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {rep.estado === 'OK' ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                        </div>
                        <div 
                          className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl bg-gray-900 border border-gray-850 shadow-sm cursor-zoom-in hover:border-primary/50 transition-all select-none"
                          onDoubleClick={() => setModalRepairDetail(rep)}
                          title="Doble clic para ver detalles y fotos de evaluación/ejecución"
                        >
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-white text-xs">{rep.titulo}</h4>
                            <span className="text-[9px] font-bold text-blue-400">{formatRelativeTime(rep.fecha)}</span>
                          </div>
                          <p className="text-[10px] text-gray-400 mb-3">
                            {rep.vehiculoMarca} {rep.vehiculoModelo} ({rep.vehiculoPatente})
                            {rep.kilometraje ? ` • ` : ''}
                            {rep.kilometraje ? <span className="font-mono text-gray-500">{rep.kilometraje.toLocaleString()} km</span> : ''}
                          </p>
                          
                          {rep.piezas_cambiadas && rep.piezas_cambiadas.length > 0 && (
                            <div className="space-y-2 border-t border-gray-800 pt-3">
                              <p className="text-[10px] text-gray-300 font-semibold uppercase">Piezas Cambiadas:</p>
                              <ul className="text-[10px] text-gray-500 list-disc pl-4">
                                {rep.piezas_cambiadas.map((pieza, pIdx) => (
                                  <li key={pIdx}>{pieza}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {rep.comentarios && (
                            <p className="text-[10px] text-gray-500 mt-2 italic bg-gray-950/40 p-2 rounded border border-gray-850/60">
                              {rep.comentarios}
                            </p>
                          )}

                          {(rep.imagen_antes || rep.imagen_despues) && (
                            <div className="mt-3 flex gap-2">
                              {rep.imagen_antes && (
                                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden border border-gray-700 relative group">
                                  <img src={rep.imagen_antes} className="w-full h-full object-cover opacity-75" alt="Antes" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <a href={rep.imagen_antes} target="_blank" rel="noreferrer" className="text-[8px] text-white">Antes</a>
                                  </div>
                                </div>
                              )}
                              {rep.imagen_despues && (
                                <div className="w-16 h-16 rounded-lg bg-gray-800 overflow-hidden border border-primary/50 relative group">
                                  <img src={rep.imagen_despues} className="w-full h-full object-cover" alt="Después" />
                                  <span className="absolute bottom-0 right-0 bg-primary text-[8px] font-bold text-white px-1 rounded-tl">OK</span>
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <a href={rep.imagen_despues} target="_blank" rel="noreferrer" className="text-[8px] text-white">Después</a>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ));
                  })()}

                </div>

                {/* Próximo Mantenimiento Recomendado */}
                {(() => {
                  const vehiculosConMant = clienteDetalle.vehiculos?.filter(v => v.proximo_mantenimiento && (v.proximo_mantenimiento.kilometraje || v.proximo_mantenimiento.fecha_estimada || v.proximo_mantenimiento.sugerencia)) || [];
                  if (vehiculosConMant.length === 0) return null;
                  
                  return vehiculosConMant.map((v, i) => {
                    const pm = v.proximo_mantenimiento;
                    return (
                      <div key={i} className="mt-4 p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-yellow-500 mt-0.5" />
                        <div>
                          <h5 className="text-xs font-bold text-yellow-500">Próximo Mantenimiento Recomendado ({v.marca} {v.modelo} - {v.patente})</h5>
                          <p className="text-[10px] text-gray-400 mt-1">
                            {pm.kilometraje ? `El detalles adicionales alcanzará los ${pm.kilometraje.toLocaleString()} km aprox.` : ''}
                            {pm.fecha_estimada ? ` en ${pm.fecha_estimada}.` : ''}
                            {pm.sugerencia ? ` Se sugiere programar: ${pm.sugerencia}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Registro de Citas y Notificaciones WhatsApp */}
              <div className="space-y-6">
                
                {/* Historial de Citas */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-400" /> Historial de Citas
                  </h4>
                  <div className="space-y-3 bg-gray-950 p-4 rounded-2xl border border-gray-850 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {citasHistorial && citasHistorial.length > 0 ? (
                      citasHistorial.map((cita, idx) => {
                        const esCancelada = cita.estado === 'cancelada';
                        const esCompletada = cita.estado === 'completada';
                        const esConfirmada = cita.estado === 'confirmada';
                        
                        return (
                          <div key={idx} className={`p-2.5 rounded-xl bg-gray-900 border text-[10px] ${
                            esCancelada ? 'border-red-500/20' : esCompletada ? 'border-emerald-500/20' : 'border-gray-800'
                          }`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-bold text-white">{cita.servicio}</span>
                              <span className={`px-1.5 py-0.5 rounded-[4px] text-[8px] font-bold uppercase tracking-wider ${
                                esCancelada ? 'bg-red-500/10 text-red-500 border border-red-500/25' :
                                esCompletada ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/25' :
                                esConfirmada ? 'bg-blue-500/10 text-blue-400 border border-blue-500/25' :
                                'bg-gray-850 text-gray-400 border border-gray-800'
                              }`}>
                                {cita.estado}
                              </span>
                            </div>
                            <div className="text-gray-400 mt-1 flex flex-col gap-0.5">
                              <span>Fecha: <b className="text-gray-300">{new Date(cita.fecha_cita).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(cita.fecha_cita).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}</b></span>
                              {cita.vehiculo && (cita.vehiculo.marca || cita.vehiculo.modelo) && (
                                <span>Detalles Adicionales: <b className="text-gray-300">{cita.vehiculo.marca} {cita.vehiculo.modelo} ({cita.vehiculo.patente || 'S/P'})</b></span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-gray-550 italic text-center py-4">No hay citas registradas en el historial.</p>
                    )}
                  </div>
                </div>

                {/* Historial de Notificaciones */}
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" /> Historial de Notificaciones
                  </h4>
                  
                  <div className="space-y-3 bg-gray-950 p-4 rounded-2xl border border-gray-850 max-h-[250px] overflow-y-auto custom-scrollbar">
                    {mensajesHistorial && mensajesHistorial.length > 0 ? (
                      [...mensajesHistorial].reverse().map((msg, idx) => {
                        const isError = msg.contenido.startsWith('Error:') || msg.contenido.startsWith('Fallo:');
                        const isCliente = msg.remitente === 'cliente';
                        
                        return (
                          <div key={idx} className={`relative pl-4 border-l ${isError ? 'border-red-500/30' : isCliente ? 'border-green-500/30' : 'border-blue-500/30'}`}>
                            <span className={`absolute -left-[5px] top-1 w-2 h-2 rounded-full ${isError ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : isCliente ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'}`}></span>
                            <span className={`text-[9px] font-bold ${isError ? 'text-red-500' : isCliente ? 'text-green-500' : 'text-blue-500'}`}>
                              {formatRelativeTime(msg.recibido_en)}
                            </span>
                            <p className="text-[10px] text-gray-300 mt-1 font-semibold">
                              {isError ? 'Fallo al enviar' : isCliente ? 'Respuesta del Cliente' : 'Mensaje Entregado (WhatsApp)'}
                            </p>
                            <p className="text-[9px] text-gray-500 mt-0.5 italic">
                              "{msg.contenido}"
                            </p>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-gray-550 italic text-center py-4">No hay notificaciones ni mensajes registrados.</p>
                    )}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Total Gastado (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editTotalGastado}
                    onChange={(e) => setEditTotalGastado(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Deuda / Crédito (S/.)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ej. 100 o -50"
                    value={editDeudaActual}
                    onChange={(e) => setEditDeudaActual(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                  <span className="text-[9px] text-gray-500 mt-1 block">Positivo = Deuda, Negativo = Saldo a Favor.</span>
                </div>
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

              {/* Edición de Detalles Adicionales */}
              <div className="p-4 rounded-2xl bg-gray-950/40 border border-gray-850 space-y-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase">Gestionar Detalles Adicionales</span>
                
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
                    <p className="text-[10px] text-gray-500 italic">No hay detalles adicionales agregados.</p>
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
                  Agregar Detalles Adicionales
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

      {/* MODAL REGISTRAR REPARACION */}
      {modalReparacionOpen && reparacionVehiculoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" /> Registrar Reparación
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Detalles Adicionales: {reparacionVehiculoActivo.marca} {reparacionVehiculoActivo.modelo} ({reparacionVehiculoActivo.patente})
                </p>
              </div>
              <button 
                onClick={() => setModalReparacionOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarReparacion} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Título de la Reparación *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Alineamiento y Balanceo, Cambio de Aceite..."
                  value={repTitulo}
                  onChange={(e) => setRepTitulo(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Kilometraje (km)</label>
                  <input
                    type="number"
                    placeholder="Ej. 45000"
                    value={repKilometraje}
                    onChange={(e) => setRepKilometraje(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Estado de Reparación</label>
                  <select
                    value={repEstado}
                    onChange={(e) => setRepEstado(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                  >
                    <option value="OK">OK (Reparado)</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Piezas Cambiadas (separadas por coma)</label>
                <input
                  type="text"
                  placeholder="Ej. Pastillas de freno, Filtro de aceite, Bujías..."
                  value={repPiezas}
                  onChange={(e) => setRepPiezas(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1 font-semibold">Comentarios / Notas</label>
                <textarea
                  value={repComentarios}
                  onChange={(e) => setRepComentarios(e.target.value)}
                  rows="3"
                  placeholder="Detalles sobre el procedimiento, observaciones técnicas..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Upload general images (antes/despues) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Imagen Antes</label>
                  <div className="flex flex-col gap-2">
                    {repImagenAntes ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-800">
                        <img src={repImagenAntes} className="w-full h-full object-cover" alt="Antes preview" />
                        <button
                          type="button"
                          onClick={() => setRepImagenAntes('')}
                          className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 text-[10px] hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border border-dashed border-gray-800 hover:border-primary/50 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer transition-all">
                        <ImagePlus className="w-5 h-5 text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-500">Subir Antes</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSubirImagenReparacion('antes', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Imagen Después (OK)</label>
                  <div className="flex flex-col gap-2">
                    {repImagenDespues ? (
                      <div className="relative w-full h-24 rounded-xl overflow-hidden border border-gray-850">
                        <img src={repImagenDespues} className="w-full h-full object-cover" alt="Después preview" />
                        <button
                          type="button"
                          onClick={() => setRepImagenDespues('')}
                          className="absolute top-1 right-1 bg-red-500/80 text-white rounded-full p-1 text-[10px] hover:bg-red-600"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 rounded-xl border border-dashed border-gray-800 hover:border-primary/50 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer transition-all">
                        <ImagePlus className="w-5 h-5 text-gray-500 mb-1" />
                        <span className="text-[10px] text-gray-500">Subir Después</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleSubirImagenReparacion('despues', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalReparacionOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Guardar Reparación
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIGURAR MANTENIMIENTO */}
      {modalMantenimientoOpen && reparacionVehiculoActivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-yellow-500" /> Planificar Mantenimiento
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Detalles Adicionales: {reparacionVehiculoActivo.marca} {reparacionVehiculoActivo.modelo} ({reparacionVehiculoActivo.patente})
                </p>
              </div>
              <button 
                onClick={() => setModalMantenimientoOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardarMantenimiento} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Kilometraje Estimado (km)</label>
                <input
                  type="number"
                  placeholder="Ej. 55000"
                  value={mantKilometraje}
                  onChange={(e) => setMantKilometraje(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Fecha Estimada / Mes</label>
                <input
                  type="text"
                  placeholder="Ej. Noviembre 2026, Septiembre 2026..."
                  value={mantFechaEstimada}
                  onChange={(e) => setMantFechaEstimada(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1 font-semibold">Mantenimiento Sugerido</label>
                <textarea
                  value={mantSugerencia}
                  onChange={(e) => setMantSugerencia(e.target.value)}
                  rows="3"
                  placeholder="Ej. Se sugiere programar Cambio de Faja de Distribución, Filtro de Aire y Revisión de niveles..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalMantenimientoOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  Guardar Planificación
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DETALLE DE REPARACION CLINICA */}
      {modalRepairDetail && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl p-6 relative">
            <button 
              onClick={() => setModalRepairDetail(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
            
            <div className="mb-6">
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                Historial Clínico • Reparación
              </span>
              <h3 className="text-lg font-bold text-white mt-3">
                {modalRepairDetail.titulo}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Realizado el {new Date(modalRepairDetail.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                {modalRepairDetail.kilometraje ? ` • ${modalRepairDetail.kilometraje.toLocaleString()} km` : ''}
              </p>
            </div>

            <div className="space-y-4">
              {/* Piezas Cambiadas */}
              {modalRepairDetail.piezas_cambiadas && modalRepairDetail.piezas_cambiadas.length > 0 && (
                <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase mb-2">Piezas / Repuestos Cambiados</span>
                  <div className="flex flex-wrap gap-1.5">
                    {modalRepairDetail.piezas_cambiadas.map((pieza, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-gray-900 border border-gray-800 text-[10px] text-gray-300 font-medium">
                        {pieza}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Comentarios del Trabajo */}
              <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                <span className="block text-[10px] font-bold text-gray-450 uppercase mb-2">Comentarios y Diagnóstico</span>
                <p className="text-xs text-gray-300 font-light leading-relaxed">
                  {modalRepairDetail.comentarios || 'Sin comentarios registrados para este trabajo.'}
                </p>
              </div>

              {/* Evidencias fotográficas (Antes / Después) */}
              <div className="space-y-2">
                <span className="block text-[10px] font-bold text-gray-450 uppercase">Evidencias Fotográficas</span>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Antes (Evaluación) */}
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Antes (Evaluación)</span>
                    {modalRepairDetail.imagen_antes ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-800 relative group">
                        <img src={modalRepairDetail.imagen_antes} className="w-full h-full object-cover" alt="Antes" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a href={modalRepairDetail.imagen_antes} target="_blank" rel="noreferrer" className="text-xs text-white bg-primary px-3 py-1 rounded font-bold">Ver Completa</a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg border border-dashed border-gray-800 flex items-center justify-center text-gray-650 text-[10px]">
                        Sin foto de evaluación
                      </div>
                    )}
                  </div>

                  {/* Después (Ejecución) */}
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-850 flex flex-col items-center justify-center">
                    <span className="text-[10px] font-bold text-gray-400 mb-2 uppercase">Después (Ejecución)</span>
                    {modalRepairDetail.imagen_despues ? (
                      <div className="w-full aspect-video rounded-lg overflow-hidden border border-gray-800 relative group">
                        <img src={modalRepairDetail.imagen_despues} className="w-full h-full object-cover" alt="Después" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <a href={modalRepairDetail.imagen_despues} target="_blank" rel="noreferrer" className="text-xs text-white bg-emerald-600 px-3 py-1 rounded font-bold">Ver Completa</a>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video rounded-lg border border-dashed border-gray-800 flex items-center justify-center text-gray-650 text-[10px]">
                        Sin foto de finalización
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Historial completo de fotos de avance */}
              {(() => {
                const associatedCita = modalRepairDetail.cita_id 
                  ? citasHistorial.find(c => c.id === modalRepairDetail.cita_id || c._id === modalRepairDetail.cita_id) 
                  : null;
                
                if (!associatedCita || !associatedCita.imagenes || associatedCita.imagenes.length === 0) return null;
                
                return (
                  <div className="bg-gray-950 p-4 rounded-xl border border-gray-850">
                    <span className="block text-[10px] font-bold text-gray-450 uppercase mb-2">Línea de Tiempo del Progreso ({associatedCita.imagenes.length} Fotos)</span>
                    <div className="grid grid-cols-4 gap-2">
                      {associatedCita.imagenes.map((img, imgIdx) => (
                        <a key={imgIdx} href={img} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-gray-800 relative group block">
                          <img src={img} className="w-full h-full object-cover" alt={`Paso ${imgIdx + 1}`} />
                          <span className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-gray-300">
                            {imgIdx === 0 ? 'Evaluación' : imgIdx === associatedCita.imagenes.length - 1 ? 'Entrega' : `Avance #${imgIdx}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="pt-6 mt-6 border-t border-gray-850 flex justify-end">
              <button
                onClick={() => setModalRepairDetail(null)}
                className="px-6 py-2 rounded-xl text-xs font-bold bg-gray-800 hover:bg-gray-700 text-white cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
