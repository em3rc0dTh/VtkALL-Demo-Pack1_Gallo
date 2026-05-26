'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Wrench, Calendar, Clock, User, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import BookingFlow from './BookingFlow';

export default function ChatAsistente({ taller = {}, triggerOpenMessage, setTriggerOpenMessage, openChat, setOpenChat }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  const [isOpen, setIsOpen] = useState(false);
  const [telefono, setTelefono] = useState('web_init');
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

  // Client info loaded from DB
  const [clienteData, setClienteData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_anio: ''
  });

  // Modal calendar states
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDateStr, setSelectedDateStr] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsDisponibles, setSlotsDisponibles] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);

  // Booking Form states
  const [formNombre, setFormNombre] = useState('');
  const [formDni, setFormDni] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formServicio, setFormServicio] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formAnio, setFormAnio] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Inicializar identificador único de sesión web al montar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let saved = localStorage.getItem('mecanica_web_session');
      if (!saved) {
        saved = `web_${Math.random().toString(36).substring(2, 11)}`;
        localStorage.setItem('mecanica_web_session', saved);
      }
      setTelefono(saved);
    }
  }, []);

  // Cargar servicios disponibles al montar
  useEffect(() => {
    const cargarServicios = async () => {
      try {
        const data = await api.getServicios();
        if (Array.isArray(data)) {
          setServiciosDisponibles(data);
        }
      } catch (err) {
        console.error('Error al cargar servicios:', err);
      }
    };
    cargarServicios();
  }, []);

  const chatEndRef = useRef(null);

  // Cargar mensajes desde backend (MongoDB)
  const cargarMensajes = async () => {
    if (typeof window !== 'undefined' && telefono !== 'web_init') {
      try {
        const res = await api.getHistorialPublico(telefono);
        if (res && res.ok) {
          setMensajes(res.mensajes || []);
          if (res.cliente) {
            const firstVehiculo = res.cliente.vehiculos && res.cliente.vehiculos[0] ? res.cliente.vehiculos[0] : {};
            setClienteData({
              nombre: res.cliente.nombre || '',
              dni: res.cliente.dni || '',
              telefono: res.cliente.numero_telefono || '',
              vehiculo_marca: firstVehiculo.marca || '',
              vehiculo_modelo: firstVehiculo.modelo || '',
              vehiculo_anio: firstVehiculo.anio || ''
            });
          }
        } else {
          setMensajes([]);
        }
      } catch (error) {
        console.error('Error al cargar mensajes desde backend:', error);
        setMensajes([]);
      }
    }
  };

  useEffect(() => {
    if (telefono !== 'web_init') {
      cargarMensajes();
    }
  }, [telefono]);

  // Pre-rellenar formulario cuando se abre el calendario
  useEffect(() => {
    if (isCalendarOpen) {
      setFormNombre(clienteData.nombre || '');
      setFormDni(clienteData.dni || '');
      
      const isWebSession = telefono.startsWith('web_');
      setFormTelefono(isWebSession ? '' : telefono);
      
      setFormMarca(clienteData.vehiculo_marca || '');
      setFormModelo(clienteData.vehiculo_modelo || '');
      setFormAnio(clienteData.vehiculo_anio || '');
      
      setSelectedDateStr('');
      setSelectedTimeSlot('');
      setBookingError('');
    }
  }, [isCalendarOpen, clienteData, telefono]);

  useEffect(() => {
    if (triggerOpenMessage) {
      setIsOpen(true);
      setTimeout(() => {
        enviarMensaje(triggerOpenMessage);
        setTriggerOpenMessage('');
      }, 300);
    }
  }, [triggerOpenMessage]);

  useEffect(() => {
    if (openChat) {
      setIsOpen(true);
      if (setOpenChat) setOpenChat(false);
    }
  }, [openChat]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, escribiendo]);

  const enviarMensaje = async (textoOverride = '') => {
    const texto = (textoOverride || nuevoMensaje).trim();
    if (!texto) return;

    if (!textoOverride) setNuevoMensaje('');

    const temporalId = `cliente-${Date.now()}`;
    const nuevoMsgCliente = {
      _id: temporalId,
      remitente: 'cliente',
      contenido: texto,
      recibido_en: new Date().toISOString()
    };

    setMensajes(prev => [...prev, nuevoMsgCliente]);
    setEscribiendo(true);

    try {
      const res = await api.enviarMensajeSimulado(telefono, texto);
      if (res && res.ok && res.respuesta) {
        const containsTrigger = res.respuesta.includes('[ABRIR_CALENDARIO]');
        const cleanRespuesta = res.respuesta.replace('[ABRIR_CALENDARIO]', '').trim();
        
        const nuevoMsgAsistente = {
          _id: `asistente-${Date.now()}`,
          remitente: 'asistente',
          contenido: cleanRespuesta,
          recibido_en: new Date().toISOString()
        };

        // Si el backend migró el teléfono de la sesión web al número real
        if (res.cliente && res.cliente.numero_telefono && res.cliente.numero_telefono !== telefono) {
          const nuevoTelefono = res.cliente.numero_telefono;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('mecanica_web_session', nuevoTelefono);
          }
          
          setTelefono(nuevoTelefono); // Esto disparará cargarMensajes automáticamente
        } else {
          setMensajes(prev => [...prev, nuevoMsgAsistente]);
        }

        if (containsTrigger) {
          setIsCalendarOpen(true);
        }
      } else {
        throw new Error('Respuesta inválida de la simulación');
      }
    } catch (err) {
      console.error('Error al enviar mensaje simulado:', err);
      setMensajes(prev => [...prev, {
        _id: `error-${Date.now()}`,
        remitente: 'asistente',
        contenido: '🔧 Lo siento, tengo un problema para conectarme con el taller. Intenta de nuevo.',
        recibido_en: new Date().toISOString()
      }]);
    } finally {
      setEscribiendo(false);
    }
  };

  const handleQuickReply = (replyText) => {
    enviarMensaje(replyText);
  };

  // Calendar Helpers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = (firstDayIndex + 6) % 7;
    
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push({ day: null, dateStr: '' });
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
      days.push({ day: d, dateStr });
    }
    
    return days;
  };

  const handleSelectDay = async (dateStr) => {
    setSelectedDateStr(dateStr);
    setSelectedTimeSlot('');
    setLoadingSlots(true);
    try {
      const res = await api.getDisponibilidadPublica(dateStr);
      if (res && res.ok) {
        setSlotsDisponibles(res.horarios_disponibles || []);
      } else {
        setSlotsDisponibles([]);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setSlotsDisponibles([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDateStr || !selectedTimeSlot) {
      setBookingError('Por favor selecciona una fecha y una hora.');
      return;
    }
    
    setBookingLoading(true);
    setBookingError('');
    
    try {
      const fechaHoraCita = `${selectedDateStr}T${selectedTimeSlot}:00`;
      
      const payload = {
        numero_telefono: formTelefono,
        nombre_cliente: formNombre,
        dni: formDni,
        servicio: formServicio,
        vehiculo_marca: formMarca,
        vehiculo_modelo: formModelo,
        vehiculo_anio: formAnio ? parseInt(formAnio) : undefined,
        fecha_cita: fechaHoraCita,
        _session_telefono: telefono
      };

      const res = await api.agendarCitaPublica(payload);
      if (res && res.ok) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('mecanica_web_session', formTelefono);
        }
        
        setTelefono(formTelefono);
        setIsCalendarOpen(false);
        
        if (formTelefono === telefono) {
          cargarMensajes();
        }
      } else {
        throw new Error(res.error || 'No se pudo reservar la cita.');
      }
    } catch (err) {
      console.error('Error al agendar cita pública:', err);
      setBookingError(err.message || 'Error del servidor al agendar la cita.');
    } finally {
      setBookingLoading(false);
    }
  };

  const formatMarkdown = (text) => {
    if (!text) return '';
    let cleanText = text.replace('[ABRIR_CALENDARIO]', '').trim();
    const lines = cleanText.split('\n');
    return lines.map((line, idx) => {
      let isBullet = false;
      let cleanLine = line;

      if (line.trim().startsWith('- ')) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      } else if (line.trim().startsWith('* ')) {
        isBullet = true;
        cleanLine = line.trim().substring(2);
      }

      const parts = [];
      const regex = /(\*\*(.*?)\*\*|\[(.*?)\]\((.*?)\))/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        if (match[2] !== undefined) {
          parts.push(
            <strong key={match.index} className="font-semibold text-primary">
              {match[2]}
            </strong>
          );
        } else if (match[3] !== undefined && match[4] !== undefined) {
          const url = match[4];
          const text = match[3];
          
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1 && (url.startsWith('/') || url.startsWith('#') || (typeof window !== 'undefined' && !url.startsWith('http')))) {
            const targetId = url.substring(hashIndex + 1);
            parts.push(
              <a
                key={match.index}
                href={url}
                onClick={(e) => {
                  e.preventDefault();
                  const element = document.getElementById(targetId);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-primary hover:text-primary-hover font-bold underline transition-colors cursor-pointer"
              >
                {text}
              </a>
            );
          } else {
            const isInternal = url.startsWith('/') || (typeof window !== 'undefined' && (url.startsWith('http://localhost') || url.includes(window.location.host)));
            if (isInternal) {
              parts.push(
                <a
                  key={match.index}
                  href={url}
                  className="text-primary hover:text-primary-hover font-bold underline transition-colors"
                >
                  {text}
                </a>
              );
            } else {
              parts.push(
                <a
                  key={match.index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-hover font-bold underline transition-colors"
                >
                  {text}
                </a>
              );
            }
          }
        }
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < cleanLine.length) {
        parts.push(cleanLine.substring(lastIndex));
      }

      const content = parts.length > 0 ? parts : cleanLine;

      if (isBullet) {
        return (
          <li key={idx} className="list-disc ml-4 my-1 pl-0.5">
            {content}
          </li>
        );
      }

      return (
        <span key={idx} className="block min-h-[1.2em]">
          {content}
        </span>
      );
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      enviarMensaje();
    }
  };

  const obtenerServicioElegido = () => {
    if (!Array.isArray(mensajes) || !Array.isArray(serviciosDisponibles)) return '';
    // Escanear los mensajes de más nuevo a más antiguo
    for (let i = mensajes.length - 1; i >= 0; i--) {
      const m = mensajes[i];
      if (m.remitente === 'cliente') {
        const contentLow = m.contenido.toLowerCase();
        // Intentar hacer match exacto de nombre de servicio
        for (const s of serviciosDisponibles) {
          if (contentLow.includes(s.nombre.toLowerCase())) {
            return s.nombre;
          }
        }
        // Buscar palabras clave comunes de servicios
        if (contentLow.includes('aceite') || contentLow.includes('mantenimiento preventivo')) {
          const match = serviciosDisponibles.find(s => s.nombre.toLowerCase().includes('aceite') || s.nombre.toLowerCase().includes('preventiva'));
          if (match) return match.nombre;
        }
        if (contentLow.includes('freno')) {
          const match = serviciosDisponibles.find(s => s.nombre.toLowerCase().includes('freno'));
          if (match) return match.nombre;
        }
        if (contentLow.includes('planchado') || contentLow.includes('pintura')) {
          const match = serviciosDisponibles.find(s => s.nombre.toLowerCase().includes('planchado') || s.nombre.toLowerCase().includes('pintura'));
          if (match) return match.nombre;
        }
        if (contentLow.includes('detailing') || contentLow.includes('cerámico') || contentLow.includes('ceramico') || contentLow.includes('tratamiento')) {
          const match = serviciosDisponibles.find(s => s.nombre.toLowerCase().includes('detailing') || s.nombre.toLowerCase().includes('cerámico') || s.nombre.toLowerCase().includes('ceramico'));
          if (match) return match.nombre;
        }
      }
    }
    return '';
  };

  const handleBookingSuccess = (realTelefono) => {
    if (realTelefono) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('mecanica_web_session', realTelefono);
      }
      setTelefono(realTelefono);
    }
    // Cargar los mensajes para que aparezcan la solicitud y la confirmación en el chat
    setTimeout(() => {
      cargarMensajes();
    }, 500);
  };

  const ultimoMensaje = mensajes[mensajes.length - 1];
  const esPreguntaCalendario = ultimoMensaje &&
                               ultimoMensaje.remitente === 'asistente' &&
                               (ultimoMensaje.contenido.toLowerCase().includes('abrirte un calendario') ||
                                ultimoMensaje.contenido.toLowerCase().includes('mostrarte las citas o las horas disponibles'));

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 font-sans">
      {/* Botón Flotante */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full bg-primary hover:bg-primary-hover text-white flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 relative group cursor-pointer"
        >
          <MessageSquare className="w-7 h-7 fill-current" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
          </span>
          {/* Tooltip (hidden on mobile, visible on desktop) */}
          <div className="hidden sm:block absolute right-20 bg-navy border border-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-xl">
            ¿Quieres agendar una cita? Prueba a {nombreAgente} aquí 💬
          </div>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="w-[calc(100vw-32px)] sm:w-[360px] h-[500px] max-h-[calc(100vh-60px)] rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-2xl flex flex-col transition-all duration-300">
          
          {/* Header */}
          <div className="bg-light-panel p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {taller.config_agente?.avatar_url ? (
                <img 
                  src={taller.config_agente.avatar_url} 
                  alt={nombreAgente} 
                  className="w-10 h-10 rounded-full object-cover border border-primary/20 bg-slate-100"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=100';
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold text-white text-sm">
                  🤖
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-navy">{nombreAgente}</h4>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-[#7A7A7A]">Activo ahora</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#7A7A7A] hover:text-navy hover:bg-slate-100 transition-colors"
                title="Minimizar chat"
              >
                <Minimize2 className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Body de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-light-panel">
            {mensajes.length === 0 && (
              <div className="text-center py-10 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary mb-3">
                  <Wrench className="w-6 h-6" />
                </div>
                <p className="text-xs text-[#7A7A7A] px-6 mb-4">
                  ¡Hola! Envía un mensaje para iniciar tu reserva o resolver dudas. {nombreAgente} responderá al instante.
                </p>
              </div>
            )}
            
            {mensajes.map((m) => (
              <div 
                key={m._id} 
                className={`flex ${m.remitente === 'cliente' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                  m.remitente === 'cliente'
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/60 rounded-bl-none shadow-sm'
                }`}>
                  <div className="whitespace-pre-wrap">{formatMarkdown(m.contenido)}</div>
                  <span className={`block text-[8px] text-right mt-1.5 ${
                    m.remitente === 'cliente' ? 'text-blue-200' : 'text-[#7A7A7A]'
                  }`}>
                    {new Date(m.recibido_en).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {escribiendo && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-450 rounded-2xl rounded-bl-none px-4 py-3 text-xs border border-slate-200/60 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            
            {esPreguntaCalendario && (
              <div className="flex gap-2 justify-start pl-2 py-1">
                <button
                  type="button"
                  onClick={() => handleQuickReply('Sí, abrir calendario')}
                  className="px-3.5 py-2 bg-blue-50 hover:bg-primary hover:text-white border border-primary/40 text-primary text-xs font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  Sí, abrir calendario 📅
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickReply('No, prefiero escribir')}
                  className="px-3.5 py-2 bg-slate-50 hover:bg-slate-200 border border-slate-350 text-slate-700 text-xs font-bold rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
                >
                  No, prefiero escribir ✍️
                </button>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 bg-light-panel border-t border-gray-200 flex items-center gap-2">
            <input
              type="text"
              placeholder="Escribe un mensaje..."
              value={nuevoMensaje}
              onChange={(e) => setNuevoMensaje(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 bg-white border border-gray-200 text-slate-800 rounded-xl px-4 py-2.5 text-xs focus:ring-1 focus:ring-primary outline-none shadow-sm"
            />
            <button
              onClick={() => enviarMensaje()}
              className="p-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4 fill-current" />
            </button>
          </div>

        </div>
      )}

      {/* Modal de Calendario */}
      {isCalendarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <BookingFlow
            taller={taller}
            onClose={() => setIsCalendarOpen(false)}
            initialNombre={clienteData.nombre || ''}
            initialDni={clienteData.dni || ''}
            initialTelefono={telefono.startsWith('web_') ? '' : telefono}
            initialServicio={obtenerServicioElegido()}
            onSuccess={handleBookingSuccess}
          />
        </div>
      )}
    </div>
  );
}