'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Search, User, Car, Plus, Trash2, Calendar, Clipboard } from 'lucide-react';
import EstadoBadge from '../ui/EstadoBadge.js';

export default function TabClientes() {
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(true);
  
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
    if (!confirm('¿Seguro que quieres eliminar este cliente? Se borrarán también todas sus citas asociadas.')) return;
    try {
      await api.eliminarCliente(id);
      setModalDetalleOpen(false);
      cargarClientes();
    } catch (err) {
      alert('Solo los administradores pueden borrar clientes.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Buscador */}
      <div className="flex justify-between items-center bg-[#111827]/40 p-4 rounded-2xl border border-gray-800">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Buscar por nombre, teléfono o patente..."
            value={busqueda}
            onChange={(e) => { setBusqueda(e.target.value); setPagina(1); }}
            className="block w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-950 border border-gray-850 text-white placeholder-gray-500 text-xs focus:ring-1 focus:ring-[#2908F1] outline-none transition-all duration-200"
          />
        </div>
        <div className="text-xs text-gray-500 font-medium">
          Total: {total} clientes
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
              <thead className="bg-[#111827]/40 text-gray-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Cliente</th>
                  <th className="px-6 py-4">Celular</th>
                  <th className="px-6 py-4">Vehículos</th>
                  <th className="px-6 py-4">Total Citas</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-850/60 text-gray-300 font-light">
                {clientes.map((c) => (
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
                            <Car className="w-3 h-3 text-[#2908F1]/80" /> {v.marca} {v.modelo}
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
                        className="px-2.5 py-1.5 rounded-lg bg-[#2908F1]/10 hover:bg-[#2908F1] text-[#2908F1] hover:text-white border border-[#2908F1]/20 hover:border-[#2908F1] text-[10px] font-bold cursor-pointer"
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
          <div className="w-full max-w-2xl rounded-3xl bg-[#0d1222] border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-gray-850 pb-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2908F1]/10 flex items-center justify-center font-black text-[#2908F1] text-lg border border-[#2908F1]/20">
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
                  <span className="text-3xl font-black text-[#2908F1]">{clienteDetalle.total_citas}</span>
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
                    <div className="p-2 bg-[#2908F1]/10 rounded-xl text-[#2908F1] border border-[#2908F1]/20">
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

            {/* Historial de Citas */}
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-850 pb-1.5 mb-4">Historial de Citas</h4>
              {citasHistorial.length === 0 ? (
                <p className="text-xs text-gray-500">Aún no posee citas finalizadas o agendados.</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {citasHistorial.map(c => {
                    const f = new Date(c.fecha_cita);
                    return (
                      <div key={c._id} className="p-3 rounded-xl bg-gray-950 border border-gray-850 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <Clipboard className="w-4 h-4 text-[#2908F1]" />
                          <div>
                            <span className="font-semibold text-white">{c.servicio}</span>
                            <span className="block text-[10px] text-gray-500">
                              {f.toLocaleDateString('es-ES')} - {String(f.getHours()).padStart(2, '0')}:{String(f.getMinutes()).padStart(2, '0')}hs
                            </span>
                          </div>
                        </div>
                        <EstadoBadge estado={c.estado} />
                      </div>
                    );
                  })}
                </div>
              )}
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
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[#2908F1] text-white hover:bg-blue-800 cursor-pointer"
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
          <div className="w-full max-w-lg rounded-3xl bg-[#0d1222] border border-gray-800 shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto">
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
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2908F1]"
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
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2908F1]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">DNI</label>
                  <input
                    type="text"
                    value={editDni}
                    onChange={(e) => setEditDni(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2908F1]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2908F1]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Notas Internas</label>
                <textarea
                  value={editNotas}
                  onChange={(e) => setEditNotas(e.target.value)}
                  rows="3"
                  placeholder="Observaciones de pago, comportamiento, o detalles del cliente..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-[#2908F1]"
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
                  className="w-full py-1.5 rounded-xl bg-[#2908F1]/10 text-[#2908F1] border border-[#2908F1]/20 text-xs font-semibold hover:bg-[#2908F1] hover:text-white transition-all cursor-pointer"
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
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-[#2908F1] text-white hover:bg-blue-800 cursor-pointer"
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
