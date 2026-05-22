'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Plus, Edit3, Trash2, ShieldAlert } from 'lucide-react';

export default function TabServicios() {
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editModo, setEditModo] = useState(false);
  const [activeId, setActiveId] = useState('');
  
  // Form states
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [precio, setPrecio] = useState('');
  const [duracion, setDuracion] = useState('');
  const [icono, setIcono] = useState('🔧');
  
  // JSON Import states
  const [jsonModo, setJsonModo] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarServicios();
  }, []);

  const cargarServicios = async () => {
    setLoading(true);
    try {
      const res = await api.getServicios();
      if (res) {
        setServicios(res);
      }
    } catch (err) {
      console.error('Error cargando servicios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCrear = () => {
    setEditModo(false);
    setActiveId('');
    setNombre('');
    setDescripcion('');
    setPrecio('');
    setDuracion('60');
    setIcono('🔧');
    setJsonModo(false);
    setJsonInput('');
    setError('');
    setModalOpen(true);
  };

  const handleOpenEditar = (s) => {
    setEditModo(true);
    setActiveId(s._id);
    setNombre(s.nombre || '');
    setDescripcion(s.descripcion || '');
    setPrecio(s.precio_base || '');
    setDuracion(s.duracion_minutos || '60');
    setIcono(s.icono || '🔧');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);

    try {
      let payload;

      if (!editModo && jsonModo) {
        try {
          payload = JSON.parse(jsonInput);
        } catch (parseErr) {
          throw new Error('El JSON introducido no es válido. Verifica la sintaxis.');
        }

        const items = Array.isArray(payload) ? payload : [payload];
        for (const item of items) {
          if (!item.nombre || item.precio_base === undefined || item.precio_base === null || isNaN(parseFloat(item.precio_base))) {
            throw new Error('Todos los servicios deben incluir "nombre" y un "precio_base" numérico.');
          }
        }
      } else {
        payload = {
          nombre,
          descripcion,
          precio_base: parseFloat(precio),
          duracion_minutos: parseInt(duracion) || 60,
          icono
        };
      }

      if (editModo) {
        await api.actualizarServicio(activeId, payload);
      } else {
        await api.crearServicio(payload);
      }

      setModalOpen(false);
      cargarServicios();
    } catch (err) {
      setError(err.message || 'Error al procesar la operación');
    } finally {
      setGuardando(false);
    }
  };

  const handleDesactivar = async (id) => {
    if (!confirm('¿Seguro que quieres desactivar este servicio? No se mostrará más en la landing page ni en Max.')) return;
    try {
      await api.eliminarServicio(id);
      cargarServicios();
    } catch (err) {
      alert('Solo los administradores pueden realizar esta acción.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barra superior */}
      <div className="flex justify-between items-center bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Catálogo de Servicios</h3>
        </div>
        <button
          onClick={handleOpenCrear}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-btn-primary hover:shadow-btn-primary-hover cursor-pointer"
        >
          <Plus className="w-4 h-4" /> AGREGAR SERVICIO
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {servicios.map((s) => (
            <div 
              key={s._id}
              className="p-6 rounded-2xl bg-gray-950/20 border border-gray-850 flex flex-col justify-between group hover:border-gray-700 transition-all duration-300"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-3xl p-2 bg-gray-900 border border-gray-850 rounded-xl block">{s.icono || '🔧'}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleOpenEditar(s)}
                      className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 border border-gray-850 hover:border-primary/35 text-gray-400 hover:text-primary cursor-pointer"
                      title="Editar"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDesactivar(s._id)}
                      className="p-1.5 rounded-lg bg-gray-900 hover:bg-red-500/10 border border-gray-850 hover:border-red-500/30 text-gray-500 hover:text-red-500 cursor-pointer"
                      title="Desactivar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mb-2">{s.nombre}</h4>
                <p className="text-xs text-gray-500 font-light leading-relaxed mb-6">{s.descripcion || 'Sin descripción.'}</p>
              </div>

              <div className="flex justify-between items-center text-[10px] text-gray-400 pt-4 border-t border-gray-850/60">
                <span>Duración: <b>{s.duracion_minutos} min</b></span>
                <span className="text-primary font-bold text-xs">S/. {s.precio_base}</span>
              </div>
            </div>
          ))}

          {servicios.length === 0 && (
            <div className="col-span-3 text-center py-12 text-sm text-gray-500">
              No hay servicios registrados. Agrega el primero haciendo clic arriba.
            </div>
          )}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8">
            <div className="flex justify-between items-center border-b border-gray-800 pb-4 mb-4">
              <h3 className="text-lg font-bold text-white">{editModo ? 'Editar Servicio' : 'Nuevo Servicio'}</h3>
              <button 
                onClick={() => setModalOpen(false)} 
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Pestañas para el modo de entrada */}
            {!editModo && (
              <div className="flex border-b border-gray-800/80 mb-6 gap-4">
                <button
                  type="button"
                  onClick={() => setJsonModo(false)}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    !jsonModo 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Formulario
                </button>
                <button
                  type="button"
                  onClick={() => setJsonModo(true)}
                  className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                    jsonModo 
                      ? 'border-primary text-primary' 
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Importar JSON
                </button>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl mb-4 font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!editModo && jsonModo ? (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Entrada JSON *</label>
                    <span className="text-[9px] text-gray-500 font-mono">Arreglo o único objeto</span>
                  </div>
                  <textarea
                    required
                    placeholder={`[\n  {\n    "nombre": "Servicio de Frenos",\n    "descripcion": "Cambio de pastillas y purgado",\n    "precio_base": 180,\n    "duracion_minutos": 60,\n    "icono": "🔧"\n  }\n]`}
                    rows="10"
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs font-mono outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                  />
                  <p className="text-[9px] text-gray-550 mt-2 leading-normal">
                    Nota: Asegúrate de incluir <b>nombre</b> y <b>precio_base</b> (numérico). Los campos <b>descripcion</b>, <b>duracion_minutos</b> (por defecto 60) e <b>icono</b> (por defecto 🔧) son opcionales.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3">
                    <div className="col-span-3">
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Nombre del Servicio *</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Service de Frenos"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Icono/Emoji</label>
                      <input
                        type="text"
                        required
                        placeholder="🔧"
                        value={icono}
                        onChange={(e) => setIcono(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs text-center outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Descripción corta</label>
                    <textarea
                      placeholder="Explica en qué consiste el servicio..."
                      rows="3"
                      value={descripcion}
                      onChange={(e) => setDescripcion(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Precio Base (S/.) *</label>
                      <input
                        type="number"
                        required
                        placeholder="120"
                        value={precio}
                        onChange={(e) => setPrecio(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Duración (minutos) *</label>
                      <input
                        type="number"
                        required
                        placeholder="60"
                        value={duracion}
                        onChange={(e) => setDuracion(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-gray-850 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-gray-900 border border-gray-800 text-gray-300 hover:bg-gray-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Guardar'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
