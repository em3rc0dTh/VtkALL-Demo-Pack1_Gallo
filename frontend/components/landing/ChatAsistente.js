'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Wrench } from 'lucide-react';
import { api } from '../../lib/api.js';

export default function ChatAsistente({ taller = {}, triggerOpenMessage, setTriggerOpenMessage }) {
  const nombreAgente = taller.config_agente?.nombre_agente || 'Max';
  const [isOpen, setIsOpen] = useState(false);
  const [telefono, setTelefono] = useState('web_init');
  const [mensajes, setMensajes] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [escribiendo, setEscribiendo] = useState(false);

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
  
  const chatEndRef = useRef(null);

  // Cargar mensajes desde localStorage
  const cargarMensajes = () => {
    if (typeof window !== 'undefined' && telefono !== 'web_init') {
      try {
        const guardados = localStorage.getItem(`mecanica_chat_${telefono}`);
        if (guardados) {
          setMensajes(JSON.parse(guardados));
        } else {
          setMensajes([]);
        }
      } catch (error) {
        console.error('Error al cargar mensajes desde localStorage:', error);
        setMensajes([]);
      }
    }
  };

  // Guardar mensajes en localStorage cuando cambian
  useEffect(() => {
    if (typeof window !== 'undefined' && mensajes.length > 0 && telefono !== 'web_init') {
      try {
        localStorage.setItem(`mecanica_chat_${telefono}`, JSON.stringify(mensajes));
      } catch (error) {
        console.error('Error al guardar mensajes en localStorage:', error);
      }
    }
  }, [mensajes, telefono]);

  useEffect(() => {
    if (telefono !== 'web_init') {
      cargarMensajes();
    }
  }, [telefono]);

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
        const nuevoMsgAsistente = {
          _id: `asistente-${Date.now()}`,
          remitente: 'asistente',
          contenido: res.respuesta,
          recibido_en: new Date().toISOString()
        };

        // Si el backend migró el teléfono de la sesión web al número real
        if (res.cliente && res.cliente.numero_telefono && res.cliente.numero_telefono !== telefono) {
          const nuevoTelefono = res.cliente.numero_telefono;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('mecanica_web_session', nuevoTelefono);
            
            // Obtener el historial viejo (que ya incluye el último mensaje del cliente)
            const historialViejoStr = localStorage.getItem(`mecanica_chat_${telefono}`) || '[]';
            let historialViejoParsed = [];
            try {
              historialViejoParsed = JSON.parse(historialViejoStr);
            } catch (e) {
              historialViejoParsed = [];
            }
            
            const historialNuevo = [...historialViejoParsed, nuevoMsgAsistente];
            localStorage.setItem(`mecanica_chat_${nuevoTelefono}`, JSON.stringify(historialNuevo));
            localStorage.removeItem(`mecanica_chat_${telefono}`);
          }
          
          setTelefono(nuevoTelefono);
        } else {
          setMensajes(prev => [...prev, nuevoMsgAsistente]);
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

  const formatMarkdown = (text) => {
    if (!text) return '';
    const lines = text.split('\n');
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
      const boldRegex = /\*\*(.*?)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(cleanLine)) !== null) {
        if (match.index > lastIndex) {
          parts.push(cleanLine.substring(lastIndex, match.index));
        }
        parts.push(
          <strong key={match.index} className="font-semibold text-primary">
            {match[1]}
          </strong>
        );
        lastIndex = boldRegex.lastIndex;
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

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
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
          {/* Tooltip */}
          <div className="absolute right-20 bg-navy border border-gray-800 text-white text-xs font-semibold px-4 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap pointer-events-none shadow-xl">
            ¿Quieres agendar una cita? Prueba a {nombreAgente} aquí 💬
          </div>
        </button>
      )}

      {/* Ventana de Chat */}
      {isOpen && (
        <div className="w-[360px] h-[500px] rounded-3xl overflow-hidden border border-gray-200 bg-white shadow-2xl flex flex-col transition-all duration-300">
          
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
              <a
                href={`https://wa.me/${(taller.telefono || '+51 933075200').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${nombreAgente}, quiero agendar una cita`)}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-500 hover:bg-slate-100 transition-colors"
                title="Chatear en WhatsApp"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.013-5.102-2.861-6.95C16.628 1.956 14.15 1.901 12.008 1.9c-5.435 0-9.863 4.418-9.867 9.852-.001 1.77.475 3.5 1.378 5.008L2.5 21.082l3.856-1.026-.29-.172zm12.385-6.39c-.33-.165-1.951-.963-2.251-1.073-.3-.109-.518-.165-.738.165-.219.329-.85.85-1.041 1.072-.19.224-.38.247-.71.082-.33-.165-1.393-.513-2.656-1.64-1.044-.93-1.748-2.08-1.953-2.43-.205-.349-.022-.538.143-.703.148-.148.33-.385.495-.578.165-.192.219-.329.329-.548.11-.219.055-.411-.027-.575-.083-.165-.738-1.782-1.011-2.44-.265-.64-.53-.55-.738-.56-.19-.01-.41-.01-.629-.01-.219 0-.575.083-.876.411-.3.33-1.149 1.123-1.149 2.74s1.177 3.178 1.341 3.398c.165.22 2.316 3.535 5.61 4.96.783.339 1.395.541 1.874.693.786.25 1.5.215 2.066.13.63-.095 1.95-.798 2.224-1.57.275-.772.275-1.432.192-1.571-.082-.14-.3-.22-.63-.385z"/>
                </svg>
              </a>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-[#7A7A7A] hover:text-navy hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
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
                <a
                  href={`https://wa.me/${(taller.telefono || '+51 933075200').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola ${nombreAgente}, quiero agendar una cita`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold text-white bg-whatsapp-light hover:bg-whatsapp-light-hover transition-all duration-300 shadow-whatsapp"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.013-5.102-2.861-6.95C16.628 1.956 14.15 1.901 12.008 1.9c-5.435 0-9.863 4.418-9.867 9.852-.001 1.77.475 3.5 1.378 5.008L2.5 21.082l3.856-1.026-.29-.172zm12.385-6.39c-.33-.165-1.951-.963-2.251-1.073-.3-.109-.518-.165-.738.165-.219.329-.85.85-1.041 1.072-.19.224-.38.247-.71.082-.33-.165-1.393-.513-2.656-1.64-1.044-.93-1.748-2.08-1.953-2.43-.205-.349-.022-.538.143-.703.148-.148.33-.385.495-.578.165-.192.219-.329.329-.548.11-.219.055-.411-.027-.575-.083-.165-.738-1.782-1.011-2.44-.265-.64-.53-.55-.738-.56-.19-.01-.41-.01-.629-.01-.219 0-.575.083-.876.411-.3.33-1.149 1.123-1.149 2.74s1.177 3.178 1.341 3.398c.165.22 2.316 3.535 5.61 4.96.783.339 1.395.541 1.874.693.786.25 1.5.215 2.066.13.63-.095 1.95-.798 2.224-1.57.275-.772.275-1.432.192-1.571-.082-.14-.3-.22-.63-.385z"/>
                  </svg>
                  Escribir por WhatsApp
                </a>
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
    </div>
  );
}
