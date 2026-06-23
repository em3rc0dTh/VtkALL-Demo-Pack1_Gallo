'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, Search, Edit3, XCircle, Check, MapPin, DollarSign, Clock, MessageCircle, AlertCircle, FileText, Send, UploadCloud, ImageIcon, Camera, Car, Calendar, Wrench, Info, LogOut, CalendarRange, LayoutGrid, Calendar as CalendarIcon, UserPlus, CheckCircle, X
} from 'lucide-react';
import OperationalCard from './OperationalCard';
import { api } from "../../lib/api.js";
import Swal from 'sweetalert2';
import CloseModalButton from "../ui/CloseModalButton.js";
import { PageHeader } from '../ui/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { EmptyState } from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';

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
  const [editAnio, setEditAnio] = useState('');
  const [editPatente, setEditPatente] = useState('');
  const [editResponsable, setEditResponsable] = useState('');

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
    setEditAnio(e.vehiculo?.anio || '');
    setEditPatente(e.vehiculo?.patente || '');
    setEditResponsable(e.experto_asignado || '');
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
          anio: editAnio ? parseInt(editAnio) : undefined,
          patente: editPatente
        },
        experto_asignado: editResponsable
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

  // --- Helper: Calcular Prioridad ---
  const calcularPrioridad = (cita) => {
    if (!cita.fecha_original) return 'normal';
    const horas = (new Date() - new Date(cita.fecha_original)) / (1000 * 60 * 60);
    
    if (cita.estado === 'reserva' && horas > 24) return 'high';
    if (cita.estado === 'reserva' && horas > 48) return 'critical';
    if (cita.estado === 'pendiente_confirmacion' && horas > 48) return 'low'; // Probablemente perdido
    if (cita.estado === 'evaluacion_en_curso' && horas > 4) return 'high'; // Mucho tiempo en rampa sin tasación
    
    return 'normal';
  };

  const mapToOperationalProps = (e) => {
    let defaultOwner = e.experto_asignado || null;

    if (!defaultOwner) {
      if (['reserva', 'validado', 'pendiente_confirmacion', 'confirmada'].includes(e.estado)) {
        defaultOwner = 'Atención al Cliente';
      } else if (e.estado === 'evaluacion_en_curso') {
        const teamObj = teams.find(t => t._id === e.team_asignado || t._id === e.team_asignado?._id);
        if (teamObj) {
          defaultOwner = `Team ${teamObj.nombre} (${teamObj.responsable || 'Líder'})`;
        } else {
          defaultOwner = e.team_asignado?.nombre ? `Team ${e.team_asignado.nombre}` : 'Jefe de Taller';
        }
      }
    }

    const extraDetails = [];
    if (e.estado === 'evaluacion_en_curso') {
      if (e.producto && e.producto.precio) {
        extraDetails.push({ label: 'Cotización', value: `S/. ${e.producto.precio}`, highlight: true, icon: DollarSign });
      } else if (e.precio_final) {
        extraDetails.push({ label: 'Precio Base', value: `S/. ${e.precio_final}`, highlight: true, icon: DollarSign });
      }

      const teamObj = teams.find(t => t._id === e.team_asignado || t._id === e.team_asignado?._id);
      if (teamObj) {
        extraDetails.push({ label: 'Equipo Asignado', value: `Team ${teamObj.nombre}`, icon: Wrench });
      } else if (e.team_asignado && e.team_asignado.nombre) {
        extraDetails.push({ label: 'Equipo Asignado', value: `Team ${e.team_asignado.nombre}`, icon: Wrench });
      }
      
      if (e.notas || e.descripcion_trabajo) {
        const n = e.notas || e.descripcion_trabajo;
        extraDetails.push({ label: 'Notas', value: n, icon: FileText });
      }
    }

    return {
      id: e.id,
      priority: calcularPrioridad(e),
      identity: {
        marca: e.vehiculo?.marca,
        modelo: e.vehiculo?.modelo,
        anio: e.vehiculo?.anio,
        patente: e.vehiculo?.patente,
        cliente: e.cliente
      },
      owner: defaultOwner,
      extraDetails,
      onDoubleClick: () => handleOpenEditar(e)
    };
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

  const handlePatenteChange = (e) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (val.length > 3) {
      val = val.slice(0, 3) + '-' + val.slice(3, 6);
    }
    e.target.value = val;
  };

  const handleSubmitNuevoIngreso = async (e) => {
    e.preventDefault();
    const form = e.target;
    const nombre = form.nombre?.value || '';
    const apellido = form.apellido?.value || '';
    const clienteNombre = `${nombre} ${apellido}`.trim();
    const telefono = form.telefono?.value || ''; 
    const marca = form.marca?.value || 'Genérica';
    const modelo = form.modelo?.value || 'Vehículo';
    const anio = parseInt(form.anio?.value) || new Date().getFullYear();
    const patente = form.patente?.value?.toUpperCase() || '';
    const notas = form.notas?.value || '';
    
    // Always assume today's date for walk-ins
    const fecha_date = new Date().toISOString().split('T')[0];
    let fecha_time = form.fecha_cita_time?.value;
    
    let fecha_cita;
    if (fecha_time) {
      fecha_cita = new Date(`${fecha_date}T${fecha_time}:00`).toISOString();
    } else {
      // Si no escoge hora, asume ingreso inmediato (sumamos 10 mins para validación futura)
      fecha_cita = new Date(Date.now() + 10 * 60000).toISOString();
    }

    try {
      const payload = {
        nombre_cliente: clienteNombre,
        numero_telefono: telefono,
        servicio: 'Ingreso Walk-in',
        descripcion_trabajo: notas,
        fecha_cita: fecha_cita,
        tipo_cita: 'Evaluación Presencial',
        vehiculo: {
          marca,
          modelo,
          anio,
          patente
        },
        estado: 'reserva' // Admin entries go to "Nuevas Solicitudes" (Column 1)
      };
      
      const res = await api.crearCita(payload);
      if (res && res.ok && res.cita) {
        const c = res.cita;
        const nuevaEval = {
          id: c._id,
          cliente: c.nombre_cliente || clienteNombre,
          numero_telefono: c.numero_telefono || telefono,
          tipo: c.tipo_cita || 'Ingreso Walk-in / Manual',
          fecha: formatearFechaLegible(c.fecha_cita),
          fecha_original: c.fecha_cita,
          estado: 'reserva',
          notas: c.descripcion_trabajo || notas,
          vehiculo: c.vehiculo || { marca, modelo, anio, patente },
          experto_asignado: null
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

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const horasDia = [];
  for (let i = 8; i <= 18; i++) {
    horasDia.push(`${i}:00`);
  }

  const leadsCount = evaluaciones.filter(e => e.estado === 'reserva').length;
  const porEvaluarCount = evaluaciones.filter(e => e.estado === 'validado' || e.estado === 'pendiente_confirmacion').length;
  const diagnosticoCount = evaluaciones.filter(e => e.estado === 'confirmada' || e.estado === 'evaluacion_en_curso').length;
  const canceladasCount = evaluaciones.filter(e => e.estado === 'cancelada').length;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Admisión y Diagnóstico"
        description="Gestiona el flujo operativo desde lead hasta diagnóstico y cotización."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-900/50 p-1 rounded-lg border border-gray-800">
              <button
                onClick={() => setVista('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${vista === 'kanban' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <LayoutGrid className="w-4 h-4" /> Kanban
              </button>
              <button
                onClick={() => setVista('calendario')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${vista === 'calendario' ? 'bg-primary text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
              >
                <CalendarIcon className="w-4 h-4" /> Agenda
              </button>
            </div>
            <Button variant="primary" icon={Plus} onClick={() => setModalNuevoIngreso(true)}>
              Ingreso Manual
            </Button>
          </div>
        }
      />

      {/* Métricas superiores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Leads / Ingresos</CardTitle>
            <AlertCircle className="w-4 h-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{leadsCount}</div>
            <p className="text-xs text-gray-500 mt-1">Por verificar manual</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Por agendar</CardTitle>
            <MessageCircle className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{porEvaluarCount}</div>
            <p className="text-xs text-gray-500 mt-1">Esperando confirmación WP</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">En Taller</CardTitle>
            <Wrench className="w-4 h-4 text-cyan-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{diagnosticoCount}</div>
            <p className="text-xs text-gray-500 mt-1">En diagnóstico/cotización</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between border-b-0">
            <CardTitle className="text-sm font-medium text-gray-400">Descartados</CardTitle>
            <XCircle className="w-4 h-4 text-red-400/70" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{canceladasCount}</div>
            <p className="text-xs text-gray-500 mt-1">Rechazados o no show</p>
          </CardContent>
        </Card>
      </div>

      {vista === 'kanban' ? (
        /* Kanban de Evaluaciones (5 Columnas) */
        <div className="flex gap-4 overflow-x-auto pb-4">
          
          {/* Columna 1: Reservas Nuevas */}
          <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-dark-card/40 backdrop-blur-sm border border-gray-700/50 flex flex-col min-h-[400px] shadow-sm shadow-black/10">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2 cursor-help" title="Leads recién captados, en espera de validación manual.">
              <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5"/> Evaluation Requested
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'reserva').map(e => (
                <OperationalCard 
                  key={e.id}
                  {...mapToOperationalProps(e)}
                  businessState={{
                    current: 'Evaluation Requested',
                    next: 'Needs Technical Assignment'
                  }}
                  nextAction={{
                    label: 'Validar Lead',
                    icon: Check,
                    primary: true,
                    onClick: () => cambiarEstado(e.id, 'validado')
                  }}
                />
              ))}
            </div>
          </div>

          {/* Columna 2: Validados */}
          <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-dark-card/40 backdrop-blur-sm border border-gray-700/50 flex flex-col min-h-[400px] shadow-sm shadow-black/10">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2 cursor-help" title="Leads verificados listos para agendar en planta.">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5"/> Evaluation Scheduled
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'validado').map(e => (
                <OperationalCard 
                  key={e.id}
                  {...mapToOperationalProps(e)}
                  businessState={{
                    current: 'Evaluation Approved',
                    next: 'Needs Customer Confirmation'
                  }}
                  nextAction={{
                    label: 'Solicitar Conf. WP',
                    icon: MessageCircle,
                    primary: false,
                    onClick: () => cambiarEstado(e.id, 'pendiente_confirmacion')
                  }}
                />
              ))}
            </div>
          </div>

          {/* Columna 3: Pendientes WP */}
          <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-dark-card/40 backdrop-blur-sm border border-gray-700/50 flex flex-col min-h-[400px] shadow-sm shadow-black/10">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2 cursor-help" title="Esperando que el cliente confirme su asistencia por WhatsApp.">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5"/> Waiting Customer
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'pendiente_confirmacion').map(e => (
                <OperationalCard 
                  key={e.id}
                  {...mapToOperationalProps(e)}
                  businessState={{
                    current: 'Waiting Customer Confirmation',
                    next: 'Customer Arrival'
                  }}
                  nextAction={{
                    label: 'Forzar "Sí" (Asistirá)',
                    icon: CheckCircle,
                    primary: true,
                    onClick: () => cambiarEstado(e.id, 'confirmada')
                  }}
                />
              ))}
            </div>
          </div>

          {/* Columna 4: Confirmadas */}
          <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-dark-card/40 backdrop-blur-sm border border-gray-700/50 flex flex-col min-h-[400px] shadow-sm shadow-black/10">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2 cursor-help" title="Clientes confirmados para asistir al taller hoy/mañana.">
              <span className="text-[10px] font-bold uppercase tracking-wider text-green-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5"/> Appointment Confirmed
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'confirmada').map(e => (
                <OperationalCard 
                  key={e.id}
                  {...mapToOperationalProps(e)}
                  businessState={{
                    current: 'Appointment Confirmed',
                    next: 'Vehicle Intake / Ramp'
                  }}
                  nextAction={{
                    label: 'Iniciar Cotización',
                    icon: Wrench,
                    primary: true,
                    onClick: () => cambiarEstado(e.id, 'evaluacion_en_curso')
                  }}
                />
              ))}
            </div>
          </div>

          {/* Columna 5: Evaluación en Curso */}
          <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-dark-card/40 backdrop-blur-sm border border-gray-700/50 flex flex-col min-h-[400px] shadow-sm shadow-black/10">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2 cursor-help" title="Autos en planta esperando armado del presupuesto/cotización.">
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5"/> Evaluating & Quoting
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'evaluacion_en_curso').map(e => (
                <OperationalCard 
                  key={e.id}
                  {...mapToOperationalProps(e)}
                  businessState={{
                    current: 'Quoting in Progress',
                    next: 'Send Quote to Customer'
                  }}
                  nextAction={{
                    label: 'Tasar y Enviar',
                    icon: FileText,
                    primary: true,
                    onClick: () => handleOpenTasar(e.id)
                  }}
                />
              ))}
            </div>
          </div>

          {/* Columna 6: Canceladas */}
          <div className="min-w-[280px] max-w-[320px] p-4 rounded-xl bg-dark-card/40 backdrop-blur-sm border border-gray-700/50 flex flex-col min-h-[400px] shadow-sm shadow-black/10 opacity-70 hover:opacity-100 transition-opacity">
            <div className="flex items-center justify-between mb-4 border-b border-gray-850 pb-2 cursor-help" title="Citas que no se concretaron o fueron rechazadas.">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5"/> Discarded / No Show
              </span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar pr-1">
              {evaluaciones.filter(e => e.estado === 'cancelada').map(e => (
                <OperationalCard 
                  key={e.id}
                  {...mapToOperationalProps(e)}
                  businessState={{
                    current: 'Discarded / Cancelled',
                    next: null
                  }}
                  priority="low"
                />
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
                      <div 
                        key={dia} 
                        className="flex-1 border-r border-gray-850/30 p-1 relative hover:bg-gray-900/30 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (!evalObj) {
                            setModalNuevoIngreso(true);
                          }
                        }}
                      >
                        {evalObj && (
                          <div className="absolute inset-1 rounded-lg bg-primary/10 border border-primary/30 p-1.5 overflow-hidden flex flex-col justify-center">
                            <span className="text-[9px] font-bold text-white block truncate">{evalObj.cliente}</span>
                            <span className="text-[8px] text-gray-400 block truncate">{evalObj.tipo}</span>
                          </div>
                        )}
                        
                        {!evalObj && (
                          <div className="hidden group-hover:flex absolute inset-0 items-center justify-center bg-black/40 backdrop-blur-[1px]">
                            <span className="text-[10px] text-white font-bold bg-gray-900 px-2 py-1 rounded border border-gray-700">+ Agendar</span>
                          </div>
                        )}
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
          <div className="w-full max-w-xl rounded-3xl bg-dark-panel border border-gray-800 shadow-2xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto">
            <CloseModalButton onClick={() => setModalNuevoIngreso(false)} absolute />
            
            <div className="mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" /> Nuevo Ingreso Presencial
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Registra un cliente que se encuentra actualmente en el taller.
              </p>
            </div>

            <form onSubmit={handleSubmitNuevoIngreso} className="space-y-4">
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1"><UserPlus className="w-3 h-3"/> Nombre</label>
                  <input type="text" name="nombre" required placeholder="Ej: Luis" className="console-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Apellido</label>
                  <input type="text" name="apellido" required placeholder="Ej: Martinez" className="console-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">WhatsApp (con prefijo)</label>
                  <input 
                    type="tel" 
                    name="telefono" 
                    required
                    pattern="^\+\d{10,15}$" 
                    title="Debe incluir el código de país con el signo + al inicio. Ejemplo: +51999999999" 
                    placeholder="+51..." 
                    className="console-input" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Marca</label>
                  <input type="text" name="marca" list="marcas-list" placeholder="Ej: Toyota" className="console-input" />
                  <datalist id="marcas-list">
                    <option value="Toyota" />
                    <option value="Nissan" />
                    <option value="Chevrolet" />
                    <option value="Hyundai" />
                    <option value="Kia" />
                    <option value="Suzuki" />
                    <option value="Peugeot" />
                    <option value="Ford" />
                    <option value="Volkswagen" />
                    <option value="Honda" />
                    <option value="Mazda" />
                    <option value="BMW" />
                    <option value="Mercedes-Benz" />
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Modelo</label>
                  <input type="text" name="modelo" placeholder="Escribe el modelo..." className="console-input" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Año</label>
                  <input type="number" name="anio" list="anios-list" max={new Date().getFullYear() + 1} min="1950" placeholder={`Ej: ${new Date().getFullYear()}`} className="console-input" />
                  <datalist id="anios-list">
                    {Array.from({length: 30}, (_, i) => new Date().getFullYear() + 1 - i).map(y => (
                      <option key={y} value={y} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Patente</label>
                  <input type="text" name="patente" maxLength={7} onChange={handlePatenteChange} placeholder="ABC-123" className="console-input uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Fecha de Evaluación</label>
                  <input 
                    type="text" 
                    disabled 
                    value="Hoy (Ingreso Inmediato)" 
                    className="console-input text-gray-500 bg-gray-900 cursor-not-allowed" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Hora de Evaluación</label>
                  <input 
                    type="time" 
                    name="fecha_cita_time" 
                    step="1800" 
                    className="console-input text-gray-300 [&::-webkit-calendar-picker-indicator]:filter-invert [&::-webkit-calendar-picker-indicator]:cursor-pointer" 
                    title="Si dejas este campo en blanco, se asume un ingreso inmediato."
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Motivo del Ingreso Inicial</label>
                <textarea 
                  name="notas"
                  rows="3" 
                  required
                  placeholder="El cliente indica que los frenos suenan al frenar..."
                  className="console-input custom-scrollbar"
                />
              </div>

              {/* Acciones */}
              <div className="pt-6 border-t border-gray-800 flex justify-end gap-3">
                <button type="button" onClick={() => setModalNuevoIngreso(false)} className="console-btn-outline">
                  Cancelar
                </button>
                <button type="submit" className="console-btn-primary">
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
              <CloseModalButton onClick={() => setModalTasar(null)} absolute />
              
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
                          <X className="w-3 h-3" />
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
                    ENVIAR A EJECUCIÓN <Send className="w-3 h-3" />
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
            <CloseModalButton onClick={() => setModalEditarCita(null)} absolute />
            
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

              {/* Grid 2: Tipo de Cita, Fecha, Responsable y Estado */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    type="date" 
                    value={editFecha}
                    onChange={e => setEditFecha(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Responsable</label>
                  <input 
                    type="text" 
                    placeholder="Ej: Juan Pérez"
                    value={editResponsable}
                    onChange={e => setEditResponsable(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 text-white rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary outline-none" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Estado Interno</label>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Marca</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Renault"
                      value={editMarca}
                      onChange={e => setEditMarca(e.target.value)}
                      className="console-input" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Modelo</label>
                    <input 
                      type="text" 
                      placeholder="Ej: Logan"
                      value={editModelo}
                      onChange={e => setEditModelo(e.target.value)}
                      className="console-input" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Año</label>
                    <input 
                      type="number" 
                      placeholder="Ej: 2020"
                      value={editAnio}
                      onChange={e => setEditAnio(e.target.value)}
                      className="console-input" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-gray-500 uppercase">Patente (Placa)</label>
                    <input 
                      type="text" 
                      placeholder="Ej: AKE-473"
                      value={editPatente}
                      onChange={e => {
                        let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                        if (val.length > 3) val = val.slice(0, 3) + '-' + val.slice(3, 6);
                        setEditPatente(val);
                      }}
                      maxLength={7}
                      className="console-input uppercase" 
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
