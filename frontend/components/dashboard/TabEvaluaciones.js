'use client';

import { useState, useEffect } from 'react';
import { CalendarRange, Check, MessageCircle, AlertCircle, Clock, Calendar as CalendarIcon, LayoutGrid, Wrench, UploadCloud, Image as ImageIcon, FileText, Send, XCircle, Plus, UserPlus, Car } from 'lucide-react';
import { api } from '../../lib/api';
import Swal from 'sweetalert2';

const mapBackendToUi = (estado) => {
  switch (estado) {
    case 'pendiente': return 'reserva';
    case 'validada': return 'validado';
    case 'pendiente_confirmacion': return 'pendiente_confirmacion';
    case 'confirmada': return 'confirmada';
    case 'evaluacion_en_curso': return 'evaluacion_en_curso';
    default: return estado;
  }
};

const mapUiToBackend = (estado) => {
  switch (estado) {
    case 'reserva': return 'pendiente';
    case 'validado': return 'validada';
    case 'pendiente_confirmacion': return 'pendiente_confirmacion';
    case 'confirmada': return 'confirmada';
    case 'evaluacion_en_curso': return 'evaluacion_en_curso';
    case 'finalizada_evaluacion': return 'completada';
    default: return estado;
  }
};

const formatearFechaLegible = (fechaStr) => {
  const d = new Date(fechaStr);
  if (isNaN(d.getTime())) return fechaStr;
  
  const hoy = new Date();
  const manana = new Date(hoy);
  manana.setDate(hoy.getDate() + 1);
  
  const options = { hour: '2-digit', minute: '2-digit', hour12: true };
  const horaStr = d.toLocaleTimeString('es-US', options);
  
  if (d.toDateString() === hoy.toDateString()) {
    return `Hoy, ${horaStr}`;
  } else if (d.toDateString() === manana.toDateString()) {
    return `Mañana, ${horaStr}`;
  } else {
    return `${d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}, ${horaStr}`;
  }
};

