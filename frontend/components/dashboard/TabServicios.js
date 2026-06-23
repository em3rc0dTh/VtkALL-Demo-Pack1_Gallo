'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Box, Users, ChevronDown, ChevronRight, PackagePlus, X, Save } from 'lucide-react';
import Swal from 'sweetalert2';
import { PageHeader } from '../ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

import { api } from '../../lib/api';

const CURRENCY_SYMBOLS = { PEN: 'S/.', USD: '$', EUR: '€', MXN: '$', COP: '$', ARS: '$', CLP: '$' };

export default function TabServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [moneda, setMoneda] = useState('PEN');

  // Cálculos de métricas
  const totalCategorias = servicios.length;
  const todosProductos = servicios.flatMap(s => s.productos || []);
  const totalProductos = todosProductos.length;
  const precioPromedio = totalProductos > 0 ? (todosProductos.reduce((acc, curr) => acc + (curr.precio || 0), 0) / totalProductos).toFixed(2) : '0.00';
  const categoriasConEquipo = servicios.filter(s => s.team_asignado).length;

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [modalType, setModalType] = useState('servicio'); // 'servicio' | 'producto'
  const [modalData, setModalData] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataServicios, config] = await Promise.all([
        api.getServicios(),
        api.getConfiguracion().catch(() => ({}))
      ]);
      setServicios(dataServicios.map(s => ({ ...s, expandido: true })));
      if (config && config.moneda) {
        setMoneda(config.moneda);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarServicios = async () => {
    try {
      const data = await api.getServicios();
      setServicios(data.map(s => ({ ...s, expandido: true })));
    } catch (error) {
      console.error('Error cargando servicios:', error);
    }
  };

  const toggleExpand = (id) => {
    setServicios(servicios.map(s => s._id === id ? { ...s, expandido: !s.expandido } : s));
  };

  const handleEliminarServicio = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar categoría?',
      text: 'Se desactivará el servicio.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      background: '#111827',
      color: '#fff'
    });
    if (result.isConfirmed) {
      try {
        await api.eliminarServicio(id);
        Swal.fire({ title: 'Eliminado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarServicios();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const openModal = (type, mode, data = {}) => {
    setModalType(type);
    setModalMode(mode);
    setModalData(data);
    setModalError('');
    setModalOpen(true);
  };

  const handleGuardarModal = async (e) => {
    e.preventDefault();
    setModalError('');
    setGuardando(true);
    
    try {
      if (modalType === 'servicio') {
        if (modalMode === 'create') {
          await api.crearServicio({ 
            nombre: modalData.nombre, 
            icono: modalData.icono || '🍰', 
            descripcion: modalData.descripcion 
          });
          Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        } else {
          await api.actualizarServicio(modalData._id, { 
            nombre: modalData.nombre, 
            icono: modalData.icono || '🍰', 
            descripcion: modalData.descripcion 
          });
          Swal.fire({ title: 'Actualizado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        }
      } else {
        if (modalMode === 'create') {
          await api.crearProducto({ 
            nombre: modalData.nombre, 
            precio: Number(modalData.precio || 0), 
            duracion_minutos: Number(modalData.duracion_minutos || 0), 
            servicio_padre: modalData.servicio_padre 
          });
          Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        } else {
          await api.actualizarProducto(modalData._id, { 
            nombre: modalData.nombre, 
            precio: Number(modalData.precio || 0), 
            duracion_minutos: Number(modalData.duracion_minutos || 0) 
          });
          Swal.fire({ title: 'Actualizado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        }
      }
      setModalOpen(false);
      cargarServicios();
    } catch (err) {
      setModalError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminarProducto = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      background: '#111827',
      color: '#fff'
    });
    if (result.isConfirmed) {
      try {
        await api.eliminarProducto(id);
        cargarServicios();
      } catch (e) {}
    }
  };

  const symbol = CURRENCY_SYMBOLS[moneda] || moneda;

  if (cargando) {
    return <div className="py-20"><LoadingSpinner size="lg" text="Cargando catálogo..." /></div>;
  }

  return (
    <div className="space-y-6">
      
      <PageHeader 
        title="Catálogo de Servicios"
        description="Define servicios, categorías, precios y disponibilidad."
        actions={
          <Button variant="primary" icon={Plus} onClick={() => openModal('servicio', 'create', { icono: '🔧' })}>
            Nueva Categoría
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Variantes</CardTitle>
            <Box className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProductos}</div>
            <p className="text-xs text-gray-500 mt-1">Servicios listados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Categorías</CardTitle>
            <PackagePlus className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCategorias}</div>
            <p className="text-xs text-gray-500 mt-1">Grupos activos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Precio prom.</CardTitle>
            <span className="text-yellow-500 font-bold">{symbol}</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{precioPromedio}</div>
            <p className="text-xs text-gray-500 mt-1">Ticket base</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Delegación</CardTitle>
            <Users className="w-4 h-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{categoriasConEquipo}</div>
            <p className="text-xs text-gray-500 mt-1">Equipos técnicos asig.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {servicios.map((s) => (
          <Card key={s._id} className="overflow-hidden transition-all duration-300 hover:border-gray-600/50">
            
            {/* Header del Servicio (Categoría) */}
            <div 
              onClick={() => toggleExpand(s._id)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-900/30 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl w-12 h-12 flex items-center justify-center bg-gray-900 border border-gray-800 rounded-xl">
                  {s.icono}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    {s.nombre}
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                      {s.productos.length} productos
                    </span>
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">{s.descripcion}</p>
                </div>
              </div>

                <div className="flex items-center gap-6">
                  {s.team_asignado && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800 hidden md:flex">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Equipo: <span className="font-bold text-white">{s.team_asignado.nombre}</span>
                    </div>
                  )}
                
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => openModal('servicio', 'edit', s)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-800 transition-colors cursor-pointer" title="Editar Categoría">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEliminarServicio(s._id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-gray-800 transition-colors cursor-pointer" title="Eliminar Categoría">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-800 mx-1 self-center"></div>
                  <button title={s.expandido ? "Ocultar servicios" : "Ver servicios"} className="p-2 rounded-full text-gray-400 bg-gray-900 border border-gray-800 hover:text-white hover:bg-gray-800 transition-all shadow-sm">
                    {s.expandido ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Productos (Variantes) */}
            {s.expandido && (
              <div className="border-t border-gray-800/60 bg-gray-900/40 p-4">
                <div className="flex justify-between items-center mb-3 px-2">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Variantes Disponibles</span>
                  <Button variant="outline" size="sm" icon={PackagePlus} onClick={() => openModal('producto', 'create', { servicio_padre: s._id })} className="text-[10px] uppercase font-bold h-7 py-0">
                    Añadir Variante
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {s.productos && s.productos.map(p => (
                    <div key={p._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-gray-950/50 border border-gray-800 hover:border-gray-700 transition-colors gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/70"></div>
                        <span className="text-xs font-bold text-white">{p.nombre}</span>
                      </div>
                      <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
                        <span className="text-[10px] text-gray-400 bg-gray-900/50 px-2 py-1.5 rounded-md border border-gray-800 font-mono">
                          <b className="text-gray-300 mr-1">{p.duracion_minutos}</b>min
                        </span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-md border border-emerald-500/20 font-mono">
                          {symbol} {p.precio.toFixed(2)}
                        </span>
                        <div className="flex gap-1 border-l border-gray-800 pl-4">
                           <button title="Editar variante" aria-label="Editar" onClick={() => openModal('producto', 'edit', p)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-800 transition-colors"><Edit3 className="w-4 h-4" /></button>
                           <button title="Eliminar variante" aria-label="Eliminar" onClick={() => handleEliminarProducto(p._id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-gray-800 transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!s.productos || s.productos.length === 0) && (
                    <div className="text-center py-6 border border-dashed border-gray-800 rounded-xl bg-gray-900/20">
                      <p className="text-xs text-gray-500">No hay variantes en esta categoría. Añade la primera.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </Card>
        ))}
      </div>

      {/* Modal Rediseñado */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-850 flex justify-between items-center bg-gray-900/50 rounded-t-3xl">
              <div>
                <h3 className="text-lg font-bold text-white">
                  {modalMode === 'create' ? 'Crear' : 'Editar'} {modalType === 'servicio' ? 'Categoría' : 'Producto / Servicio'}
                </h3>
                <p className="text-[10px] text-gray-400 mt-1">Completa los datos solicitados a continuación.</p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 bg-gray-900 text-gray-400 hover:text-white rounded-full transition-colors border border-gray-800">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form onSubmit={handleGuardarModal} className="space-y-4">
                
                {modalError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold text-center">
                    {modalError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Nombre del {modalType === 'servicio' ? 'Servicio / Categoría' : 'Producto'}</label>
                  <input
                    type="text"
                    required
                    value={modalData.nombre || ''}
                    onChange={e => setModalData({...modalData, nombre: e.target.value})}
                    placeholder="Ej: Mantenimiento Preventivo"
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>

                {modalType === 'servicio' ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Icono (Emoji)</label>
                        <input
                          type="text"
                          value={modalData.icono || ''}
                          onChange={e => setModalData({...modalData, icono: e.target.value})}
                          placeholder="Ej: 🔧"
                          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center text-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Descripción Breve</label>
                      <textarea
                        value={modalData.descripcion || ''}
                        onChange={e => setModalData({...modalData, descripcion: e.target.value})}
                        placeholder="Describe de qué trata esta categoría..."
                        rows="3"
                        className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                      ></textarea>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Precio Base</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold text-xs">{symbol}</span>
                          </div>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={modalData.precio || ''}
                            onChange={e => setModalData({...modalData, precio: e.target.value})}
                            placeholder="0.00"
                            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-12 pr-4 py-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Duración Est.</label>
                        <div className="relative">
                          <input
                            type="number"
                            required
                            min="0"
                            value={modalData.duracion_minutos || ''}
                            onChange={e => setModalData({...modalData, duracion_minutos: e.target.value})}
                            placeholder="60"
                            className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl pl-4 pr-12 py-3 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-mono"
                          />
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <span className="text-gray-500 font-bold text-xs">min</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-gray-850 mt-6">
                  <button
                    type="submit"
                    disabled={guardando}
                    className="w-full py-3.5 px-4 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-btn-primary hover:shadow-btn-primary-hover disabled:opacity-50"
                  >
                    {guardando ? 'Guardando...' : (
                      <>
                        <Save className="w-4 h-4" /> GUARDAR {modalType === 'servicio' ? 'CATEGORÍA' : 'PRODUCTO'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
