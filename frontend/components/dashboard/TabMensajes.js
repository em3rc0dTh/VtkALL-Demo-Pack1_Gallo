'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Search, Send, RefreshCw, MessageSquare, ShieldCheck, User } from 'lucide-react';
import Swal from 'sweetalert2';

export default function TabMensajes() {
  const [conversaciones, setConversaciones] = useState([]);
  const [loadingConv, setLoadingConv] = useState(true);
  const [activeNro, setActiveNro] = useState('');
  const [activeCliente, setActiveCliente] = useState(null);
  
  const [mensajes, setMensajes] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [nombreAgente, setNombreAgente] = useState('Max');
  
  const chatEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    cargarConversaciones(true);
    
    // Iniciar polling automático cada 5 segundos
    pollIntervalRef.current = setInterval(() => {
      cargarConversaciones(false);
    }, 5000);

    // Cargar configuración de taller para el nombre de agente
    const cargarNombreAgente = async () => {
      try {
        const res = await api.getConfiguracion();
        if (res && res.config_agente?.nombre_agente) {
          setNombreAgente(res.config_agente.nombre_agente);
        }
      } catch (err) {
        console.error('Error al cargar config para el nombre del agente:', err);
      }
    };
    cargarNombreAgente();

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Polling para mensajes de la conversación activa
  useEffect(() => {
    let activePoll = null;
    if (activeNro) {
      cargarMensajes(activeNro, false);
      activePoll = setInterval(() => {
        cargarMensajes(activeNro, false);
      }, 4000);
    }
    return () => {
      if (activePoll) clearInterval(activePoll);
    };
  }, [activeNro]);

  const cargarConversaciones = async (showLoading = false) => {
    if (showLoading) setLoadingConv(true);
    try {
      const res = await api.getConversaciones();
      if (res && res.conversaciones) {
        setConversaciones(res.conversaciones);
      }
    } catch (err) {
      console.error('Error al cargar conversaciones:', err);
    } finally {
      if (showLoading) setLoadingConv(false);
    }
  };

  const cargarMensajes = async (nro, showLoading = false) => {
    if (showLoading) setLoadingChat(true);
    try {
      const res = await api.getMensajes(nro);
      if (res) {
        setMensajes(res.mensajes || []);
        setActiveCliente(res.cliente);
      }
    } catch (err) {
      console.error('Error cargando mensajes:', err);
    } finally {
      if (showLoading) setLoadingChat(false);
    }
  };

  const handleSelectConv = (nro) => {
    setActiveNro(nro);
    cargarMensajes(nro, true);
    
    // Marcar como leído en la lista de forma inmediata para mejorar UX
    setConversaciones(prev => 
      prev.map(c => c.numero_telefono === nro ? { ...c, no_leidos: 0 } : c)
    );
  };

  const handleEnviarRespuesta = async (e) => {
    e.preventDefault();
    const contenido = nuevoMensaje.trim();
    if (!contenido || !activeNro || enviando) return;

    setNuevoMensaje('');
    setEnviando(true);

    // Agregar local temporal
    const tempId = Date.now().toString();
    setMensajes(prev => [...prev, {
      _id: tempId,
      remitente: 'asistente',
      contenido,
      recibido_en: new Date()
    }]);

    try {
      await api.enviarMensajeManual(activeNro, contenido);
      await cargarMensajes(activeNro, false);
      cargarConversaciones(false);
    } catch (err) {
      console.error('Error al enviar respuesta:', err);
      Swal.fire({
        title: 'Error',
        text: 'Error al enviar respuesta manual.',
        icon: 'error',
        background: '#111827',
        color: '#fff',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  return (
    <div className="h-[calc(100vh-210px)] min-h-[480px] flex rounded-3xl border border-gray-800 bg-dark-panel/40 overflow-hidden font-sans">
      
      {/* Panel Izquierdo: Conversaciones */}
      <div className="w-1/3 border-r border-gray-800 flex flex-col bg-dark-aside/80">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/20">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-300">Chats WhatsApp</h3>
          <button 
            onClick={() => cargarConversaciones(true)} 
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Buscador de chat */}
        <div className="p-3 border-b border-gray-800/40">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar por número..."
              className="w-full bg-gray-950 border border-gray-850 rounded-xl pl-9 pr-4 py-2 text-[11px] text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Listado de Chats */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-850/40">
          {loadingConv ? (
            <LoadingSpinner />
          ) : conversaciones.length === 0 ? (
            <div className="text-center py-10 text-[11px] text-gray-500">No hay conversaciones registradas.</div>
          ) : (
            conversaciones.map((conv) => {
              const active = conv.numero_telefono === activeNro;
              const f = new Date(conv.recibido_en);
              return (
                <div
                  key={conv.numero_telefono}
                  onClick={() => handleSelectConv(conv.numero_telefono)}
                  className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                    active ? 'bg-primary/10 border-l-4 border-primary' : 'hover:bg-gray-900/20'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate pr-2">
                        {conv.nombre_cliente}
                      </h4>
                      <span className="text-[9px] text-gray-500 flex-shrink-0">
                        {f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="block text-[10px] text-gray-400 font-mono mb-1">{conv.numero_telefono}</span>
                    <p className="text-[10px] text-gray-500 truncate font-light">
                      {conv.remitente_ultimo === 'asistente' ? 'Tú: ' : ''}{conv.ultimo_mensaje}
                    </p>
                  </div>
                  
                  {/* Globo no leídos */}
                  {conv.no_leidos > 0 && (
                    <span className="ml-3 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
                      {conv.no_leidos}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Panel Derecho: Chat Activo */}
      <div className="flex-1 flex flex-col bg-dark-aside/30">
        {activeNro ? (
          <>
            {/* Header del Chat */}
            <div className="p-4 border-b border-gray-800 bg-dark-panel/80 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-sm">
                  {activeCliente?.nombre?.charAt(0) || 'C'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {activeCliente?.nombre || 'Cliente Nuevo'}
                  </h4>
                  <span className="text-[10px] text-gray-500 font-mono">{activeNro}</span>
                </div>
              </div>
              
              {activeCliente?.vehiculos?.length > 0 && (
                <div className="text-[10px] bg-gray-900 border border-gray-800 px-3 py-1 rounded-xl text-gray-400">
                  Vehículo: <span className="text-white font-bold">{activeCliente.vehiculos[0].marca} {activeCliente.vehiculos[0].modelo}</span>
                </div>
              )}
            </div>

            {/* Historial de Mensajes */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-950/20">
              {loadingChat ? (
                <LoadingSpinner />
              ) : (
                mensajes.map((m) => {
                  const deCliente = m.remitente === 'cliente';
                  const deAdminManual = m.nombre_cliente === 'Dashboard Admin';
                  const f = new Date(m.recibido_en);
                  return (
                    <div
                      key={m._id}
                      className={`flex ${deCliente ? 'justify-start' : 'justify-end'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        deCliente
                          ? 'bg-[#1e293b] text-gray-150 border border-gray-800/60 rounded-bl-none'
                          : deAdminManual
                            ? 'bg-primary text-white rounded-br-none shadow-btn-primary'
                            : 'bg-gray-800 text-gray-300 rounded-br-none'
                      }`}>
                        {/* Nombre arriba si no es cliente */}
                        {!deCliente && (
                          <span className="block text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">
                            {deAdminManual ? 'Tú (Manual)' : `${nombreAgente} (IA Agent)`}
                          </span>
                        )}
                        <p className="whitespace-pre-wrap">{m.contenido}</p>
                        <span className="block text-[8px] text-gray-500 text-right mt-1.5">
                          {f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Caja de Texto */}
            <form onSubmit={handleEnviarRespuesta} className="p-4 border-t border-gray-850 bg-dark-card/30 flex gap-3">
              <input
                type="text"
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe una respuesta manual..."
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-550 outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={enviando || !nuevoMensaje.trim()}
                className="p-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl flex items-center justify-center transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4 fill-current" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Centro de Mensajería</h3>
              <p className="text-xs text-gray-500 max-w-xs font-light">
                Selecciona una conversación de la columna izquierda para leer el historial de chat con el cliente o enviar respuestas manuales.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
