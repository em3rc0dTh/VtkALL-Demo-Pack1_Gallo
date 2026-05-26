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

  // Configuración de citas
  const [horaInicioCitas, setHoraInicioCitas] = useState('11:00');
  const [horaFinCitas, setHoraFinCitas] = useState('13:00');
  const [diasPermitidosCitas, setDiasPermitidosCitas] = useState([1, 2, 3, 4, 5, 6]);

  // Galería links (comma separated or editable lines)
  const [galeriaInput, setGaleriaInput] = useState('');
  const [urlFondo, setUrlFondo] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [promociones, setPromociones] = useState([]);

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
        setUrlFondo(res.url_fondo || '');
        setBrochureUrl(res.brochure_url || '');
        
        if (res.config_agente) {
          setNombreAgente(res.config_agente.nombre_agente || '');
          setMensajeBienvenida(res.config_agente.mensaje_bienvenida || '');
          setInstruccionesBase(res.config_agente.instrucciones_base || '');
          setAvatarUrl(res.config_agente.avatar_url || '');
        }

        if (res.config_citas) {
          setHoraInicioCitas(res.config_citas.hora_inicio || '11:00');
          setHoraFinCitas(res.config_citas.hora_fin || '13:00');
          setDiasPermitidosCitas(res.config_citas.dias_permitidos || [1, 2, 3, 4, 5, 6]);
        } else {
          setHoraInicioCitas('11:00');
          setHoraFinCitas('13:00');
          setDiasPermitidosCitas([1, 2, 3, 4, 5, 6]);
        }

        if (res.galeria) {
          setGaleriaInput(res.galeria.join('\n'));
        }

        if (res.promociones) {
          setPromociones(res.promociones);
        } else {
          setPromociones([]);
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
        url_fondo: urlFondo,
        brochure_url: brochureUrl,
        config_agente: {
          nombre_agente: nombreAgente,
          mensaje_bienvenida: mensajeBienvenida,
          instrucciones_base: instruccionesBase,
          avatar_url: avatarUrl
        },
        config_citas: {
          hora_inicio: horaInicioCitas,
          hora_fin: horaFinCitas,
          dias_permitidos: diasPermitidosCitas
        },
        galeria: galeriaUrls,
        promociones: promociones
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

  const presets = [
    { name: 'Robot Asistente', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=120' },
    { name: 'Mecánico Especialista', url: 'https://images.unsplash.com/photo-1517524006079-d7ab6d71039d?auto=format&fit=crop&q=80&w=120' },
    { name: 'Mecánica Experta', url: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&q=80&w=120' },
    { name: 'Logo Tecnológico', url: 'https://images.unsplash.com/photo-1616422285623-13ff0162193c?auto=format&fit=crop&q=80&w=120' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMensajeError('La imagen debe ser menor a 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sub menu de configuración */}
      <div className="flex justify-between items-center bg-[#F9FAFB] p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          <button
            onClick={() => setSubTab('general')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'general' ? 'bg-primary text-white' : 'text-[#54595F] hover:text-navy'
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Datos Generales
          </button>
          <button
            onClick={() => setSubTab('agente')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'agente' ? 'bg-primary text-white' : 'text-[#54595F] hover:text-navy'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> {nombreAgente}
          </button>
          <button
            onClick={() => setSubTab('promociones')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'promociones' ? 'bg-primary text-white' : 'text-[#54595F] hover:text-navy'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> Promociones
          </button>
          <button
            onClick={() => setSubTab('api')}
            type="button"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'api' ? 'bg-primary text-white' : 'text-[#54595F] hover:text-navy'
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
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-bold shadow-sm">
              {mensajeOk}
            </div>
          )}
          {mensajeError && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-250 text-red-600 text-xs font-bold shadow-sm">
              {mensajeError}
            </div>
          )}

          {/* TAB 1: DATOS GENERALES */}
          {subTab === 'general' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Bloque de Identidad */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
                <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Identidad de Marca</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">
                      Nombre Taller * {user.rol !== 'soporte' && <span className="text-gray-400 font-normal lowercase">(solo soporte)</span>}
                    </label>
                    <input
                      type="text"
                      required
                      disabled={user.rol !== 'soporte'}
                      value={nombreTaller}
                      onChange={(e) => setNombreTaller(e.target.value)}
                      className={`w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary ${
                        user.rol !== 'soporte' ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Slogan</label>
                    <input
                      type="text"
                      value={slogan}
                      onChange={(e) => setSlogan(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {user.rol === 'soporte' && (
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">
                      URL Video/Imagen de Fondo (solo soporte)
                    </label>
                    <input
                      type="text"
                      value={urlFondo}
                      onChange={(e) => setUrlFondo(e.target.value)}
                      placeholder="/videos/PixVerse_V6_Image_Text_360P_Create_a_visually_ (2).mp4"
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Sobre Nosotros</label>
                  <textarea
                    rows="4"
                    value={sobreNosotros}
                    onChange={(e) => setSobreNosotros(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Bloque de Contacto */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
                <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Datos de Contacto</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Dirección Física</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Teléfono</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Años Exp.</label>
                    <input
                      type="number"
                      value={anosExperiencia}
                      onChange={(e) => setAnosExperiencia(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Clientes</label>
                    <input
                      type="number"
                      value={clientesAtendidos}
                      onChange={(e) => setClientesAtendidos(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Autos Rep.</label>
                    <input
                      type="number"
                      value={autosReparados}
                      onChange={(e) => setAutosReparados(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Brochure Digital (URL PDF / Drive)</label>
                  <input
                    type="text"
                    value={brochureUrl}
                    onChange={(e) => setBrochureUrl(e.target.value)}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </div>
              </div>

              {/* Bloque de Configuración de Citas */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-4 shadow-sm">
                <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Horarios y Días de Citas</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Hora Inicio</label>
                    <input
                      type="time"
                      value={horaInicioCitas}
                      onChange={(e) => setHoraInicioCitas(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Hora Fin</label>
                    <input
                      type="time"
                      value={horaFinCitas}
                      onChange={(e) => setHoraFinCitas(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-2">Días Permitidos</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 1, label: 'Lunes' },
                      { val: 2, label: 'Martes' },
                      { val: 3, label: 'Miércoles' },
                      { val: 4, label: 'Jueves' },
                      { val: 5, label: 'Viernes' },
                      { val: 6, label: 'Sábado' },
                      { val: 0, label: 'Domingo' }
                    ].map((d) => {
                      const checked = diasPermitidosCitas.includes(d.val);
                      return (
                        <label key={d.val} className="flex items-center gap-2 text-xs text-navy cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setDiasPermitidosCitas([...diasPermitidosCitas, d.val].sort());
                              } else {
                                setDiasPermitidosCitas(diasPermitidosCitas.filter(v => v !== d.val));
                              }
                            }}
                            className="rounded border-gray-300 text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>{d.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bloque de Galería */}
              <div className="p-6 rounded-2xl bg-white border border-gray-200 md:col-span-2 space-y-3 shadow-sm">
                <span className="block text-xs font-bold text-primary uppercase tracking-wider">Galería de Imágenes (Unsplash URLs)</span>
                <p className="text-[10px] text-gray-500">Ingresa una URL de imagen por línea para renderizar en la landing page principal.</p>
                <textarea
                  rows="4"
                  value={galeriaInput}
                  onChange={(e) => setGaleriaInput(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2.5 text-xs outline-none font-mono focus:ring-1 focus:ring-primary"
                />
              </div>

            </div>
          )}

          {/* TAB 2: CONFIG AGENTE IA */}
          {subTab === 'agente' && (
            <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-6 shadow-sm">
              <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Comportamiento del Agente Virtual ({nombreAgente})</span>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">
                    Nombre del Agente IA * {user.rol !== 'soporte' && <span className="text-gray-400 font-normal lowercase">(solo soporte)</span>}
                  </label>
                  <input
                    type="text"
                    required
                    disabled={user.rol !== 'soporte'}
                    value={nombreAgente}
                    onChange={(e) => setNombreAgente(e.target.value)}
                    className={`w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary ${
                      user.rol !== 'soporte' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Mensaje de Bienvenida por WhatsApp</label>
                  <input
                    type="text"
                    required
                    value={mensajeBienvenida}
                    onChange={(e) => setMensajeBienvenida(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Rediseño de Avatar: presets y carga de archivos */}
              <div className="p-5 bg-[#F9FAFB] rounded-2xl border border-gray-200 space-y-4">
                <label className="block text-[10px] font-bold text-primary uppercase tracking-widest">Avatar del Asistente Virtual</label>
                
                {/* Preview actual */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={avatarUrl || 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=120'} 
                      alt="Avatar Preview" 
                      className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-md bg-white"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=100';
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-navy">Vista Previa</h5>
                    <p className="text-[10px] text-gray-500 mt-0.5">Elige un preset, sube un archivo o escribe una URL.</p>
                  </div>
                </div>

                {/* Opción 1: Presets */}
                <div className="space-y-2">
                  <span className="block text-[9px] font-bold text-[#54595F] uppercase">Opción A: Elegir un Avatar Predefinido</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {presets.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setAvatarUrl(preset.url)}
                          className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 bg-white transition-all hover:scale-102 ${
                            isSelected 
                              ? 'border-primary ring-1 ring-primary shadow-sm' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img 
                            src={preset.url} 
                            alt={preset.name} 
                            className="w-10 h-10 rounded-full object-cover border border-gray-100" 
                          />
                          <span className="text-[9px] font-medium text-navy text-center line-clamp-1">{preset.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Opción 2: Subir archivo y convertir a Base64 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold text-[#54595F] uppercase">Opción B: Subir Imagen desde la Computadora</span>
                    <label 
                      htmlFor="avatar-upload"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-gray-300 bg-white hover:border-primary hover:bg-blue-50/10 cursor-pointer text-xs font-semibold text-primary transition-all"
                    >
                      <Image className="w-4 h-4" /> Seleccionar Imagen (Máx 2MB)
                    </label>
                    <input 
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  {/* Opción 3: Input de URL tradicional */}
                  <div className="space-y-2">
                    <span className="block text-[9px] font-bold text-[#54595F] uppercase">Opción C: URL Personalizada</span>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://ejemplo.com/mi-avatar.png"
                      className="w-full bg-white border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Instrucciones de System Prompt / Personalidad</label>
                <p className="text-[10px] text-gray-500 mb-2">Define las directivas de comportamiento del agente para Gemini (cómo presentarse, consultar la agenda, etc.).</p>
                <textarea
                  rows="8"
                  value={instruccionesBase}
                  onChange={(e) => setInstruccionesBase(e.target.value)}
                  placeholder="Eres Max, especialista de atención al cliente de MecánicaPro..."
                  className="w-full bg-[#F9FAFB] border border-gray-200 text-navy rounded-xl px-3 py-2.5 text-xs outline-none focus:ring-1 focus:ring-primary font-light leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* TAB: PROMOCIONES */}
          {subTab === 'promociones' && (
            <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-gray-150 pb-4">
                <div>
                  <span className="block text-xs font-bold text-primary uppercase tracking-wider">Ofertas y Promociones</span>
                  <p className="text-[10px] text-gray-500 mt-0.5">Configura las ofertas que aparecen en la sección derecha de la cabecera (Hero).</p>
                </div>
                <button
                  type="button"
                  disabled={promociones.length >= 4}
                  onClick={() => {
                    setPromociones([
                      ...promociones,
                      {
                        titulo: 'Nueva Promoción',
                        descripcion: 'Descripción de la promoción...',
                        etiqueta: 'PROMO',
                        mensaje_chat: 'Hola, me interesa la promoción...',
                        color_fondo: 'primary',
                        activo: true
                      }
                    ]);
                  }}
                  className={`px-4 py-2 rounded-xl border transition-all text-xs font-semibold select-none ${
                    promociones.length >= 4
                      ? 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                      : 'border-primary text-primary hover:bg-primary hover:text-white cursor-pointer'
                  }`}
                >
                  {promociones.length >= 4 ? 'Límite alcanzado (Máx 4)' : '+ Agregar Promoción'}
                </button>
              </div>

              {promociones.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs italic">
                  No hay promociones configuradas. Se mostrarán las dos por defecto en el Hero.
                </div>
              ) : (
                <div className="space-y-6">
                  {promociones.map((promo, index) => (
                    <div key={index} className="p-5 rounded-2xl bg-[#F9FAFB] border border-gray-200 relative space-y-4">
                      
                      {/* Cabecera de la promo: título de sección y botón eliminar */}
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] font-bold text-navy uppercase tracking-wide">Promoción #{index + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setPromociones(promociones.filter((_, i) => i !== index));
                          }}
                          className="text-red-500 hover:text-red-755 text-xs font-semibold cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>

                      {/* Inputs en grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Título de la Oferta</label>
                          <input
                            type="text"
                            required
                            value={promo.titulo}
                            onChange={(e) => {
                              const updated = [...promociones];
                              updated[index].titulo = e.target.value;
                              setPromociones(updated);
                            }}
                            className="w-full bg-white border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Etiqueta (Badge)</label>
                          <input
                            type="text"
                            value={promo.etiqueta}
                            placeholder="PROMO DEL MES"
                            onChange={(e) => {
                              const updated = [...promociones];
                              updated[index].etiqueta = e.target.value;
                              setPromociones(updated);
                            }}
                            className="w-full bg-white border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Descripción corta</label>
                          <textarea
                            rows="2"
                            required
                            value={promo.descripcion}
                            onChange={(e) => {
                              const updated = [...promociones];
                              updated[index].descripcion = e.target.value;
                              setPromociones(updated);
                            }}
                            className="w-full bg-white border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Mensaje Predeterminado del Chat</label>
                          <input
                            type="text"
                            value={promo.mensaje_chat || ''}
                            placeholder="Hola, me interesa la promoción..."
                            onChange={(e) => {
                              const updated = [...promociones];
                              updated[index].mensaje_chat = e.target.value;
                              setPromociones(updated);
                            }}
                            className="w-full bg-white border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-[#54595F] uppercase mb-1">Color Temático</label>
                            <select
                              value={promo.color_fondo || 'primary'}
                              onChange={(e) => {
                                const updated = [...promociones];
                                updated[index].color_fondo = e.target.value;
                                setPromociones(updated);
                              }}
                              className="w-full bg-white border border-gray-200 text-navy rounded-xl px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                            >
                              <option value="primary">Azul (Primary)</option>
                              <option value="navy">Gris Oscuro (Navy)</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 pt-5">
                            <input
                              id={`promo-activa-${index}`}
                              type="checkbox"
                              checked={promo.activo !== false}
                              onChange={(e) => {
                                const updated = [...promociones];
                                updated[index].activo = e.target.checked;
                                setPromociones(updated);
                              }}
                              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                            />
                            <label htmlFor={`promo-activa-${index}`} className="text-xs font-semibold text-navy cursor-pointer select-none">
                              Mostrar en la web
                            </label>
                          </div>
                        </div>

                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WEBHOOKS Y APIS */}
          {subTab === 'api' && (
            <div className="p-6 rounded-2xl bg-white border border-gray-200 space-y-6 text-xs shadow-sm">
              <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-2">Conectores de API de Producción</span>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-gray-200">
                  <h4 className="font-bold text-primary mb-2 uppercase text-[10px] tracking-wider">Endpoint Webhook del Taller</h4>
                  <p className="text-[#54595F] mb-2 leading-relaxed">
                    Para conectar Twilio Sandbox a tu backend, configura el Webhook de WhatsApp entrante en la consola de Twilio con la siguiente URL:
                  </p>
                  <div className="bg-white p-3 rounded-xl border border-gray-200 font-mono text-[11px] select-all text-navy flex justify-between items-center shadow-sm">
                    <span>http://localhost:4000/api/webhook/whatsapp</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded font-sans font-semibold">POST</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#F9FAFB] border border-gray-200 space-y-3">
                  <h4 className="font-bold text-primary uppercase text-[10px] tracking-wider">Estado de Credenciales (.env)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-[#54595F]">Gemini LLM API Key:</span>
                      <span className="font-mono text-emerald-600 font-bold">CONFIGURADO OK</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                      <span className="text-[#54595F]">Twilio Webhook:</span>
                      <span className="font-mono text-navy">PRODUCCIÓN MOCK / ACTIVADO</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botón inferior guardar */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={guardando}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-btn-primary hover:shadow-btn-primary-hover transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> {guardando ? 'GUARDANDO...' : 'GUARDAR CONFIGURACIÓN'}
            </button>
          </div>

        </form>
      )}

    </div>
  );
}
