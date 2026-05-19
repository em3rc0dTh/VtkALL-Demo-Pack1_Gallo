'use client';

import { useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Save, Wrench, Shield, Globe, Image, Settings, Sparkles } from 'lucide-react';

export default function TabConfiguracion({ user = {}, onSaveSuccess }) {
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('general'); // 'general' | 'agente' | 'api'
  const [guardando, setGuardando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Form states
  const [nombreTaller, setNombreTaller] = useState('');
  const [slogan, setSlogan] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [sobreNosotros, setSobreNosotros] = useState('');
  const [anosExperiencia, setAnosExperiencia] = useState('');
  const [clientesAtendidos, setClientesAtendidos] = useState('');
  const [autosReparados, setAutosReparados] = useState('');
  
  // Agente IA states
  const [nombreAgente, setNombreAgente] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [instruccionesBase, setInstruccionesBase] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Galería links (comma separated or editable lines)
  const [galeriaInput, setGaleriaInput] = useState('');

  useEffect(() => {
    cargarConfig();
  }, []);

  const cargarConfig = async () => {
    setLoading(true);
    try {
      const res = await api.getConfiguracion();
      if (res) {
        setNombreTaller(res.nombre_taller || '');
        setSlogan(res.slogan || '');
        setDireccion(res.direccion || '');
        setTelefono(res.telefono || '');
        setWhatsapp(res.whatsapp || '');
        setEmail(res.email || '');
        setSobreNosotros(res.sobre_nosotros || '');
        setAnosExperiencia(res.anos_experiencia || 10);
        setClientesAtendidos(res.clientes_atendidos || 500);
        setAutosReparados(res.autos_reparados || 2000);
        
        if (res.config_agente) {
          setNombreAgente(res.config_agente.nombre_agente || '');
          setMensajeBienvenida(res.config_agente.mensaje_bienvenida || '');
          setInstruccionesBase(res.config_agente.instrucciones_base || '');
          setAvatarUrl(res.config_agente.avatar_url || '');
        }

        if (res.galeria) {
          setGaleriaInput(res.galeria.join('\n'));
        }
      }
    } catch (error) {
      console.error('Error cargando config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setMensajeOk('');
    setMensajeError('');
    setGuardando(true);

    try {
      const galeriaUrls = galeriaInput.split('\n').map(u => u.trim()).filter(u => u.length > 0);
      
      const payload = {
        nombre_taller: nombreTaller,
        slogan,
        direccion,
        telefono,
        whatsapp,
        email,
        sobre_nosotros: sobreNosotros,
        anos_experiencia: parseInt(anosExperiencia),
        clientes_atendidos: parseInt(clientesAtendidos),
        autos_reparados: parseInt(autosReparados),
        config_agente: {
          nombre_agente: nombreAgente,
          mensaje_bienvenida: mensajeBienvenida,
          instrucciones_base: instruccionesBase,
          avatar_url: avatarUrl
        },
        galeria: galeriaUrls
      };

      const response = await api.actualizarConfiguracion(payload);
      setMensajeOk('¡Configuración actualizada con éxito!');
      if (onSaveSuccess && response && response.taller) {
        onSaveSuccess(response.taller);
      }
      setTimeout(() => setMensajeOk(''), 4000);
    } catch (err) {
      setMensajeError(err.message || 'Error al guardar los cambios');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub menu de configuración */}
      <div className="flex justify-between items-center bg-[#111827]/40 p-4 rounded-2xl border border-gray-800">
        <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setSubTab('general')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'general' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Datos Generales
          </button>
          <button
            onClick={() => setSubTab('agente')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'agente' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Agente Inteligente Max
          </button>
          <button
            onClick={() => setSubTab('api')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'api' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" /> Webhook y APIs
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <form onSubmit={handleGuardar} className="space-y-6">
          
          {mensajeOk && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
              {mensajeOk}
            </div>
          )}
          {mensajeError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
              {mensajeError}
            </div>
          )}

          {/* TAB 1: DATOS GENERALES */}
          {subTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bloque de Identidad */}
              <div className="p-6 rounded-2xl bg-gray-950/20 border border-gray-850 space-y-4">
                <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Identidad de Marca</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">
                      Nombre Taller * {user.rol !== 'soporte' && <span className="text-gray-500 font-normal lowercase">(solo soporte)</span>}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={user.rol !== 'soporte'}
                      value={nombreTaller}
                      onChange={(e) => setNombreTaller(e.target.value)}
                      className={`w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500 ${
                        user.rol !== 'soporte' ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Slogan</label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Sobre Nosotros</label>
                  <textarea
                    rows="4"
                    value={sobreNosotros}
                    onChange={(e) => setSobreNosotros(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Bloque de Contacto */}
              <div className="p-6 rounded-2xl bg-gray-950/20 border border-gray-850 space-y-4">
                <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Datos de Contacto</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Dirección Física</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Años Exp.</label>
                    <input
                      type="number"
                      value={anosExperiencia}
                      onChange={(e) => setAnosExperiencia(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Clientes</label>
                    <input
                      type="number"
                      value={clientesAtendidos}
                      onChange={(e) => setClientesAtendidos(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Autos Rep.</label>
                    <input
                      type="number"
                      value={autosReparados}
                      onChange={(e) => setAutosReparados(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bloque de Galería */}
              <div className="p-6 rounded-2xl bg-gray-950/20 border border-gray-850 md:col-span-2 space-y-3">
                <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider">Galería de Imágenes (Unsplash URLs)</span>
                <p className="text-[10px] text-gray-500">Ingresa una URL de imagen por línea para renderizar en la landing page principal.</p>
                <textarea
                  rows="4"
                  value={galeriaInput}
                  onChange={(e) => setGaleriaInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none font-mono focus:ring-1 focus:ring-orange-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: CONFIG AGENTE IA */}
          {subTab === 'agente' && (
            <div className="p-6 rounded-2xl bg-gray-950/20 border border-gray-850 space-y-4">
              <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Comportamiento del Agente Virtual ({nombreAgente})</span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">
                    Nombre del Agente IA * {user.rol !== 'soporte' && <span className="text-gray-500 font-normal lowercase">(solo soporte)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={user.rol !== 'soporte'}
                    value={nombreAgente}
                    onChange={(e) => setNombreAgente(e.target.value)}
                    className={`w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500 ${
                      user.rol !== 'soporte' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-450 uppercase mb-1">Mensaje de Bienvenida por WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={mensajeBienvenida}
                    onChange={(e) => setMensajeBienvenida(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">URL de Imagen del Avatar</label>
                  <div className="flex gap-2 items-center">
                    {avatarUrl && (
                      <img 
                        src={avatarUrl} 
                        alt="Avatar Preview" 
                        className="w-8 h-8 rounded-full object-cover border border-gray-700 bg-gray-800"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=100';
                        }}
                      />
                    )}
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-455 uppercase mb-1">Instrucciones de System Prompt / Personalidad</label>
                <p className="text-[10px] text-gray-500 mb-2">Define las directivas de comportamiento del agente para Gemini (cómo presentarse, consultar la agenda, etc.).</p>
                <textarea
                  rows="8"
                  value={instruccionesBase}
                  onChange={(e) => setInstruccionesBase(e.target.value)}
                  placeholder="Sos Max, el asistente virtual del taller MecánicaPro..."
                  className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-orange-500 font-light leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB 3: WEBHOOKS Y APIS */}
          {subTab === 'api' && (
            <div className="p-6 rounded-2xl bg-gray-950/20 border border-gray-850 space-y-6 text-xs">
              <span className="block text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">Conectores de API de Producción</span>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-900 border border-gray-850">
                  <h4 className="font-bold text-white mb-2 uppercase text-[10px] tracking-wider text-orange-400">Endpoint Webhook del Taller</h4>
                  <p className="text-gray-500 mb-2 leading-relaxed">
                    Para conectar Twilio Sandbox a tu backend, configura el Webhook de WhatsApp entrante en la consola de Twilio con la siguiente URL:
                  </p>
                  <div className="bg-gray-950 p-3 rounded-xl border border-gray-800 font-mono text-[11px] select-all text-white flex justify-between items-center">
                    <span>http://localhost:4000/api/webhook/whatsapp</span>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-sans font-semibold">POST</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-gray-900 border border-gray-850 space-y-3">
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider text-orange-400">Estado de Credenciales (.env)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center border-b border-gray-850/50 pb-2">
                      <span className="text-gray-500">Gemini LLM API Key:</span>
                      <span className="font-mono text-gray-300 font-bold">CONFIGURADO OK</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-850/50 pb-2">
                      <span className="text-gray-500">Twilio Webhook:</span>
                      <span className="font-mono text-gray-350">PRODUCCIÓN MOCK / ACTIVADO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón inferior guardar */}
          <div className="flex justify-end pt-4 border-t border-gray-850/60">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-lg shadow-orange-600/10 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> {guardando ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