export default function TabEvaluaciones() {
  const [vista, setVista] = useState('kanban'); // 'kanban' o 'calendario'
  const [modalTasar, setModalTasar] = useState(null); // ID de la evaluación a tasar
  const [modalNuevoIngreso, setModalNuevoIngreso] = useState(false); // Modal para Walk-in
  
  // Real data para el embudo de evaluaciones
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teams, setTeams] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [subiendoImg, setSubiendoImg] = useState(false);

  const [modalEditarCita, setModalEditarCita] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editTelefono, setEditTelefono] = useState('');
  const [editTipo, setEditTipo] = useState('');
  const [editFecha, setEditFecha] = useState('');
  const [editEstado, setEditEstado] = useState('');
  const [editNotas, setEditNotas] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editPatente, setEditPatente] = useState('');

  const cargarEvaluaciones = async () => {
    setLoading(true);
    try {
      const res = await api.getCitas();
      if (res && res.citas) {
        // Filtrar citas que están en alguno de nuestros estados de Kanban
        const validStates = ['pendiente', 'validada', 'pendiente_confirmacion', 'confirmada', 'evaluacion_en_curso', 'cancelada'];
        const filtered = res.citas.filter(c => validStates.includes(c.estado));
        
        const mapped = filtered.map(c => ({
          id: c._id,
          cliente: c.nombre_cliente || c.cliente?.nombre || 'Cliente de Dashboard',
          tipo: c.tipo_cita || 'Evaluación Presencial',
          fecha: formatearFechaLegible(c.fecha_cita),
          fecha_original: c.fecha_cita,
          estado: mapBackendToUi(c.estado),
          notas: c.descripcion_trabajo || c.notas_mecanico || '',
          imagenes: c.imagenes || [],
          numero_telefono: c.numero_telefono || '',
          vehiculo: c.vehiculo || { marca: '', modelo: '', anio: null, patente: '' },
          cliente_id: c.cliente?._id || c.cliente || null,
          servicio: c.servicio || '',
          producto: c.producto_id || null
        }));
        setEvaluaciones(mapped);
      }
    } catch (err) {
      console.error('Error al cargar evaluaciones:', err);
      setError('Error al cargar datos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  const cargarTeams = async () => {
    try {
      const data = await api.getTeams();
      if (data) {
        setTeams(data);
      }
    } catch (err) {
      console.error('Error al cargar teams:', err);
    }
  };

  useEffect(() => {
    cargarEvaluaciones();
    cargarTeams();

    // Poll for updates every 8 seconds to automatically sync the Kanban board status
    const interval = setInterval(() => {
      cargarEvaluaciones();
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  const handleOpenEditar = (e) => {
    setModalEditarCita(e.id);
    setEditNombre(e.cliente || '');
    setEditTelefono(e.numero_telefono || '');
    setEditTipo(e.tipo || 'Evaluación Presencial');
    
    let dateVal = '';
    if (e.fecha_original) {
      const d = new Date(e.fecha_original);
      const tzOffset = d.getTimezoneOffset() * 60000;
      const localISODate = (new Date(d.getTime() - tzOffset)).toISOString().slice(0, 16);
      dateVal = localISODate;
    }
    setEditFecha(dateVal);
    setEditEstado(mapUiToBackend(e.estado));
    setEditNotas(e.notas || '');
    setEditMarca(e.vehiculo?.marca || '');
    setEditModelo(e.vehiculo?.modelo || '');
    setEditPatente(e.vehiculo?.patente || '');
  };

  const handleSubmitEditar = async (ev) => {
    ev.preventDefault();
    try {
      const payload = {
        nombre_cliente: editNombre,
        numero_telefono: editTelefono,
        tipo_cita: editTipo,
        fecha_cita: editFecha ? new Date(editFecha).toISOString() : undefined,
        estado: editEstado,
        descripcion_trabajo: editNotas,
        vehiculo: {
          marca: editMarca,
          modelo: editModelo,
          patente: editPatente
        }
      };

      const res = await api.actualizarCita(modalEditarCita, payload);
      if (res && res.ok) {
        setModalEditarCita(null);
        await cargarEvaluaciones();
      }
    } catch (err) {
      console.error('Error al editar cita:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: err.message || 'Error al guardar cambios',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const backendEstado = mapUiToBackend(nuevoEstado);
      const res = await api.actualizarCita(id, { estado: backendEstado });
      if (res && res.ok) {
        setEvaluaciones(prev => prev.map(e => e.id === id ? { ...e, estado: nuevoEstado } : e));
      }
    } catch (err) {
      console.error('Error al cambiar de estado:', err);
    }
  };

  const handleOpenTasar = (id) => {
    setModalTasar(id);
    const evalObj = evaluaciones.find(e => e.id === id);
    setUploadedImages(evalObj?.imagenes || []);
  };

  const handleUploadImage = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setSubiendoImg(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('imagen', file);
        
        const res = await api.subirImagenGeneral(formData);
        if (res && res.ok && res.imageUrl) {
          setUploadedImages(prev => [...prev, res.imageUrl]);
        }
      }
    } catch (err) {
      console.error('Error al subir imagen:', err);
      alert('Error al subir una o más imágenes: ' + err.message);
    } finally {
      setSubiendoImg(false);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setUploadedImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmitTasacion = async (e) => {
    e.preventDefault();
    const form = e.target;
    
    // Obtener los valores del formulario
    const team = form.team_asignado.value;
    const precio = parseFloat(form.precio_final.value) || 0;
    const duracionRaw = form.duracion_trabajo.value;
    const notas = form.notas_mecanico.value;
    
    // Calcular duración en minutos
    let duracionMinutos = 60;
    if (duracionRaw === '2h') duracionMinutos = 120;
    else if (duracionRaw === '4h') duracionMinutos = 240;
    else if (duracionRaw === '8h') duracionMinutos = 480;
    else if (duracionRaw === '2d') duracionMinutos = 960;
    
    // Si tiene margen de pruebas, añadir 1 hora
    if (form.margen && form.margen.checked) {
      duracionMinutos += 60;
    }
    
    try {
      const payload = {
        estado: 'completada', // finalizada_evaluacion
        precio_final: precio,
        notas_mecanico: notas,
        duracion_estimada_minutos: duracionMinutos,
        team_asignado: team || null,
        imagenes: uploadedImages
      };
      
      const res = await api.actualizarCita(modalTasar, payload);
      if (res && res.ok) {
        // Remover de la vista de evaluaciones ya que fue tasada y completada
        setEvaluaciones(prev => prev.filter(item => item.id !== modalTasar));
      }
    } catch (err) {
      console.error('Error al enviar diagnóstico/tasación:', err);
    } finally {
      setModalTasar(null);
    }
  };

  const handleSubmitNuevoIngreso = async (e) => {
    e.preventDefault();
    const form = e.target;
    const clienteNombre = form.cliente.value;
    const telefono = form.elements[1].value || '999999999'; // default dummy if not provided
    const marcaModelo = form.elements[2].value || '';
    const notas = form.notas.value;
    
    const marcaParts = marcaModelo.split(' ');
    const marca = marcaParts[0] || 'Genérica';
    const modelo = marcaParts.slice(1).join(' ') || 'Vehículo';

    try {
      const payload = {
        nombre_cliente: clienteNombre,
        numero_telefono: telefono,
        servicio: 'Ingreso Walk-in',
        descripcion_trabajo: notas,
        fecha_cita: new Date().toISOString(),
        tipo_cita: 'Evaluación Presencial',
        vehiculo: {
          marca,
          modelo,
          anio: new Date().getFullYear(),
          patente: clienteNombre.match(/^[A-Z0-9-]{6,10}$/i) ? clienteNombre.toUpperCase() : ''
        },
        estado: 'evaluacion_en_curso' // Walk-in pasa directo a evaluación en curso
      };
      
      const res = await api.crearCita(payload);
      if (res && res.ok && res.cita) {
        const c = res.cita;
        const nuevaEval = {
          id: c._id,
          cliente: c.nombre_cliente || clienteNombre,
          tipo: c.tipo_cita || 'Ingreso Walk-in (Presencial)',
          fecha: formatearFechaLegible(c.fecha_cita),
          estado: 'evaluacion_en_curso',
          notas: c.descripcion_trabajo || notas
        };
        setEvaluaciones(prev => [...prev, nuevaEval]);
        setModalNuevoIngreso(false);
      }
    } catch (err) {
      console.error('Error al crear ingreso manual:', err);
      Swal.fire({
        icon: 'error',
        title: 'Error de validación',
        text: err.message || 'Error al crear el ingreso manual',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    }
  };

  const horasDia = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-dark-card/40 p-4 rounded-2xl border border-gray-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <CalendarRange className="w-4 h-4 text-primary" /> Cotizaciones y Filtro de Leads
          </h3>
          <p className="text-[10px] text-gray-500 mt-1">Valida intenciones de servicio, espera confirmación y envía cotizaciones para empezar a trabajar.</p>
        </div>
        
        {/* Toggle Vistas y Botón Nuevo Ingreso */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalNuevoIngreso(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-btn-primary hover:shadow-btn-primary-hover uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" /> Ingreso Manual
          </button>
          
          <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
            <button
              onClick={() => setVista('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                vista === 'kanban' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Embudo
            </button>
            <button
              onClick={() => setVista('calendario')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                vista === 'calendario' ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4" /> Ocupación
            </button>
          </div>
        </div>
      </div>

      {vista === 'kanban' ? (
        /* Kanban de Evaluaciones (5 Columnas) */
        <div className="flex gap-4 overflow-x-auto pb-4">
          
          {/* Columna 1: Reservas Nuevas */}
          <div className="min-w-[250px] p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5"/> 1. Reservas</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'reserva').map(e => (
                <div key={e.id} onDoubleClick={() => handleOpenEditar(e)} className="p-3 rounded-xl bg-gray-900 border border-yellow-500/20 flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:border-yellow-500/50 transition-all select-none" title="Doble clic para editar detalles">
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500"></div>
                  <span className="block text-xs font-bold text-white">{e.cliente}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold">{e.tipo}</span>
                  <span className="block text-[9px] text-blue-400">{e.fecha}</span>
                  <div className="flex justify-end gap-1 mt-2">
                    <button onClick={() => cambiarEstado(e.id, 'validado')} className="text-[8px] bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded cursor-pointer font-bold">VALIDAR</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 2: Validados */}
          <div className="min-w-[250px] p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5"/> 2. Validados</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'validado').map(e => (
                <div key={e.id} onDoubleClick={() => handleOpenEditar(e)} className="p-3 rounded-xl bg-gray-900 border border-blue-500/20 flex flex-col gap-2 relative overflow-hidden group cursor-pointer hover:border-blue-500/50 transition-all select-none" title="Doble clic para editar detalles">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  <span className="block text-xs font-bold text-white">{e.cliente}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold">{e.tipo}</span>
                  <span className="block text-[9px] text-blue-400">{e.fecha}</span>
                  <div className="mt-2 hidden group-hover:flex justify-end gap-1">
                      <button onClick={() => cambiarEstado(e.id, 'pendiente_confirmacion')} className="text-[8px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded cursor-pointer font-semibold transition-colors">Enviar Confirmación WP</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 3: Pendientes WP */}
          <div className="min-w-[250px] p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5"/> 3. Pendiente Confirmación</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'pendiente_confirmacion').map(e => (
                <div key={e.id} onDoubleClick={() => handleOpenEditar(e)} className="p-3 rounded-xl bg-gray-900 border border-purple-500/20 flex flex-col gap-2 relative overflow-hidden group cursor-pointer hover:border-purple-500/50 transition-all select-none" title="Doble clic para editar detalles">
                  <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                  <span className="block text-xs font-bold text-white">{e.cliente}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold">{e.tipo}</span>
                  <p className="text-[9px] text-yellow-500 font-bold mt-1 animate-pulse flex items-center gap-1"><Clock className="w-3 h-3"/> Esperando Conf.</p>
                  <div className="mt-2 hidden group-hover:flex justify-end gap-1">
                    <button onClick={() => cambiarEstado(e.id, 'confirmada')} className="text-[8px] bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded cursor-pointer">"Sí"</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 4: Confirmadas */}
          <div className="min-w-[250px] p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1.5"><Check className="w-3.5 h-3.5"/> 4. Confirmadas</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'confirmada').map(e => (
                <div key={e.id} onDoubleClick={() => handleOpenEditar(e)} className="p-3 rounded-xl bg-gray-900 border border-green-500/20 flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:border-green-500/50 transition-all select-none" title="Doble clic para editar detalles">
                  <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                  <span className="block text-xs font-bold text-white">{e.cliente}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold">{e.tipo}</span>
                  <span className="block text-[9px] text-blue-400">{e.fecha}</span>
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <button onClick={() => cambiarEstado(e.id, 'evaluacion_en_curso')} className="w-full text-[9px] bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded cursor-pointer font-bold uppercase tracking-wide">
                      INICIAR COTIZACIÓN ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 5: Evaluación en Curso */}
          <div className="min-w-[250px] p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5"><Wrench className="w-3.5 h-3.5"/> 5. Cotizando</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'evaluacion_en_curso').map(e => (
                <div key={e.id} onDoubleClick={() => handleOpenEditar(e)} className="p-3 rounded-xl bg-gray-900 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.1)] flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:border-cyan-500/60 transition-all select-none" title="Doble clic para editar detalles">
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 animate-pulse"></div>
                  <span className="block text-xs font-bold text-white">{e.cliente}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold">{e.tipo}</span>
                  <span className="block text-[9px] italic text-gray-500 break-words">{e.notas}</span>
                  <div className="mt-2 pt-2 border-t border-gray-800">
                    <button onClick={() => handleOpenTasar(e.id)} className="w-full flex items-center justify-center gap-1 text-[9px] bg-primary hover:bg-primary-hover text-white py-1.5 rounded cursor-pointer font-bold uppercase tracking-wide">
                      <FileText className="w-3 h-3" /> TASAR Y ENVIAR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Columna 6: Canceladas */}
          <div className="min-w-[250px] p-4 rounded-2xl bg-gray-950/40 border border-gray-800 flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5"/> 6. Canceladas</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'cancelada').map(e => (
                <div key={e.id} onDoubleClick={() => handleOpenEditar(e)} className="p-3 rounded-xl bg-gray-900 border border-red-500/20 flex flex-col gap-2 relative overflow-hidden cursor-pointer hover:border-red-500/50 transition-all select-none" title="Doble clic para editar detalles">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <span className="block text-xs font-bold text-white">{e.cliente}</span>
                  <span className="block text-[9px] text-gray-400 font-semibold">{e.tipo}</span>
                  <span className="block text-[9px] text-blue-400">{e.fecha}</span>
                  <div className="mt-2 pt-2 border-t border-gray-800 text-center">
                    <span className="text-[9px] font-bold text-red-500 uppercase tracking-wider">Cita Cancelada</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* Vista Calendario de Ocupación para Evaluaciones */
        <div className="border border-gray-850 rounded-2xl overflow-hidden bg-gray-950/20">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header de días */}
              <div className="flex border-b border-gray-850 bg-gray-900">
                <div className="w-20 p-3 border-r border-gray-850 text-[10px] font-bold text-gray-500 text-center">Hora</div>
                {diasSemana.map(dia => (
                  <div key={dia} className="flex-1 p-3 text-center text-xs font-bold text-gray-300 border-r border-gray-850/50">
                    {dia}
                  </div>
                ))}
              </div>
              
              {/* Filas de horas */}
              {horasDia.map((hora) => (
                <div key={hora} className="flex border-b border-gray-850/50 min-h-[80px]">
                  <div className="w-20 p-2 border-r border-gray-850 text-[10px] font-bold text-gray-500 flex justify-center items-start pt-3 bg-gray-950/50">
                    {hora}
                  </div>
                  {diasSemana.map((dia, idx) => {
                    const getEvaluationForSlot = (d, h) => {
                      const diasSemanaMap = { 'Lun': 1, 'Mar': 2, 'Mié': 3, 'Jue': 4, 'Vie': 5, 'Sáb': 6, 'Dom': 0 };
                      const dayIdx = diasSemanaMap[d];
                      const targetHour = parseInt(h.split(':')[0]);
                      return evaluaciones.find(e => {
                        if (!e.fecha_original) return false;
                        const dateObj = new Date(e.fecha_original);
                        return dateObj.getDay() === dayIdx && dateObj.getHours() === targetHour;
                      });
                    };

                    const evalObj = getEvaluationForSlot(dia, hora);

                    return (
                      <div key={dia} className="flex-1 border-r border-gray-850/30 p-1 relative hover:bg-gray-900/30 transition-colors cursor-pointer group">
                        {evalObj && (
                          <div className="absolute inset-1 rounded-lg bg-primary/10 border border-primary/30 p-1.5 overflow-hidden flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-white block truncate">{evalObj.cliente}</span>
                            <span className="text-[8px] text-gray-400 block truncate">{evalObj.tipo}</span>
                          </div>
                        )}
                        
                        <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-black/40 backdrop-blur-[1px]">
                          <span className="text-[10px] text-white font-bold bg-gray-900 px-2 py-1 rounded border border-gray-700">+ Agendar</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NUEVO INGRESO (WALK-IN) */}
      {modalNuevoIngreso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalNuevoIngreso(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Ingreso Manual de Taller
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Registra un cliente que ha llegado físicamente (Walk-in) sin cita previa. El pedido pasará directamente a Evaluación en Curso.
              </p>
            </div>

            <form onSubmit={handleSubmitNuevoIngreso} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><UserPlus className="w-3 h-3"/> Nombre del Cliente o Patente</label>
                <input 
                  type="text" 
                  name="cliente"
                  required 
                  placeholder="Ej: ABC-123 o Luis Martinez" 
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono (WhatsApp)</label>
                  <input type="tel" placeholder="+56 9..." className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Marca / Modelo</label>
                  <input type="text" placeholder="Ej: Toyota Yaris" className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Motivo del Ingreso Inicial</label>
                <textarea 
                  name="notas"
                  rows="3" 
                  required
                  placeholder="El cliente indica que los frenos suenan al frenar..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none custom-scrollbar"
                />
              </div>

              {/* Acciones */}
              <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setModalNuevoIngreso(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-gray-900 hover:bg-gray-800 border border-gray-800 transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-btn-primary hover:shadow-btn-primary-hover transition-all">
                  CREAR INGRESO Y EVALUAR
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL DE DIAGNÓSTICO Y TASACIÓN */}
      {modalTasar && (() => {
        const evalObj = evaluaciones.find(e => e.id === modalTasar);
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <div className="w-full max-w-2xl rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setModalTasar(null)}
                className="absolute top-6 right-6 text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-primary" /> Diagnóstico y Presupuesto
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  La cotización está lista. Asigna el trabajo a un pastelero, define el precio final y estima el tiempo necesario.
                </p>
              </div>

              <form onSubmit={handleSubmitTasacion} className="space-y-6">
                
                {/* Producto / Paquete de Reserva */}
                {evalObj?.producto && (
                  <div className="bg-gray-950/60 p-3.5 rounded-xl border border-gray-800 text-xs">
                    <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Servicio y Producto Solicitado</span>
                    <div className="flex justify-between items-center text-white">
                      <span>🔧 <b>{evalObj.servicio}</b> • {evalObj.producto.nombre}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        Precio Base: S/. {(evalObj.producto.precio || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Asignación de Equipo */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Team Asignado *</label>
                    <select name="team_asignado" required className="w-full bg-gray-950 border border-gray-850 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                      <option value="">Selecciona un equipo...</option>
                      {teams.map(t => (
                        <option key={t._id} value={t._id}>Team: {t.nombre}</option>
                      ))}
                    </select>
                  </div>

                  {/* Precio Final */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Precio Final Acordado (S/.) *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-3.5 text-gray-500 font-bold">S/.</span>
                      <input 
                        name="precio_final" 
                        type="number" 
                        required 
                        placeholder="0.00" 
                        defaultValue={evalObj?.producto?.precio || ''}
                        step="0.01" 
                        className="w-full bg-gray-950 border border-gray-850 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                      />
                    </div>
                  </div>

                  {/* Duración */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Duración Neta de Trabajo *</label>
                    <select name="duracion_trabajo" required className="w-full bg-gray-950 border border-gray-855 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none">
                      <option value="1h">1 hora</option>
                      <option value="2h">2 horas</option>
                      <option value="4h">4 horas (Medio Día)</option>
                      <option value="8h">8 horas (Día Completo)</option>
                      <option value="2d">2 Días</option>
                    </select>
                  </div>

                  {/* Margen de seguridad */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Margen de Pruebas *</label>
                    <div className="flex items-center gap-3 bg-gray-950 border border-gray-850 rounded-xl px-4 py-3">
                      <input type="checkbox" name="margen" id="margen" defaultChecked className="w-4 h-4 text-primary bg-gray-800 border-gray-750 rounded focus:ring-primary" />
                      <label htmlFor="margen" className="text-sm text-gray-300 font-medium cursor-pointer">
                        Añadir <span className="text-blue-400 font-bold">+1 Hora</span> de margen final
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notas Técnicas */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Notas del Diagnóstico Técnico</label>
                  <textarea 
                    name="notas_mecanico"
                    rows="3" 
                    placeholder="Escribe los detalles que el mecánico del Team debe saber antes de empezar..."
                    className="w-full bg-gray-950 border border-gray-850 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none custom-scrollbar"
                  />
                </div>

                {/* Evidencia Fotográfica */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><ImageIcon className="w-3 h-3"/> Evidencias (Fotos de referencia)</label>
                  <div className="grid grid-cols-4 gap-3">
                    <label className="aspect-square bg-gray-950 border-2 border-dashed border-gray-850 rounded-xl flex flex-col items-center justify-center text-gray-500 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                      <UploadCloud className="w-6 h-6 mb-1" />
                      <span className="text-[9px] font-bold">{subiendoImg ? 'Subiendo...' : 'Subir Foto'}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleUploadImage}
                        disabled={subiendoImg}
                      />
                    </label>
                    {uploadedImages.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-gray-800 rounded-xl overflow-hidden relative group border border-gray-700">
                        <img src={img} alt="Evidencia" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute top-1 right-1 bg-red-600/80 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100 shadow-md"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="pt-6 border-t border-gray-850 flex justify-end gap-3">
                  <button type="button" onClick={() => setModalTasar(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-gray-950 border border-gray-850 hover:bg-gray-800 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-btn-primary hover:shadow-btn-primary-hover transition-all">
                    ENVIAR A PRODUCCIÓN <Send className="w-3 h-3" />
                  </button>
                </div>

              </form>
            </div>
          </div>
        );
      })()}

      {/* MODAL PARA EDITAR DETALLES Y ESTADO DE LA CITA */}
      {modalEditarCita && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-gray-900 border border-gray-800 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setModalEditarCita(null)}
              className="absolute top-6 right-6 text-gray-400 hover:text-white cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>
            
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Editar Detalles de la Cita / Lead
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Modifica el estado en el embudo, la información del cliente, fecha del turno o los datos del pedido.
              </p>
            </div>

            <form onSubmit={handleSubmitEditar} className="space-y-4">
              
              {/* Grid 1: Cliente y Contacto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre del Cliente</label>
                  <input 
                    type="text" 
                    required
                    value={editNombre}
                    onChange={e => setEditNombre(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Teléfono / WhatsApp</label>
                  <input 
                    type="text" 
                    required
                    value={editTelefono}
                    onChange={e => setEditTelefono(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
              </div>

              {/* Grid 2: Tipo de Cita, Fecha y Estado */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo de Cita</label>
                  <select 
                    value={editTipo} 
                    onChange={e => setEditTipo(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="Evaluación Presencial">Evaluación Presencial</option>
                    <option value="Evaluación con Fotos">Evaluación con Fotos</option>
                    <option value="Llamada Directa">Llamada Directa</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha y Hora</label>
                  <input 
                    type="datetime-local" 
                    required
                    value={editFecha}
                    onChange={e => setEditFecha(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Estado en Embudo</label>
                  <select 
                    value={editEstado} 
                    onChange={e => setEditEstado(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value="pendiente">1. Reservas (Pendiente)</option>
                    <option value="validada">2. Validados (Validada)</option>
                    <option value="pendiente_confirmacion">3. Pendiente Confirmación</option>
                    <option value="confirmada">4. Confirmadas</option>
                    <option value="evaluacion_en_curso">5. Eval. En Curso</option>
                    <option value="completada">Completada (Finalizada Evaluación)</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>
              </div>

              {/* Grid 3: Pedido (Detalles) */}
              <div className="bg-gray-950/40 border border-gray-800 rounded-2xl p-4 space-y-3">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Datos del Pedido</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Marca</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Renault"
                      value={editMarca}
                      onChange={e => setEditMarca(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Modelo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Logan"
                      value={editModelo}
                      onChange={e => setEditModelo(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Patente (Placa)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: AKE473"
                      value={editPatente}
                      onChange={e => setEditPatente(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none" 
                    />
                  </div>
                </div>
              </div>

              {/* Descripción / Notas del Diagnóstico Inicial */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Motivo o Notas del Trabajo</label>
                <textarea 
                  value={editNotas}
                  onChange={e => setEditNotas(e.target.value)}
                  rows="3" 
                  placeholder="Escribe el motivo del ingreso o las observaciones del diagnóstico..."
                  className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none custom-scrollbar"
                />
              </div>

              {/* Acciones */}
              <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setModalEditarCita(null)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-400 bg-gray-950 hover:bg-gray-800 border border-gray-800 transition-colors cursor-pointer">
                  Cancelar
                </button>
                <button type="submit" className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-lg transition-all cursor-pointer">
                  GUARDAR CAMBIOS
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
