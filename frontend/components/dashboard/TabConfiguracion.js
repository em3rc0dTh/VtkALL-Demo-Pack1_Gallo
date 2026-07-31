'use client';

import { useRef, useState, useEffect } from 'react';
import { api } from '../../lib/api.js';
import LoadingSpinner from '../ui/LoadingSpinner.js';
import { Save, Wrench, Shield, Globe, Image as ImageIcon, Settings, Sparkles, LayoutTemplate, Calendar, Users, MessageSquare } from 'lucide-react';
import { Button } from '../ui/Button';
import { LandingBuilderScreen } from '../screens/LandingBuilderScreen';

export default function TabConfiguracion({ user = {}, onSaveSuccess }) {
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('identidad'); 
  const [guardando, setGuardando] = useState(false);
  const [mensajeOk, setMensajeOk] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Estados de Formulario (idénticos al original para no romper el backend)
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
  const [moneda, setMoneda] = useState('PEN');
  const [monedaOriginal, setMonedaOriginal] = useState('PEN');
  const [convertirCatalogo, setConvertirCatalogo] = useState(false);
  const [exchangeRateInfo, setExchangeRateInfo] = useState('');
  const [diasHistorialChat, setDiasHistorialChat] = useState(14);
  
  const [nombreAgente, setNombreAgente] = useState('');
  const [mensajeBienvenida, setMensajeBienvenida] = useState('');
  const [instruccionesBase, setInstruccionesBase] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [colorNombreAgente, setColorNombreAgente] = useState('#0f172a');
  const [alineacionAvatarChat, setAlineacionAvatarChat] = useState('Derecha');

  const [horaInicioCitas, setHoraInicioCitas] = useState('11:00');
  const [horaFinCitas, setHoraFinCitas] = useState('13:00');
  const [diasPermitidosCitas, setDiasPermitidosCitas] = useState([1, 2, 3, 4, 5, 6]);

  const [galeriaInput, setGaleriaInput] = useState('');
  const [urlFondo, setUrlFondo] = useState('');
  const [brochureUrl, setBrochureUrl] = useState('');
  const [promociones, setPromociones] = useState([]);
  
  const fileInputRef = useRef(null);
  const bannerFileInputRef = useRef(null);

  useEffect(() => {
    cargarConfig();
  }, []);

  async function cargarConfig() {
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
        
        const configMoneda = res.moneda || 'PEN';
        setMoneda(configMoneda);
        setMonedaOriginal(configMoneda);
        fetchExchangeRate(configMoneda);
        setDiasHistorialChat(res.dias_historial_chat || 14);

        if (res.config_agente) {
          setNombreAgente(res.config_agente.nombre_agente || '');
          setMensajeBienvenida(res.config_agente.mensaje_bienvenida || '');
          setInstruccionesBase(res.config_agente.instrucciones_base || '');
          setAvatarUrl(res.config_agente.avatar_url || '');
          setBannerUrl(res.config_agente.banner_url || '');
          setColorNombreAgente(res.config_agente.color_nombre_agente || '#0f172a');
          setAlineacionAvatarChat(res.config_agente.alineacion_avatar_chat || 'Derecha');
        }

        if (res.config_citas) {
          setHoraInicioCitas(res.config_citas.hora_inicio || '11:00');
          setHoraFinCitas(res.config_citas.hora_fin || '13:00');
          setDiasPermitidosCitas(res.config_citas.dias_permitidos || [1, 2, 3, 4, 5, 6]);
        }

        if (res.galeria) setGaleriaInput(res.galeria.join('\n'));
        if (res.promociones) setPromociones(res.promociones);
      }
    } catch (error) {
      console.error('Error cargando config:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchExchangeRate(baseCurrency) {
    try {
      setExchangeRateInfo('Cargando...');
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      const data = await response.json();
      if (data && data.rates) {
        const usd = data.rates.USD ? `USD: ${data.rates.USD.toFixed(3)}` : '';
        const eur = data.rates.EUR ? `EUR: ${data.rates.EUR.toFixed(3)}` : '';
        const pen = data.rates.PEN ? `PEN: ${data.rates.PEN.toFixed(3)}` : '';
        setExchangeRateInfo(`1 ${baseCurrency} = ${[usd, eur, pen].filter(Boolean).join(' | ')}`);
      } else {
        setExchangeRateInfo('No disponible');
      }
    } catch (err) {
      setExchangeRateInfo('Error');
    }
  }

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
        moneda,
        convertir_catalogo: convertirCatalogo,
        dias_historial_chat: parseInt(diasHistorialChat) || 14,
        sobre_nosotros: sobreNosotros,
        anos_experiencia: parseInt(anosExperiencia) || 0,
        clientes_atendidos: parseInt(clientesAtendidos) || 0,
        autos_reparados: parseInt(autosReparados) || 0,
        url_fondo: urlFondo,
        brochure_url: brochureUrl,
        config_agente: {
          nombre_agente: nombreAgente,
          mensaje_bienvenida: mensajeBienvenida,
          instrucciones_base: instruccionesBase,
          avatar_url: avatarUrl,
          banner_url: bannerUrl,
          color_nombre_agente: colorNombreAgente,
          alineacion_avatar_chat: alineacionAvatarChat
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
      setMensajeOk('Configuración guardada correctamente.');
      if (onSaveSuccess && response && response.taller) {
        onSaveSuccess(response.taller);
      }
      setMonedaOriginal(moneda);
      setConvertirCatalogo(false);
      setTimeout(() => setMensajeOk(''), 4000);
    } catch (err) {
      setMensajeError(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const presets = [
    { name: 'Robot Asistente', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=120' },
    { name: 'Mecánico', url: 'https://images.unsplash.com/photo-1517524006079-d7ab6d71039d?auto=format&fit=crop&q=80&w=120' },
  ];

  const menuItems = [
    { id: 'identidad', label: 'Identidad', icon: Globe },
    { id: 'marca', label: 'Marca visual', icon: ImageIcon },
    { id: 'landing', label: 'Landing', icon: LayoutTemplate },
    { id: 'canales', label: 'Canales', icon: Sparkles },
    { id: 'agenda', label: 'Agenda', icon: Calendar },
    { id: 'usuarios', label: 'Usuarios y permisos', icon: Shield },
    { id: 'reglas', label: 'Reglas operativas', icon: Settings },
    { id: 'sistema', label: 'Sistema', icon: Wrench },
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex flex-col md:flex-row h-full border border-border-subtle rounded-xl overflow-hidden bg-surface-panel shadow-sm">
      
      {/* MENÚ LATERAL INTERNO */}
      <aside className="w-full md:w-64 bg-surface-subtle/50 border-b md:border-b-0 md:border-r border-border-subtle flex flex-col shrink-0 relative z-10">
        <div className="p-4 border-b border-border-subtle hidden md:block">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Ajustes Generales</span>
        </div>
        <nav className="flex-none md:flex-1 overflow-x-auto md:overflow-y-auto p-3 flex md:flex-col gap-2 md:gap-1 space-y-0 md:space-y-1">
          {menuItems.map(item => {
            const Icon = item.icon;
            const active = activeSection === item.id;
            return (
              <div
                key={item.id}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveSection(item.id);
                }}
                className={`flex-shrink-0 md:w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left cursor-pointer select-none relative z-10 ${
                  active
                    ? 'bg-surface-panel text-action-primary shadow-sm border border-border-subtle'
                    : 'text-text-secondary hover:bg-hover-row hover:text-text-primary'
                }`}
              >
                <Icon className={`w-4 h-4 pointer-events-none ${active ? 'text-action-primary' : 'text-text-muted'}`} />
                <span className="pointer-events-none">{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* ÁREA DE CONTENIDO (FORMULARIO) */}
      <main className="flex-1 flex flex-col min-w-0 bg-surface-panel relative">
        <form onSubmit={handleGuardar} className="flex-1 flex flex-col min-h-0">
          
          {/* Header del contenido */}
          <div className="h-16 px-6 border-b border-border-subtle flex items-center justify-between shrink-0 bg-surface-panel">
            <h3 className="text-lg font-bold text-text-primary">
              {menuItems.find(m => m.id === activeSection)?.label}
            </h3>
            <div className="flex items-center gap-3">
              {mensajeOk && <span className="text-xs font-bold text-status-success">{mensajeOk}</span>}
              {mensajeError && <span className="text-xs font-bold text-status-danger">{mensajeError}</span>}
              <Button type="submit" variant="primary" icon={Save} disabled={guardando}>
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>

          {/* Scroll del contenido del formulario */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-surface-app">
            
            {/* SECCIÓN: IDENTIDAD */}
            {activeSection === 'identidad' && (
              <div className="max-w-3xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Nombre Taller *</label>
                    <input
                      type="text" required disabled={user.rol !== 'soporte'}
                      value={nombreTaller} onChange={(e) => setNombreTaller(e.target.value)}
                      className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors disabled:bg-surface-subtle disabled:text-text-disabled"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Slogan</label>
                    <input
                      type="text" value={slogan} onChange={(e) => setSlogan(e.target.value)}
                      className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Dirección Física</label>
                  <input
                    type="text" value={direccion} onChange={(e) => setDireccion(e.target.value)}
                    className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Teléfono Público</label>
                    <input
                      type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)}
                      className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Email Público</label>
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Sobre Nosotros (Bio)</label>
                  <textarea
                    rows="4" value={sobreNosotros} onChange={(e) => setSobreNosotros(e.target.value)}
                    className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-border-subtle pt-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Años Experiencia</label>
                    <input type="number" value={anosExperiencia} onChange={(e) => setAnosExperiencia(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Clientes Atendidos</label>
                    <input type="number" value={clientesAtendidos} onChange={(e) => setClientesAtendidos(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Autos Reparados</label>
                    <input type="number" value={autosReparados} onChange={(e) => setAutosReparados(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors" />
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN: MARCA VISUAL */}
            {activeSection === 'marca' && (
              <div className="max-w-3xl space-y-6">
                
                <div className="p-4 bg-surface-panel border border-border-subtle rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">Avatar del Agente / Bot</h4>
                  <div className="flex items-center gap-4">
                    <img src={avatarUrl || presets[0].url} alt="Avatar" className="w-16 h-16 rounded-full border border-border-default object-cover" />
                    <div className="flex-1 space-y-2">
                      <input
                        type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                        placeholder="URL de imagen (https://...)"
                        className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                      />
                      <div className="flex gap-2">
                        {presets.map((p) => (
                          <button key={p.name} type="button" onClick={() => setAvatarUrl(p.url)} className="text-xs bg-surface-subtle border border-border-subtle px-2 py-1 rounded hover:bg-hover-row text-text-secondary">{p.name}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-surface-panel border border-border-subtle rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">Banner (Chat Header)</h4>
                  <input
                    type="text" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="URL de imagen del banner"
                    className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none transition-colors"
                  />
                  {bannerUrl && <img src={bannerUrl} alt="Banner" className="h-24 w-full object-cover rounded-lg border border-border-subtle" />}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Color del Nombre (Chat)</label>
                    <div className="flex gap-2">
                      <input type="color" value={colorNombreAgente} onChange={(e) => setColorNombreAgente(e.target.value)} className="w-10 h-10 border-0 p-0 cursor-pointer rounded overflow-hidden" />
                      <input type="text" value={colorNombreAgente} onChange={(e) => setColorNombreAgente(e.target.value)} className="flex-1 bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none uppercase font-mono" />
                    </div>
                  </div>
                </div>

                {user.rol === 'soporte' && (
                  <div className="space-y-1 pt-4 border-t border-border-subtle">
                    <label className="text-xs font-bold text-text-secondary">Fondo de Landing (Soporte)</label>
                    <input
                      type="text" value={urlFondo} onChange={(e) => setUrlFondo(e.target.value)}
                      className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SECCIÓN: LANDING */}
            {activeSection === 'landing' && (
              <div className="max-w-none space-y-8">
                <div className="rounded-xl border border-action-primary/30 bg-action-primary-soft/30 p-4">
                  <h4 className="text-sm font-bold text-action-primary">Landing operativa</h4>
                  <p className="mt-1 text-xs text-text-secondary">
                    Esta pantalla guarda en BusinessProfile.landing y alimenta el preview publico. El constructor visual legacy era solo soporte/mock.
                  </p>
                </div>

                <div className="h-[calc(100vh-16rem)] min-h-[560px]">
                  <LandingBuilderScreen />
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2">Promociones Destacadas</h4>
                  
                  {promociones.map((promo, index) => (
                    <div key={index} className="p-4 bg-surface-panel border border-border-subtle rounded-xl space-y-4 relative">
                      <div className="absolute top-4 right-4">
                        <button type="button" onClick={() => setPromociones(promociones.filter((_, i) => i !== index))} className="text-xs font-bold text-status-danger hover:underline">Eliminar</button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-w-2xl pr-16">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Título</label>
                          <input type="text" value={promo.titulo} onChange={(e) => { const u = [...promociones]; u[index].titulo = e.target.value; setPromociones(u); }} className="w-full border border-border-default rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Etiqueta</label>
                          <input type="text" value={promo.etiqueta} onChange={(e) => { const u = [...promociones]; u[index].etiqueta = e.target.value; setPromociones(u); }} className="w-full border border-border-default rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Descripción</label>
                          <input type="text" value={promo.descripcion} onChange={(e) => { const u = [...promociones]; u[index].descripcion = e.target.value; setPromociones(u); }} className="w-full border border-border-default rounded-lg px-3 py-2 text-sm" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[10px] font-bold text-text-secondary uppercase">Color Base (Hex o primary)</label>
                          <input type="text" value={promo.color_fondo} onChange={(e) => { const u = [...promociones]; u[index].color_fondo = e.target.value; setPromociones(u); }} className="w-full border border-border-default rounded-lg px-3 py-2 text-sm font-mono" />
                        </div>
                      </div>
                    </div>
                  ))}

                  {promociones.length < 4 && (
                    <Button type="button" variant="outline" onClick={() => setPromociones([...promociones, { titulo: 'Nueva', descripcion: '', etiqueta: 'PROMO', color_fondo: 'primary', activo: true }])}>
                      + Añadir Promoción
                    </Button>
                  )}
                </div>

                <div className="space-y-2 pt-6 border-t border-border-subtle">
                  <label className="text-xs font-bold text-text-secondary">Galería (URLs de Unsplash)</label>
                  <p className="text-xs text-text-muted">Una URL por línea.</p>
                  <textarea rows="4" value={galeriaInput} onChange={(e) => setGaleriaInput(e.target.value)} className="w-full max-w-3xl bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none font-mono leading-relaxed" />
                </div>
              </div>
            )}

            {/* SECCIÓN: CANALES */}
            {activeSection === 'canales' && (
              <div className="max-w-3xl space-y-6">
                <div className="p-5 bg-surface-panel border border-border-subtle rounded-xl space-y-6">
                  <h4 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2 flex items-center gap-2"><Sparkles className="w-4 h-4 text-action-primary"/> Comportamiento del Bot de IA</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary">Nombre del Bot</label>
                      <input type="text" value={nombreAgente} onChange={(e) => setNombreAgente(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary">Alineación en Chat</label>
                      <select value={alineacionAvatarChat} onChange={(e) => setAlineacionAvatarChat(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none">
                        <option value="Izquierda">Izquierda</option>
                        <option value="Centro">Centro</option>
                        <option value="Derecha">Derecha</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Mensaje Inicial (Bienvenida)</label>
                    <input type="text" value={mensajeBienvenida} onChange={(e) => setMensajeBienvenida(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Prompt / Instrucciones Base (Comportamiento del LLM)</label>
                    <textarea rows="8" value={instruccionesBase} onChange={(e) => setInstruccionesBase(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none font-mono text-[11px] leading-relaxed" />
                  </div>
                </div>

                <div className="p-5 bg-surface-panel border border-border-subtle rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-text-primary border-b border-border-subtle pb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-status-success"/> Conexión WhatsApp (Twilio)</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-secondary">Webhook URL de Recepción</label>
                    <div className="bg-surface-subtle p-3 rounded-lg border border-border-subtle font-mono text-[11px] text-text-primary flex justify-between">
                      <span>http://localhost:4000/api/webhook/whatsapp</span>
                      <span className="text-[10px] bg-status-info-soft text-status-info font-bold px-1.5 rounded">POST</span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">Usa esta URL en la consola de Twilio Sandbox para rutear los mensajes entrantes a este sistema.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN: AGENDA */}
            {activeSection === 'agenda' && (
              <div className="max-w-2xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Hora Inicio de Citas</label>
                    <input type="time" value={horaInicioCitas} onChange={(e) => setHoraInicioCitas(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Hora Fin de Citas</label>
                    <input type="time" value={horaFinCitas} onChange={(e) => setHoraFinCitas(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none" />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border-subtle">
                  <label className="text-xs font-bold text-text-secondary">Días Permitidos para Agendar</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { val: 1, label: 'Lunes' }, { val: 2, label: 'Martes' }, { val: 3, label: 'Miércoles' },
                      { val: 4, label: 'Jueves' }, { val: 5, label: 'Viernes' }, { val: 6, label: 'Sábado' }, { val: 0, label: 'Domingo' }
                    ].map((d) => (
                      <label key={d.val} className="flex items-center gap-2 text-sm text-text-primary cursor-pointer">
                        <input
                          type="checkbox"
                          checked={diasPermitidosCitas.includes(d.val)}
                          onChange={(e) => {
                            if (e.target.checked) setDiasPermitidosCitas([...diasPermitidosCitas, d.val].sort());
                            else setDiasPermitidosCitas(diasPermitidosCitas.filter(v => v !== d.val));
                          }}
                          className="rounded border-border-strong text-action-primary focus:ring-action-primary w-4 h-4"
                        />
                        <span>{d.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SECCIÓN: USUARIOS */}
            {activeSection === 'usuarios' && (
              <div className="max-w-3xl">
                <div className="p-10 text-center border-2 border-dashed border-border-subtle rounded-xl bg-surface-subtle/30">
                  <Shield className="w-8 h-8 text-text-disabled mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-text-primary">Gestión de Usuarios y Permisos</h4>
                  <p className="text-xs text-text-muted mt-2">Módulo en construcción. Actualmente operas como {user.nombre} ({user.rol}).</p>
                </div>
              </div>
            )}

            {/* SECCIÓN: REGLAS */}
            {activeSection === 'reglas' && (
              <div className="max-w-2xl space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-text-secondary">Retención de Historial de Chat (Días)</label>
                  <p className="text-xs text-text-muted mb-2">Las conversaciones mayores a este número de días se ocultarán del historial activo.</p>
                  <input type="number" min="1" value={diasHistorialChat} onChange={(e) => setDiasHistorialChat(e.target.value)} className="w-1/2 bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none" />
                </div>
              </div>
            )}

            {/* SECCIÓN: SISTEMA */}
            {activeSection === 'sistema' && (
              <div className="max-w-2xl space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Moneda Base</label>
                    <select
                      value={moneda}
                      onChange={(e) => { setMoneda(e.target.value); fetchExchangeRate(e.target.value); }}
                      className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none"
                    >
                      <option value="PEN">Soles (PEN)</option>
                      <option value="USD">Dólares (USD)</option>
                      <option value="EUR">Euros (EUR)</option>
                      <option value="MXN">Pesos Mexicanos (MXN)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-text-secondary">Tasa de Cambio Actual</label>
                    <div className="w-full bg-surface-subtle border border-border-subtle text-text-primary rounded-lg px-3 py-2 text-xs font-mono flex items-center h-[38px]">
                      {exchangeRateInfo}
                    </div>
                  </div>
                </div>

                {moneda !== monedaOriginal && (
                  <div className="p-4 bg-status-warning-soft border border-status-warning/30 rounded-xl flex items-start gap-3">
                    <input type="checkbox" id="convertirCatalogo" checked={convertirCatalogo} onChange={(e) => setConvertirCatalogo(e.target.checked)} className="mt-0.5" />
                    <div>
                      <label htmlFor="convertirCatalogo" className="text-xs font-bold text-status-warning cursor-pointer">
                        Convertir precios del catálogo matemáticamente
                      </label>
                      <p className="text-[10px] text-status-warning/80 mt-1 leading-relaxed">
                        Si seleccionas esto, el sistema recalculará los precios almacenados de {monedaOriginal} a {moneda}.
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1 pt-6 border-t border-border-subtle">
                  <label className="text-xs font-bold text-text-secondary">URL Brochure (Drive/PDF)</label>
                  <input type="text" value={brochureUrl} onChange={(e) => setBrochureUrl(e.target.value)} className="w-full bg-surface-panel border border-border-default text-text-primary rounded-lg px-3 py-2 text-sm focus:border-focus-ring outline-none" />
                </div>
              </div>
            )}
            
          </div>
        </form>
      </main>

    </div>
  );
}
