'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Box, Users, ChevronDown, ChevronRight, PackagePlus } from 'lucide-react';
import Swal from 'sweetalert2';

import { api } from '../../lib/api';

export default function TabServicios() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    try {
      const data = await api.getServicios();
      setServicios(data.map(s => ({ ...s, expandido: true })));
    } catch (error) {
      console.error('Error cargando servicios:', error);
    } finally {
      setCargando(false);
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

  const handleCrearServicio = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nueva Categoría de Servicio',
      html: `
        <input id="swal-input1" class="swal2-input" placeholder="Nombre (Ej: Planchado)">
        <input id="swal-input2" class="swal2-input" placeholder="Icono (Ej: 🚗)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-input1').value,
          icono: document.getElementById('swal-input2').value || '🔧'
        }
      }
    });

    if (formValues && formValues.nombre) {
      try {
        await api.crearServicio(formValues);
        Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarServicios();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleEditarServicio = async (servicio) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Categoría de Servicio',
      html: `
        <input id="swal-edit1" class="swal2-input" value="${servicio.nombre}" placeholder="Nombre (Ej: Planchado)">
        <input id="swal-edit2" class="swal2-input" value="${servicio.icono || ''}" placeholder="Icono (Ej: 🚗)">
        <textarea id="swal-edit3" class="swal2-textarea" placeholder="Descripción de la categoría">${servicio.descripcion || ''}</textarea>
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-edit1').value,
          icono: document.getElementById('swal-edit2').value,
          descripcion: document.getElementById('swal-edit3').value
        }
      }
    });

    if (formValues && formValues.nombre) {
      try {
        await api.actualizarServicio(servicio._id, formValues);
        Swal.fire({ title: 'Actualizado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarServicios();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleCrearProducto = async (servicioId) => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Producto / Variante',
      html: `
        <input id="swal-p1" class="swal2-input" placeholder="Nombre (Ej: Planchado Básico)">
        <input id="swal-p2" type="number" class="swal2-input" placeholder="Precio (Ej: 150)">
        <input id="swal-p3" type="number" class="swal2-input" placeholder="Duración en minutos (Ej: 120)">
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-p1').value,
          precio: document.getElementById('swal-p2').value,
          duracion_minutos: document.getElementById('swal-p3').value,
          servicio_padre: servicioId
        }
      }
    });

    if (formValues && formValues.nombre && formValues.precio) {
      try {
        await api.crearProducto(formValues);
        Swal.fire({ title: 'Creado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarServicios();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
    }
  };

  const handleEditarProducto = async (producto) => {
    const { value: formValues } = await Swal.fire({
      title: 'Editar Producto / Variante',
      html: `
        <input id="swal-pe1" class="swal2-input" value="${producto.nombre}" placeholder="Nombre">
        <input id="swal-pe2" type="number" class="swal2-input" value="${producto.precio}" placeholder="Precio">
        <input id="swal-pe3" type="number" class="swal2-input" value="${producto.duracion_minutos}" placeholder="Duración en minutos">
      `,
      focusConfirm: false,
      showCancelButton: true,
      background: '#111827',
      color: '#fff',
      preConfirm: () => {
        return {
          nombre: document.getElementById('swal-pe1').value,
          precio: document.getElementById('swal-pe2').value,
          duracion_minutos: document.getElementById('swal-pe3').value
        }
      }
    });

    if (formValues && formValues.nombre && formValues.precio) {
      try {
        await api.actualizarProducto(producto._id, formValues);
        Swal.fire({ title: 'Actualizado', icon: 'success', background: '#111827', color: '#fff', showConfirmButton: false, timer: 1000 });
        cargarServicios();
      } catch (error) {
        Swal.fire('Error', error.message, 'error');
      }
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

  return (
    <div className="space-y-6">
      
      {/* Barra superior */}
      <div className="flex justify-between items-center bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Box className="w-4 h-4 text-primary" /> Catálogo de Servicios y Productos
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Define los conjuntos (Servicios) y sus variantes/paquetes específicos (Productos).</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleCrearServicio} className="flex items-center gap-1.5 px-4 py-2 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
            <Plus className="w-4 h-4" /> NUEVA CATEGORÍA
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {servicios.map((s) => (
          <div key={s._id} className="rounded-2xl bg-gray-950/40 border border-gray-850 overflow-hidden transition-all duration-300 hover:border-gray-700">
            
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
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                      <Users className="w-3.5 h-3.5 text-blue-400" />
                      Implementa: <span className="font-bold text-white">{s.team_asignado.nombre}</span>
                    </div>
                  )}
                
                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                  <button onClick={() => handleEditarServicio(s)} className="p-1.5 rounded-lg text-gray-500 hover:text-primary hover:bg-gray-800 transition-colors cursor-pointer" title="Editar Categoría">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleEliminarServicio(s._id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-gray-800 transition-colors cursor-pointer" title="Eliminar Categoría">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-800 mx-1 self-center"></div>
                  <button className="p-1.5 text-gray-500">
                    {s.expandido ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Lista de Productos (Variantes) */}
            {s.expandido && (
              <div className="border-t border-gray-850 bg-gray-900/10 p-4">
                <div className="flex justify-between items-center mb-3 px-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Productos / Paquetes Disponibles</span>
                  <button onClick={() => handleCrearProducto(s._id)} className="flex items-center gap-1.5 text-[10px] text-primary hover:text-white font-bold transition-colors cursor-pointer">
                    <PackagePlus className="w-3.5 h-3.5" /> AÑADIR PRODUCTO A ESTA CATEGORÍA
                  </button>
                </div>
                
                <div className="space-y-2">
                  {s.productos && s.productos.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/50"></div>
                        <span className="text-xs font-bold text-white">{p.nombre}</span>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-[10px] text-gray-500">Duración Est: <b className="text-gray-300">{p.duracion_minutos} min</b></span>
                        <span className="text-xs font-black text-green-400">S/. {p.precio.toFixed(2)}</span>
                        <div className="flex gap-1 border-l border-gray-800 pl-4">
                           <button onClick={() => handleEditarProducto(p)} className="text-gray-500 hover:text-primary transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                           <button onClick={() => handleEliminarProducto(p._id)} className="text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        ))}
      </div>

    </div>
  );
}
