'use client';

import { useState, useEffect, useRef } from 'react';
import { LayoutTemplate, MoveUp, MoveDown, Eye, EyeOff, Settings2, Save, MonitorPlay, Type, Image as ImageIcon, PaintBucket, LayoutGrid, ToggleLeft, Sliders, BoxSelect, Smartphone, Monitor, Zap, PlusCircle, Trash2, Palette, Clock, Tag, XCircle, Users, AlignLeft, AlignCenter, AlignRight, AlignJustify, Move, Code } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../lib/api.js';
import EmbedBlockEditor from './EmbedBlockEditor';

export default function TabConstructor() {
  const [previewMode, setPreviewMode] = useState('desktop'); 
  const [modalGlobalOpen, setModalGlobalOpen] = useState(false);
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Paleta de temas para toda la app
  const [temaGlobal, setTemaGlobal] = useState({
    color: '#ef4444',
    color_secundario: '#00d1ff',
    color_fondo: '#0f172a',
    nombre: 'Turagua Bot'
  });

  const paletas = [
    // Colores originales
    { nombre: 'Rosa Pastel (Bate y Late)', hex: '#f36c84', hover: '#e65c74' },
    { nombre: 'Verde Matcha', hex: '#7db053', hover: '#6a9c42' },
    { nombre: 'Rosa Claro', hex: '#ffb6c1', hover: '#f5a3af' },
    { nombre: 'Celeste Nube', hex: '#d8e8ee', hover: '#c3dbe4' },
    { nombre: 'Aqua Dulce', hex: '#5eaeb9', hover: '#4d9da8' },
    { nombre: 'Azul Eléctrico', hex: '#008fcc', hover: '#006699' },
    // Colores adicionales profesionales
    { nombre: 'Rojo Deportivo', hex: '#e63946', hover: '#d62828' },
    { nombre: 'Azul Profesional', hex: '#1d3557', hover: '#14263d' },
    { nombre: 'Azul Claro Moderno', hex: '#00b4d8', hover: '#0093b8' },
    { nombre: 'Morado Elegante', hex: '#7209b7', hover: '#5a0fa0' },
    { nombre: 'Naranja Energético', hex: '#fb5607', hover: '#e54602' },
    
    // Colores vibrantes
    { nombre: 'Cian Moderno', hex: '#06aed5', hover: '#0593c1' },
    { nombre: 'Púrpura Vibrante', hex: '#b5179e', hover: '#9d1186' },
    { nombre: 'Rosa Magenta', hex: '#ff006e', hover: '#e60054' },
    { nombre: 'Turquesa Tropical', hex: '#1dd1a1', hover: '#16a085' },
    { nombre: 'Índigo Profundo', hex: '#4338ca', hover: '#3a31b3' },
    
    // Colores sofisticados
    { nombre: 'Esmeralda', hex: '#06a77d', hover: '#058566' },
    { nombre: 'Oro Premium', hex: '#d4a574', hover: '#c1945a' },
    { nombre: 'Gris Moderno', hex: '#6c757d', hover: '#5c636a' },
    { nombre: 'Teal Oscuro', hex: '#0d3b66', hover: '#082747' },
    { nombre: 'Coral Suave', hex: '#ff6b6b', hover: '#f55555' },
    
    // Colores adicionales
    { nombre: 'Verde Bosque', hex: '#2d6a4f', hover: '#1f4d38' },
    { nombre: 'Azul Marino', hex: '#264653', hover: '#1a3140' },
    { nombre: 'Rojo Vino', hex: '#8a0c1a', hover: '#6b0916' },
    { nombre: 'Verde Lima', hex: '#9eff66', hover: '#8fef55' },
    { nombre: 'Platino Claro', hex: '#c0c0c0', hover: '#a8a8a8' },
  ];

  // Aplicar tema dinámicamente al CSS root de la app real
  const cambiarTema = (paleta) => {
    setTemaGlobal(prev => ({ ...prev, color: paleta.hex, nombre: paleta.nombre }));
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary', paleta.hex);
      document.documentElement.style.setProperty('--primary-hover', paleta.hover || paleta.hex);
      document.documentElement.style.setProperty('--color-primary', paleta.hex);
      try { localStorage.setItem('tema-color', paleta.hex); } catch (e) {}
    }
  };

  const cambiarColorSecundario = (color) => {
    setTemaGlobal(prev => ({ ...prev, color_secundario: color }));
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--secondary', color);
      document.documentElement.style.setProperty('--color-secondary', color);
      document.documentElement.style.setProperty('--cyan', color);
      document.documentElement.style.setProperty('--yellow', color);
      try { localStorage.setItem('tema-color-secundario', color); } catch (e) {}
    }
  };

  const cambiarColorFondo = (color) => {
    setTemaGlobal(prev => ({ ...prev, color_fondo: color }));
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--dark-bg', color);
      document.documentElement.style.setProperty('--lavender', color);
      try { localStorage.setItem('tema-color-fondo', color); } catch (e) {}
    }
  };

  const [bloques, setBloques] = useState([
    { 
      id: 1, tipo: 'HeroBlock', titulo: 'Sección Principal (Hero)', activo: true, 
      conf: { tituloPrincipal: 'Centro Automotriz Especializado', subtitulo: 'Expertos en mecánica integral y mantenimientos.', tipoFondo: 'Video', overlayOpacidad: '60', tamanoFuente: 'Grande (XL)', alineacion: 'Centro', textoBoton: 'AGENDAR CITA', estiloBoton: 'Solid (Relleno)', colorBoton: 'Primario' } 
    },
    { 
      id: 2, tipo: 'StatsBlock', titulo: 'Estadísticas del Negocio', activo: true, 
      conf: { estilo: 'Tarjetas Oscuras', columnas: '3', animacion: 'Contador (CountUp)', stat1_valor: '+10', stat1_label: 'Años Experiencia', stat2_valor: '+500', stat2_label: 'Clientes Felices', stat3_valor: '+2000', stat3_label: 'Autos Reparados' } 
    },
    { 
      id: 3, tipo: 'ServicesBlock', titulo: 'Catálogo de Servicios', activo: true, 
      conf: { tituloSeccion: 'Nuestros Servicios', subtitulo: 'Diagnóstico y reparación automotriz.', layout: 'Grid 4 Columnas', estiloTarjeta: 'Glassmorphism', mostrarPrecios: true, mostrarTiempo: true, mostrarBotonAgendar: false, hoverEffect: 'Escalar (Zoom In)' } 
    },
    {
      id: 4, tipo: 'SobreNosotrosBlock', titulo: 'Sobre Nosotros', activo: true, conf: {}
    },
    {
      id: 5, tipo: 'ContactoBlock', titulo: 'Contacto y Horarios', activo: true, conf: {}
    }
  ]);

  const [guardando, setGuardando] = useState(false);
  const [bloqueEditando, setBloqueEditando] = useState(null);

  // ─── Canvas drag state ───────────────────────────────────────────────────────
  const [tallerPromos, setTallerPromos] = useState([]);
  const [isDraggingPromoBlock, setIsDraggingPromoBlock] = useState(false);
  const [promoBlockDragOffset, setPromoBlockDragOffset] = useState({ x: 0, y: 0 });
  const promoCanvasRef = useRef(null);

  const defaultPromosForCanvas = [
    { titulo: 'Promo del Mes: Box Degustación', etiqueta: 'PROMO DEL MES', color_fondo: 'primary' },
    { titulo: 'Especial Eventos: 15% OFF', etiqueta: 'ESPECIAL EVENTOS', color_fondo: 'navy' },
  ];
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    async function loadData() {
      try {
        const config = await api.getConfiguracion();
        if (config) {
          if (config.tema_global) {
            setTemaGlobal(config.tema_global);
            document.documentElement.style.setProperty('--primary', config.tema_global.color);
            const hoverColors = {
              '#00aeef': '#008fcc',
              '#ef4444': '#dc2626',
              '#10b981': '#059669',
              '#f97316': '#ea580c',
              '#8b5cf6': '#7c3aed',
              '#f36c84': '#e65c74',
              '#7db053': '#6a9c42',
              '#ffb6c1': '#f5a3af',
              '#d8e8ee': '#c3dbe4',
              '#5eaeb9': '#4d9da8',
              '#e63946': '#d62828',
              '#1d3557': '#14263d',
              '#00b4d8': '#0093b8',
              '#7209b7': '#5a0fa0',
              '#fb5607': '#e54602',
              '#06aed5': '#0593c1',
              '#b5179e': '#9d1186',
              '#ff006e': '#e60054',
              '#1dd1a1': '#16a085',
              '#4338ca': '#3a31b3',
              '#06a77d': '#058566',
              '#d4a574': '#c1945a',
              '#6c757d': '#5c636a',
              '#0d3b66': '#082747',
              '#ff6b6b': '#f55555',
              '#2d6a4f': '#1f4d38',
              '#264653': '#1a3140',
              '#8a0c1a': '#6b0916',
              '#9eff66': '#8fef55',
              '#c0c0c0': '#a8a8a8'
            };
            const hoverVal = hoverColors[config.tema_global.color] || config.tema_global.color;
            document.documentElement.style.setProperty('--primary-hover', hoverVal);
            document.documentElement.style.setProperty('--color-primary', config.tema_global.color);
            if (config.tema_global.color_secundario) cambiarColorSecundario(config.tema_global.color_secundario);
            if (config.tema_global.color_fondo) cambiarColorFondo(config.tema_global.color_fondo);
          }
          if (config.constructor_bloques && config.constructor_bloques.length > 0) {
            const bloquesLlenos = config.constructor_bloques.map(b => {
              const conf = b.conf || {};
              if (b.tipo === 'SobreNosotrosBlock') {
                return {
                  ...b,
                  conf: {
                    ...conf,
                    tituloSeccion: conf.tituloSeccion || 'Sobre Nosotros',
                    anosExperiencia: conf.anosExperiencia || config.anos_experiencia || '',
                    tituloPrincipal: conf.tituloPrincipal || config.nombre_taller || '',
                    tituloGradiente: conf.tituloGradiente || 'Calidad',
                    sobreNosotros: conf.sobreNosotros || config.sobre_nosotros || ''
                  }
                };
              }
              if (b.tipo === 'ContactoBlock') {
                return {
                  ...b,
                  conf: {
                    ...conf,
                    etiquetaSeccion: conf.etiquetaSeccion || 'Ubicación y',
                    tituloSeccion: conf.tituloSeccion || 'Contacto',
                    telefono: conf.telefono || config.telefono || '',
                    email: conf.email || config.email || '',
                    direccion: conf.direccion || config.direccion || ''
                  }
                };
              }
              return b;
            });
            setBloques(bloquesLlenos);
          }
          if (config.promociones && config.promociones.length > 0) {
            setTallerPromos(config.promociones.filter(p => p.activo !== false));
          }
        }
      } catch (err) {
        console.error('Error al cargar la configuración en el constructor:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleActivo = (id) => {
    setBloques(bloques.map(b => b.id === id ? { ...b, activo: !b.activo } : b));
  };

  const mover = (index, direccion) => {
    if (direccion === -1 && index === 0) return;
    if (direccion === 1 && index === bloques.length - 1) return;
    const nuevosBloques = [...bloques];
    const temp = nuevosBloques[index];
    nuevosBloques[index] = nuevosBloques[index + direccion];
    nuevosBloques[index + direccion] = temp;
    setBloques(nuevosBloques);
  };

  const eliminarBloque = async (id) => {
    const result = await Swal.fire({
      title: '¿Eliminar sección?',
      text: '¿Estás seguro de eliminar esta sección?',
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
      setBloques(bloques.filter(b => b.id !== id));
      if (bloqueEditando === id) setBloqueEditando(null);
    }
  };

  const handleGuardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        tema_global: temaGlobal,
        constructor_bloques: bloques
      };
      const response = await api.actualizarConfiguracion(payload);
      if (response && response.taller && response.taller.tema_global) {
        setTemaGlobal(response.taller.tema_global);
        if (response.taller.tema_global.color) cambiarTema({ hex: response.taller.tema_global.color, nombre: response.taller.tema_global.nombre || 'Personalizado' });
        if (response.taller.tema_global.color_secundario) cambiarColorSecundario(response.taller.tema_global.color_secundario);
        if (response.taller.tema_global.color_fondo) cambiarColorFondo(response.taller.tema_global.color_fondo);
      }
      Swal.fire({
        title: '¡Guardado!',
        text: 'Los cambios en el constructor han sido guardados con éxito.',
        icon: 'success',
        confirmButtonColor: temaGlobal.color,
        background: '#111827',
        color: '#fff'
      });
    } catch (err) {
      console.error('Error al guardar configuración:', err);
      Swal.fire({
        title: 'Error',
        text: err.message || 'No se pudo guardar la configuración.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
        background: '#111827',
        color: '#fff'
      });
    } finally {
      setGuardando(false);
    }
  };

  const handleConfigChange = (bloqueId, campo, valor) => {
    setBloques(bloques.map(b => {
      if (b.id === bloqueId) {
        return { ...b, conf: { ...(b.conf || {}), [campo]: valor } };
      }
      return b;
    }));
  };


  const handleCanvasMouseMove = (e, bloqueId) => {
    if (!isDraggingPromoBlock) return;
    const canvas = promoCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left - promoBlockDragOffset.x) / rect.width) * 100;
    const rawY = ((e.clientY - rect.top - promoBlockDragOffset.y) / rect.height) * 100;
    const x = Math.max(0, Math.min(68, rawX));
    const y = Math.max(0, Math.min(75, rawY));
    setBloques(prev => prev.map(b => {
      if (b.id !== bloqueId) return b;
      return { ...b, conf: { ...b.conf, promos_posicion: { x, y, anclado: true } } };
    }));
  };

  const handleBlockMouseDown = (e, bloque) => {
    e.stopPropagation();
    setIsDraggingPromoBlock(true);
    const canvas = promoCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pos = bloque.conf.promos_posicion;
    const isAnclado = pos?.anclado;
    const blockX = isAnclado ? pos.x : 55;
    const blockY = isAnclado ? pos.y : 15;
    const blockPixelX = (blockX / 100) * rect.width;
    const blockPixelY = (blockY / 100) * rect.height;
    setPromoBlockDragOffset({
      x: e.clientX - rect.left - blockPixelX,
      y: e.clientY - rect.top - blockPixelY
    });
  };

  const handleCanvasMouseUp = () => setIsDraggingPromoBlock(false);

  const resetPromosPosicion = (bloqueId) => {
    setBloques(prev => prev.map(b =>
      b.id !== bloqueId ? b : { ...b, conf: { ...b.conf, promos_posicion: null } }
    ));
  };
  // ────────────────────────────────────────────────────────────────────────────

  // Catálogo de Bloques disponibles para agregar
  const agregarBloqueNuevo = (tipo) => {
    const nuevoId = Date.now();
    let nuevoBloque = { id: nuevoId, tipo, activo: true, conf: {} };
    
    switch (tipo) {
      case 'HeroBlock':
        nuevoBloque.titulo = 'Nuevo Hero';
        nuevoBloque.conf = { tituloPrincipal: 'Título Impactante', subtitulo: 'Subtítulo descriptivo aquí.', tipoFondo: 'Color', overlayOpacidad: '50', tamanoFuente: 'Grande (XL)', alineacion: 'Centro', textoBoton: 'ACCIÓN', estiloBoton: 'Solid (Relleno)', colorBoton: 'Primario' };
        break;
      case 'StatsBlock':
        nuevoBloque.titulo = 'Nuevas Estadísticas';
        nuevoBloque.conf = { estilo: 'Tarjetas Oscuras', columnas: '3', animacion: 'Fade In', stat1_valor: '1', stat1_label: 'Dato 1', stat2_valor: '2', stat2_label: 'Dato 2', stat3_valor: '3', stat3_label: 'Dato 3' };
        break;
      case 'EmbedBlock':
        nuevoBloque.titulo = 'Bloque de Código (Embed)';
        nuevoBloque.conf = { 
          nombreNavbar: 'Extra',
          idSeccion: 'seccion_custom_' + Date.now(),
          colorFondo: '#ffffff',
          paddingY: 'py-16',
          htmlContent: ''
        };
        break;
      case 'ServicesBlock':
        nuevoBloque.titulo = 'Nuevo Catálogo';
        nuevoBloque.conf = { tituloSeccion: 'Más Servicios', subtitulo: 'Descripción breve.', layout: 'Grid 4 Columnas', estiloTarjeta: 'Glassmorphism', mostrarPrecios: true };
        break;
      case 'TestimonialsBlock':
        nuevoBloque.titulo = 'Testimonios y Reseñas';
        nuevoBloque.conf = { colorFondo: 'Gris Claro', padding: 'Medio' };
        break;
      case 'CTABlock':
        nuevoBloque.titulo = 'Nuevo CTA';
        nuevoBloque.conf = { mensaje: '¡Contáctanos Hoy!', subtitulo: 'No esperes más.', textoBoton: 'Escribir', colorFondo: 'Degradado Primario', esquinas: 'Redondeadas (xl)', animarBoton: true };
        break;
      case 'SobreNosotrosBlock':
        nuevoBloque.titulo = 'Sobre Nosotros';
        nuevoBloque.conf = { tituloSeccion: 'SOBRE NOSOTROS', anosExperiencia: '12', tituloPrincipal: 'Compromiso con la', tituloGradiente: 'Calidad de Tu Auto', sobreNosotros: '' };
        break;
      case 'ContactoBlock':
        nuevoBloque.titulo = 'Contacto y Horarios';
        nuevoBloque.conf = { subtituloSeccion: 'CONTACTO & ATENCIÓN', tituloSeccion: '¿Tienes Consultas? Escríbenos', telefono: '', email: '', direccion: '' };
        break;
    }

    setBloques([...bloques, nuevoBloque]);
    setModalAgregarOpen(false);
    setTimeout(() => {
      setBloqueEditando(nuevoId);
    }, 300);
  };

  // Componentes de Previsualización simulada (Adaptables)
  const PreviewBlocks = {
    HeroBlock: ({ conf = {} }) => (
      <div className={`w-full ${previewMode === 'desktop' ? 'h-72' : 'h-48'} bg-gray-900 rounded-xl flex flex-col ${conf.alineacion === 'Centro' ? 'items-center text-center' : conf.alineacion === 'Izquierda' ? 'items-start text-left pl-10' : conf.alineacion === 'Derecha' ? 'items-end text-right pr-10' : 'items-start text-left pl-10'} justify-center border border-gray-800 mb-4 transition-all duration-500 ease-out relative overflow-hidden group hover:border-gray-600`}>
        {conf.tipoFondo === 'Video' && <div className="absolute inset-0 bg-blue-900 transition-all duration-300" style={{ opacity: conf.overlayOpacidad / 100 }}></div>}
        {conf.tipoFondo === 'Color' && <div className="absolute inset-0 bg-gray-800 transition-all duration-300"></div>}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
        <span className={`transition-all duration-500 transform group-hover:scale-105 ${conf.tamanoFuente === 'Gigante (2XL)' ? (previewMode === 'desktop' ? 'text-4xl' : 'text-2xl') : conf.tamanoFuente === 'Grande (XL)' ? (previewMode === 'desktop' ? 'text-3xl' : 'text-xl') : (previewMode === 'desktop' ? 'text-xl' : 'text-sm')} font-black text-white relative z-10 leading-tight tracking-tight shadow-lg`}>{conf.tituloPrincipal}</span>
        <span className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[9px]'} text-gray-300 mt-2 relative z-10 max-w-[85%] md:max-w-[60%] leading-relaxed transition-all duration-300`}>{conf.subtitulo}</span>
        <div className={`mt-6 px-6 py-2.5 ${previewMode === 'desktop' ? 'text-[11px]' : 'text-[9px]'} font-black tracking-wider rounded-lg relative z-10 transition-all duration-300 hover:scale-105 shadow-xl ${conf.estiloBoton === 'Solid (Relleno)' ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_var(--primary)]' : 'border border-[var(--primary)] text-[var(--primary)] bg-transparent'}`}>{conf.textoBoton}</div>
      </div>
    ),
    StatsBlock: ({ conf = {} }) => (
      <div className="w-full flex gap-4 mb-4 transition-all duration-500 ease-in-out px-4">
        <div className={`flex-1 ${previewMode === 'desktop' ? 'h-24' : 'h-16'} ${conf.estilo === 'Claro' ? 'bg-gray-200' : conf.estilo === 'Sin Borde' ? 'bg-transparent border-0' : 'bg-gray-900/80 backdrop-blur-md border border-gray-800 shadow-xl'} rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}>
          <span className={`${previewMode === 'desktop' ? 'text-2xl' : 'text-sm'} font-black ${conf.estilo === 'Claro' ? 'text-gray-900' : 'text-white'}`}>{conf.stat1_valor}</span>
          <span className={`${previewMode === 'desktop' ? 'text-[9px]' : 'text-[7px]'} uppercase font-bold tracking-widest mt-1 ${conf.estilo === 'Claro' ? 'text-gray-500' : 'text-[var(--primary)]'}`}>{conf.stat1_label}</span>
        </div>
        <div className={`flex-1 ${previewMode === 'desktop' ? 'h-24' : 'h-16'} ${conf.estilo === 'Claro' ? 'bg-gray-200' : conf.estilo === 'Sin Borde' ? 'bg-transparent border-0' : 'bg-gray-900/80 backdrop-blur-md border border-gray-800 shadow-xl'} rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}>
          <span className={`${previewMode === 'desktop' ? 'text-2xl' : 'text-sm'} font-black ${conf.estilo === 'Claro' ? 'text-gray-900' : 'text-white'}`}>{conf.stat2_valor}</span>
          <span className={`${previewMode === 'desktop' ? 'text-[9px]' : 'text-[7px]'} uppercase font-bold tracking-widest mt-1 ${conf.estilo === 'Claro' ? 'text-gray-500' : 'text-[var(--primary)]'}`}>{conf.stat2_label}</span>
        </div>
        <div className={`flex-1 ${previewMode === 'desktop' ? 'h-24' : 'h-16'} ${conf.estilo === 'Claro' ? 'bg-gray-200' : conf.estilo === 'Sin Borde' ? 'bg-transparent border-0' : 'bg-gray-900/80 backdrop-blur-md border border-gray-800 shadow-xl'} rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,0,0,0.4)]`}>
          <span className={`${previewMode === 'desktop' ? 'text-2xl' : 'text-sm'} font-black ${conf.estilo === 'Claro' ? 'text-gray-900' : 'text-white'}`}>{conf.stat3_valor}</span>
          <span className={`${previewMode === 'desktop' ? 'text-[9px]' : 'text-[7px]'} uppercase font-bold tracking-widest mt-1 ${conf.estilo === 'Claro' ? 'text-gray-500' : 'text-[var(--primary)]'}`}>{conf.stat3_label}</span>
        </div>
      </div>
    ),
    ServicesBlock: ({ conf = {} }) => {
      const nombreAgente = 'Max';
      const listado = [
        { nombre: "Mecánica Preventiva y Correctiva", descripcion: "Soporte multimarca premium, afinamiento y scanner.", duracion_minutos: 90, precio_base: 120, icono: "🔧" },
        { nombre: "Planchado y Pintura Automotriz", descripcion: "Acabado profesional en cabina de pintura al horno.", duracion_minutos: 180, precio_base: 350, icono: "🎨" },
        { nombre: "Detailing y Tratamiento Cerámico", descripcion: "Recubrimiento cerámico para máxima protección.", duracion_minutos: 120, precio_base: 280, icono: "✨" },
      ];
      const getPrecioBase = (s) => s.precio_base || 0;
      const getDuracionMinutos = (s) => s.duracion_minutos || 0;
      const [isPaused, setIsPaused] = useState(false);

      return (
        <div className="w-full h-auto bg-gray-900/20 rounded-xl flex flex-col px-4 py-6 mb-4 transition-all duration-500">
          <div className="text-center mb-6">
            <span className={`${previewMode === 'desktop' ? 'text-xl' : 'text-xs'} font-black text-white block tracking-tight`}>{conf.tituloSeccion || "Nuestros Servicios"}</span>
            <span className={`${previewMode === 'desktop' ? 'text-[10px]' : 'text-[7px]'} text-gray-500 block mt-1`}>{conf.subtitulo || "Soluciones para tu auto"}</span>
          </div>

          <style jsx global>{`
            @keyframes scrollServicesLeft {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
            @keyframes scrollServicesRight {
              0% { transform: translate3d(-50%, 0, 0); }
              100% { transform: translate3d(0, 0, 0); }
            }
            @keyframes engineVibrate {
              0% { transform: translate(0, 0) rotate(0deg); }
              20% { transform: translate(-1px, 1px) rotate(-1deg); }
              40% { transform: translate(1px, -1px) rotate(1.5deg); }
              60% { transform: translate(-1px, -1px) rotate(-0.5deg); }
              80% { transform: translate(1.5px, 1px) rotate(1deg); }
              100% { transform: translate(0, 0) rotate(0deg); }
            }
            .services-carousel-left-preview {
              display: flex;
              gap: 12px;
              width: max-content;
              animation: scrollServicesLeft 45s linear infinite;
            }
            .services-carousel-right-preview {
              display: flex;
              gap: 12px;
              width: max-content;
              animation: scrollServicesRight 45s linear infinite;
            }
            .services-carousel-left-preview.paused,
            .services-carousel-right-preview.paused {
              animation-play-state: paused;
            }
            .carousel-fade-mask-preview {
              -webkit-mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
              mask-image: linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%);
            }
          `}</style>

          <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)] gap-4 lg:gap-6 lg:items-stretch">
            {/* Cómo Funciona Integrado */}
            <div className="w-full h-full">
              <div className="lg:h-full bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="text-center mb-3">
                  <span className="text-[8px] font-bold text-primary tracking-widest uppercase">
                    AGENDA EN 2 MINUTOS
                  </span>
                  <h3
                    className="text-[10px] lg:text-xs font-bold text-navy tracking-tight"
                    style={{ fontFamily: "'Readex Pro', sans-serif" }}
                  >
                    ¿Cómo Reservar?
                  </h3>
                </div>

                {/* Desktop: vertical stacked rows */}
                <div className="hidden lg:flex flex-col gap-2 flex-1">
                  <div className="flex flex-row items-center gap-2 bg-white/50 border border-slate-200/40 rounded-xl p-2 flex-1">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">1</span>
                    <div>
                      <h4 className="text-[8px] font-bold text-navy mb-0.5">Elige</h4>
                      <p className="text-[8px] text-[#54595F] leading-none">
                        Ver detalles de servicios.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 bg-white/50 border border-slate-200/40 rounded-xl p-2 flex-1">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">2</span>
                    <div>
                      <h4 className="text-[8px] font-bold text-navy mb-0.5">{nombreAgente} Coordina</h4>
                      <p className="text-[8px] text-[#54595F] leading-none">
                        Asigna tu horario.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row items-center gap-2 bg-white/50 border border-slate-200/40 rounded-xl p-2 flex-1">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black flex items-center justify-center shrink-0">3</span>
                    <div>
                      <h4 className="text-[8px] font-bold text-navy mb-0.5">Reservado</h4>
                      <p className="text-[8px] text-[#54595F] leading-none">
                        Confirmación al instante.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Mobile: 3 columns */}
                <div className="flex lg:hidden flex-row gap-1 w-full">
                  <div className="flex flex-col items-center text-center gap-1 bg-white/50 border border-slate-200/40 rounded-xl p-1.5 flex-1">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-black flex items-center justify-center shrink-0">1</span>
                    <h4 className="text-[7px] font-bold text-navy leading-none">Elige</h4>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1 bg-white/50 border border-slate-200/40 rounded-xl p-1.5 flex-1">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-black flex items-center justify-center shrink-0">2</span>
                    <h4 className="text-[7px] font-bold text-navy leading-none">Agente</h4>
                  </div>
                  <div className="flex flex-col items-center text-center gap-1 bg-white/50 border border-slate-200/40 rounded-xl p-1.5 flex-1">
                    <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[8px] font-black flex items-center justify-center shrink-0">3</span>
                    <h4 className="text-[7px] font-bold text-navy leading-none">Listo</h4>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between h-full space-y-2 lg:space-y-0 overflow-hidden">
              {/* Fila superior - desplazamiento izquierda */}
              <div
                className="overflow-hidden carousel-fade-mask-preview mb-2 py-1"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div className={`services-carousel-left-preview ${isPaused ? "paused" : ""}`}>
                  {[...listado, ...listado, ...listado].map((s, idx) => {
                    const precioBase = getPrecioBase(s);
                    const duracion = getDuracionMinutos(s);
                    return (
                      <div
                        key={`top-${s.nombre}-${idx}`}
                        className="shrink-0 w-[140px] sm:w-[170px] lg:w-[190px] p-3.5 rounded-[16px] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer select-none"
                      >
                        <div className="flex flex-col space-y-1.5 mb-1.5">
                          <div className="flex flex-row justify-between items-start gap-1 w-full">
                            <h3
                              className="text-[9px] lg:text-[11px] font-bold text-navy group-hover:text-primary transition-colors duration-200 leading-snug"
                              style={{ fontFamily: "'Readex Pro', sans-serif" }}
                            >
                              {s.nombre}
                            </h3>
                            <div className="w-5 h-5 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 relative select-none">
                              <span className="group-hover:animate-[engineVibrate_0.15s_linear_infinite] inline-block">
                                {s.icono || "🔧"}
                              </span>
                            </div>
                          </div>
                          <p className="text-[#54595F] text-[8px] lg:text-[9px] leading-relaxed font-light line-clamp-2">
                            {s.descripcion}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[8px] text-[#54595F] border-t border-gray-100 pt-1.5">
                            <span className="flex items-center gap-0.5 font-medium">
                              <Clock className="w-2.5 h-2.5 text-primary" />
                              {duracion} min
                            </span>
                            <span className="flex items-center gap-0.5 font-bold text-navy">
                              <Tag className="w-2 h-2 text-primary" /> desde S/. {precioBase}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Fila inferior - desplazamiento derecha */}
              <div
                className="hidden sm:block overflow-hidden carousel-fade-mask-preview py-1"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div
                  className={`services-carousel-right-preview ${isPaused ? "paused" : ""}`}
                >
                  {[...listado, ...listado, ...listado].map((s, idx) => {
                    const precioBase = getPrecioBase(s);
                    const duracion = getDuracionMinutos(s);
                    return (
                      <div
                        key={`bottom-${s.nombre}-${idx}`}
                        className="shrink-0 w-[140px] sm:w-[170px] lg:w-[190px] p-3.5 rounded-[16px] bg-white border border-slate-200/60 shadow-sm flex flex-col justify-between group hover:shadow-lg hover:border-primary/40 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer select-none"
                      >
                        <div className="flex flex-col space-y-1.5 mb-1.5">
                          <div className="flex flex-row justify-between items-start gap-1 w-full">
                            <h3
                              className="text-[9px] lg:text-[11px] font-bold text-navy group-hover:text-primary transition-colors duration-200 leading-snug"
                              style={{ fontFamily: "'Readex Pro', sans-serif" }}
                            >
                              {s.nombre}
                            </h3>
                            <div className="w-5 h-5 shrink-0 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300 relative select-none">
                              <span className="group-hover:animate-[engineVibrate_0.15s_linear_infinite] inline-block">
                                {s.icono || "🔧"}
                              </span>
                            </div>
                          </div>
                          <p className="text-[#54595F] text-[8px] lg:text-[9px] leading-relaxed font-light line-clamp-2">
                            {s.descripcion}
                          </p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[8px] text-[#54595F] border-t border-gray-100 pt-1.5">
                            <span className="flex items-center gap-0.5 font-medium">
                              <Clock className="w-2.5 h-2.5 text-primary" />
                              {duracion} min
                            </span>
                            <span className="flex items-center gap-0.5 font-bold text-navy">
                              <Tag className="w-2 h-2 text-primary" /> desde S/. {precioBase}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    TestimonialsBlock: ({ conf = {} }) => (
      <div className={`w-full ${conf.fondoSeccion === 'Acentuado' ? 'bg-gradient-to-br from-gray-900 to-[var(--primary)]/10' : 'bg-transparent'} rounded-xl flex flex-col py-6 px-4 mb-4 transition-all duration-500 relative overflow-hidden`}>
        {conf.fondoSeccion === 'Acentuado' && <div className="absolute -top-10 -right-10 w-48 h-48 bg-[var(--primary)]/20 rounded-full blur-3xl"></div>}
        <div className="text-center mb-6 relative z-10">
          <span className={`${previewMode === 'desktop' ? 'text-xl' : 'text-xs'} font-black text-white block tracking-tight`}>{conf.tituloSeccion}</span>
          <span className={`${previewMode === 'desktop' ? 'text-[10px]' : 'text-[7px]'} text-gray-400 block mt-1`}>{conf.subtitulo}</span>
        </div>
        <div className={`grid ${previewMode === 'desktop' ? 'grid-cols-3' : 'grid-cols-2'} gap-4 relative z-10 px-2`}>
          {[1,2,3].slice(0, conf.layout === 'Grid 3x3' ? 3 : 2).map((i, idx) => (
            <div key={i} className={`flex-1 h-auto ${conf.estiloTarjeta === 'Borde Neón (Cyberpunk)' ? 'border border-[var(--primary)]/50 shadow-[0_0_15px_var(--primary)] bg-gray-950/80 backdrop-blur' : conf.estiloTarjeta === 'Glassmorphism' ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-gray-900 border border-gray-800'} rounded-xl p-4 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl`} style={{ animationDelay: `${idx * 150}ms` }}>
              {conf.mostrarEstrellas && <div className={`${previewMode === 'desktop' ? 'text-[10px]' : 'text-[8px]'} text-yellow-500 mb-3 tracking-widest drop-shadow-[0_0_2px_rgba(234,179,8,0.5)]`}>★★★★★</div>}
              <div className="w-full h-1.5 bg-gray-700/50 rounded-full mb-2"></div>
              <div className="w-full h-1.5 bg-gray-700/50 rounded-full mb-2"></div>
              <div className="w-3/4 h-1.5 bg-gray-700/50 rounded-full mb-4"></div>
              <div className="flex items-center gap-3 mt-auto">
                {conf.mostrarAvatares && <div className={`${previewMode === 'desktop' ? 'w-8 h-8' : 'w-6 h-6'} rounded-full bg-gradient-to-tr from-gray-700 to-gray-600 shadow-inner`}></div>}
                <div className="flex-1">
                  <div className="w-16 h-2 bg-gray-500 rounded-full mb-1"></div>
                  {conf.mostrarEmpresa && <div className="w-10 h-1 bg-[var(--primary)]/60 rounded-full"></div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    CTABlock: ({ conf = {} }) => (
      <div className={`w-full ${previewMode === 'desktop' ? 'h-40' : 'h-24'} ${conf.colorFondo === 'Degradado Primario' ? 'bg-gradient-to-r from-[var(--secondary)] via-[var(--primary)] to-indigo-600' : 'bg-gray-900 border border-gray-800'} ${conf.esquinas === 'Redondeadas (xl)' ? 'rounded-3xl' : conf.esquinas === 'Píldora' ? 'rounded-full' : 'rounded-lg'} flex flex-col items-center justify-center mb-4 transition-all duration-500 relative overflow-hidden group hover:shadow-[0_10px_30px_var(--primary)]`}>
        <span className={`${previewMode === 'desktop' ? 'text-2xl' : 'text-xs'} font-black text-white relative z-10 shadow-black/50 drop-shadow-md`}>{conf.mensaje}</span>
        <span className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[7px]'} text-blue-200 mt-2 relative z-10 max-w-[80%] text-center`}>{conf.subtitulo}</span>
        <div className={`mt-5 px-6 py-2.5 bg-white text-[var(--primary)] ${previewMode === 'desktop' ? 'text-[11px]' : 'text-[8px]'} font-black tracking-widest rounded-full relative z-10 shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ${conf.animarBoton ? 'animate-pulse' : ''}`}>{conf.textoBoton}</div>
      </div>
    ),
    SobreNosotrosBlock: ({ conf = {} }) => (
      <div className={`w-full ${previewMode === 'desktop' ? 'h-40' : 'h-32'} bg-gray-900/40 rounded-xl flex items-center border border-gray-800 mb-4 p-4 gap-4 overflow-hidden transition-all duration-300 hover:border-gray-600`}>
        <div className={`shrink-0 ${previewMode === 'desktop' ? 'w-1/3 h-full' : 'w-1/2 h-full'} bg-gray-800 rounded-lg overflow-hidden relative shadow-inner`}>
          <div className="absolute inset-0 bg-[var(--primary)]/10 mix-blend-overlay z-10"></div>
          {conf.imagenURL ? (
            /\.(mp4|webm|ogg)($|\?)/i.test(conf.imagenURL) || conf.imagenURL.includes('/videos/') ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-500"><MonitorPlay className="w-6 h-6" /></div>
            ) : (
              <img src={conf.imagenURL} className="w-full h-full object-cover opacity-80" alt="Preview" />
            )
          ) : (
             <div className="w-full h-full bg-gray-800 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-gray-600" /></div>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <span className="text-[8px] text-[var(--primary)] font-bold uppercase tracking-widest truncate block">{conf.tituloSeccion || 'Sobre Nosotros'}</span>
          <h3 className={`${previewMode === 'desktop' ? 'text-sm' : 'text-[10px]'} font-black text-white leading-tight mt-1 truncate`}>
            {conf.tituloPrincipal || 'Compromiso con la'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary)] to-blue-400">{conf.tituloGradiente || 'Calidad'}</span>
          </h3>
          <div className="mt-3 space-y-1.5">
            {(conf.caracteristicas || [{icono:'✨', titulo:'Característica 1'}, {icono:'🏆', titulo:'Característica 2'}]).slice(0, 2).map((c, i) => (
              <div key={i} className="flex items-center gap-1.5">
                 <span className="text-[10px] bg-gray-800 w-4 h-4 rounded flex items-center justify-center">{c.icono || '✨'}</span>
                 <span className="text-[9px] text-gray-400 truncate">{c.titulo || 'Característica'}</span>
              </div>
            ))}

          </div>
        </div>
      </div>
    ),
    ContactoBlock: ({ conf = {} }) => (
      <div className={`w-full ${previewMode === 'desktop' ? 'h-32' : 'h-24'} bg-gray-900/40 rounded-xl flex flex-col items-center justify-center border border-gray-800 mb-4 p-4 text-center transition-all duration-300 hover:border-gray-600`}>
         <span className="text-[8px] text-[var(--primary)] font-bold uppercase tracking-widest">{conf.subtituloSeccion || 'Contacto & Atención'}</span>
         <h3 className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[9px]'} font-black text-white mt-1`}>{conf.tituloSeccion || '¿Tienes Consultas? Escríbenos'}</h3>
         <div className="flex gap-3 mt-4 opacity-50">
            <div className="h-6 w-20 bg-gray-800 rounded flex items-center justify-center gap-1"><Smartphone className="w-3 h-3 text-gray-500" /> <div className="w-8 h-1 bg-gray-600 rounded"></div></div>
            <div className="h-6 w-24 bg-gray-800 rounded flex items-center justify-center gap-1"><LayoutGrid className="w-3 h-3 text-gray-500" /> <div className="w-10 h-1 bg-gray-600 rounded"></div></div>
         </div>
      </div>
    ),
    EmbedBlock: ({ conf = {} }) => (
      <div className="w-full bg-gray-900/40 rounded-xl flex items-center justify-center border border-gray-800 mb-4 py-8 px-4 text-center opacity-80 select-none">
        <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest flex items-center gap-2"><Code className="w-4 h-4" /> Bloque de Código (Embed)</span>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DE LA SECCIÓN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/40 p-4 rounded-2xl border border-gray-800/60 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-[var(--primary)]" /> Constructor Visual
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">Arquitectura libre. Agrega, elimina, edita y cambia el color de toda la App.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => setModalGlobalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer"
          >
            <Palette className="w-4 h-4 text-[var(--primary)]" /> Apariencia Global
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: EL CONSTRUCTOR */}
        <div className="xl:col-span-6 space-y-4">
          
          {bloques.map((bloqueItem, index) => {
            const bloque = { ...bloqueItem, conf: bloqueItem.conf || {} };
            return (
              <div 
                key={bloque.id} 
              className="transition-all duration-500 ease-in-out transform origin-top"
              style={{ animationFillMode: 'both', animation: `slideIn 0.4s ease-out ${index * 0.1}s forwards` }}
            >
              {/* Barra Principal del Bloque */}
              <div 
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between group ${
                  bloque.activo ? 'bg-gray-900 border-gray-800 shadow-md hover:border-gray-700' : 'bg-gray-950/40 border-gray-850 opacity-60 grayscale-[50%]'
                } ${bloqueEditando === bloque.id ? 'rounded-b-none border-b-0 bg-gray-800/80 shadow-[0_-10px_20px_rgba(0,0,0,0.2)] z-10 relative' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <button onClick={() => mover(index, -1)} className="p-1 rounded bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-500 transition-colors"><MoveUp className="w-3 h-3" /></button>
                    <button onClick={() => mover(index, 1)} className="p-1 rounded bg-gray-800 hover:bg-gray-700 hover:text-white text-gray-500 transition-colors"><MoveDown className="w-3 h-3" /></button>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-3">
                      {bloque.titulo} 
                      {bloqueEditando === bloque.id && (
                        <span className="flex items-center gap-1.5 bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--primary)] text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-pulse"></span> Editando
                        </span>
                      )}
                    </h4>
                    <p className="text-[10px] text-gray-500 font-mono mt-1 opacity-70">&lt;{bloque.tipo} /&gt;</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setBloqueEditando(bloqueEditando === bloque.id ? null : bloque.id)}
                    className={`px-4 py-2 rounded-xl transition-all duration-300 font-bold flex items-center gap-2 text-[10px] uppercase tracking-wider ${
                      bloqueEditando === bloque.id 
                        ? 'bg-[var(--primary)] text-white shadow-[0_0_20px_var(--primary)] scale-105' 
                        : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Settings2 className={`w-3.5 h-3.5 ${bloqueEditando === bloque.id ? 'animate-spin-slow' : ''}`} /> 
                    {bloqueEditando === bloque.id ? 'CERRAR PANEL' : 'PERSONALIZAR'}
                  </button>
                  <div className="w-px h-6 bg-gray-800 mx-1"></div>
                  <button 
                    onClick={() => toggleActivo(bloque.id)}
                    className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                      bloque.activo ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 hover:scale-105' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-white'
                    }`}
                    title={bloque.activo ? "Ocultar bloque temporalmente" : "Mostrar bloque en la landing"}
                  >
                    {bloque.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => eliminarBloque(bloque.id)}
                    className="p-2.5 rounded-xl border border-transparent bg-transparent text-gray-600 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all duration-300 cursor-pointer"
                    title="Eliminar Sección permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PANEL DE EDICIÓN PRO (EXPANDIBLE) */}
              <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${bloqueEditando === bloque.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-6 bg-gray-900 border border-gray-800 border-t-0 rounded-b-2xl shadow-2xl relative z-0">
                    
                    {/* CONTENIDO DEL FORMULARIO DEPENDIENDO DEL TIPO */}

                    {bloque.tipo === 'EmbedBlock' && (
                      <div className="mt-4 border-t border-gray-800 pt-6">
                        <EmbedBlockEditor bloque={bloque} onChange={(campo, valor) => handleConfigChange(bloque.id, campo, valor)} />
                      </div>
                    )}

                    {/* ── HERO BLOCK ──────────────────────────────────────────────────── */}
                    {bloque.tipo === 'HeroBlock' && (
                      <div className="space-y-8">

                        {/* 1. Contenido de Texto */}
                        <div className="space-y-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <Type className="w-3 h-3 text-[var(--primary)]" /> Contenido de Texto
                          </span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-bold text-gray-400">Título Principal (H1)</label>
                              <input type="text" value={bloque.conf.tituloPrincipal || ''} onChange={e => handleConfigChange(bloque.id, 'tituloPrincipal', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                            </div>
                            <div className="space-y-1 col-span-2">
                              <label className="text-[10px] font-bold text-gray-400">Subtítulo Descriptivo</label>
                              <input type="text" value={bloque.conf.subtitulo || ''} onChange={e => handleConfigChange(bloque.id, 'subtitulo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400">Texto del Botón</label>
                              <input type="text" value={bloque.conf.textoBoton || ''} onChange={e => handleConfigChange(bloque.id, 'textoBoton', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400">Overlay ({bloque.conf.overlayOpacidad || 60}%)</label>
                              <input type="range" min="0" max="100" value={bloque.conf.overlayOpacidad || 60} onChange={e => handleConfigChange(bloque.id, 'overlayOpacidad', e.target.value)} className="w-full h-1.5 bg-gray-800 mt-3 rounded-lg appearance-none cursor-pointer" style={{ accentColor: 'var(--primary)' }} />
                            </div>
                          </div>
                        </div>

                        {/* 2. Alineación del Texto */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                            <AlignCenter className="w-3 h-3 text-[var(--primary)]" /> Alineación del Texto
                          </span>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { value: 'Izquierda', Icon: AlignLeft, label: 'Izquierda' },
                              { value: 'Centro', Icon: AlignCenter, label: 'Centro' },
                              { value: 'Derecha', Icon: AlignRight, label: 'Derecha' },
                              { value: 'Justificado', Icon: AlignJustify, label: 'Justificado' },
                            ].map(({ value, Icon, label }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleConfigChange(bloque.id, 'alineacion', value)}
                                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-[9px] font-bold uppercase tracking-wide transition-all duration-200 cursor-pointer ${
                                  (bloque.conf.alineacion || 'Centro') === value
                                    ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] shadow-[0_0_12px_var(--primary)]'
                                    : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600 hover:text-gray-300'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 3. Canvas de Posicionamiento del Bloque de Cards */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
                              <Move className="w-3 h-3 text-[var(--primary)]" /> Posicionar Bloque de Cards
                            </span>
                            <button
                              type="button"
                              onClick={() => resetPromosPosicion(bloque.id)}
                              className="text-[9px] font-bold text-gray-600 hover:text-red-400 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" /> Reset posición
                            </button>
                          </div>

                          {/* Toggle de layout del bloque */}
                          <div className="flex gap-2">
                            {[
                              { value: 'filas', label: 'En Filas', desc: 'Una sobre otra' },
                              { value: 'columnas', label: 'En Columnas', desc: 'Lado a lado' },
                            ].map(({ value, label, desc }) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => handleConfigChange(bloque.id, 'promos_layout', value)}
                                className={`flex-1 py-3 px-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                  (bloque.conf.promos_layout || 'filas') === value
                                    ? 'bg-[var(--primary)]/15 border-[var(--primary)] text-[var(--primary)] shadow-[0_0_10px_var(--primary)]'
                                    : 'bg-gray-950 border-gray-800 text-gray-500 hover:border-gray-600'
                                }`}
                              >
                                <div className="text-[9px] font-black uppercase tracking-widest">{label}</div>
                                <div className="text-[8px] text-current opacity-60 mt-0.5">{desc}</div>
                              </button>
                            ))}
                          </div>

                          <p className="text-[9px] text-gray-600 leading-relaxed bg-gray-950/40 border border-gray-800/60 rounded-lg px-3 py-2">
                            Las dos cards viajan juntas como un bloque. Arrástralo donde quieras en el Hero. En mobile siempre se apilan. 🟢 = posición anclada.
                          </p>

                          {/* Canvas interactivo */}
                          <div
                            ref={promoCanvasRef}
                            className="relative w-full rounded-2xl overflow-hidden border border-gray-800 select-none"
                            style={{
                              height: '300px',
                              cursor: isDraggingPromoBlock ? 'grabbing' : 'default',
                              background: 'linear-gradient(135deg, #06070f 0%, #0d1520 50%, #080d1a 100%)',
                            }}
                            onMouseMove={(e) => handleCanvasMouseMove(e, bloque.id)}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                          >
                            {/* Fondo decorativo */}
                            <div className="absolute inset-0 pointer-events-none">
                              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 60%, rgba(0,174,239,0.12) 0%, transparent 55%)' }} />
                              <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 75% 30%, rgba(99,102,241,0.08) 0%, transparent 50%)' }} />
                              <div className="absolute bottom-0 left-0 right-0 h-2/5" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }} />
                            </div>

                            {/* Grid de referencia */}
                            <div
                              className="absolute inset-0 pointer-events-none opacity-[0.04]"
                              style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '25% 33.33%' }}
                            />

                            {/* Simulación del texto del Hero */}
                            <div
                              className={`absolute top-6 pointer-events-none flex flex-col gap-1 ${
                                (bloque.conf.alineacion || 'Centro') === 'Centro'
                                  ? 'left-1/2 -translate-x-1/2 items-center text-center'
                                  : (bloque.conf.alineacion || 'Centro') === 'Derecha'
                                    ? 'right-4 items-end text-right'
                                    : 'left-5 items-start text-left'
                              }`}
                              style={{ maxWidth: '50%' }}
                            >
                              <div className="text-white/15 text-[7px] font-black uppercase tracking-[0.3em] mb-0.5">PREVIEW HERO</div>
                              <div className="h-2.5 bg-white/25 rounded" style={{ width: '95%' }} />
                              <div className="h-[18px] bg-white/45 rounded" style={{ width: '100%' }} />
                              <div className="h-[18px] bg-white/35 rounded" style={{ width: '85%' }} />
                              <div className="h-2 bg-white/15 rounded mt-1" style={{ width: '70%' }} />
                              <div className="flex gap-2 mt-2">
                                <div className="h-5 w-14 bg-white/10 rounded-full border border-white/15" />
                                <div className="h-5 w-16 rounded-full" style={{ background: 'var(--primary)', opacity: 0.55 }} />
                              </div>
                            </div>

                            {/* ── Bloque arrastrable único con las dos cards ── */}
                            {(() => {
                              const pos = bloque.conf.promos_posicion;
                              const isAnclado = pos?.anclado;
                              const blockX = isAnclado ? pos.x : 55;
                              const blockY = isAnclado ? pos.y : 15;
                              const isColumnas = (bloque.conf.promos_layout || 'filas') === 'columnas';
                              const promos = (tallerPromos.length > 0 ? tallerPromos : defaultPromosForCanvas).slice(0, 2);
                              return (
                                <div
                                  style={{
                                    position: 'absolute',
                                    left: `${blockX}%`,
                                    top: `${blockY}%`,
                                    zIndex: 20,
                                    cursor: isDraggingPromoBlock ? 'grabbing' : 'grab',
                                    userSelect: 'none',
                                  }}
                                  onMouseDown={(e) => handleBlockMouseDown(e, bloque)}
                                >
                                  {/* Cards del bloque */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: isColumnas ? 'row' : 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    {promos.map((promo, idx) => {
                                      const isPrimary = promo.color_fondo === 'primary';
                                      return (
                                        <div
                                          key={idx}
                                          style={{
                                            width: isColumnas ? '120px' : '155px',
                                            padding: '10px',
                                            borderRadius: '12px',
                                            background: isPrimary
                                              ? 'linear-gradient(135deg, var(--primary) 0%, #4f46e5 100%)'
                                              : 'linear-gradient(135deg, #0f2033 0%, #1e293b 100%)',
                                            border: `1px solid ${ isPrimary ? 'rgba(0,174,239,0.4)' : 'rgba(255,255,255,0.1)'}`,
                                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                                          }}
                                        >
                                          <div style={{ fontSize: '6.5px', fontWeight: 900, textTransform: 'uppercase', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px', color: 'white', display: 'inline-block', marginBottom: '6px', letterSpacing: '0.1em' }}>
                                            {promo.etiqueta || 'PROMO'}
                                          </div>
                                          <div style={{ fontSize: '7.5px', fontWeight: 700, color: 'white', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                            {promo.titulo}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Icono de arrastre */}
                                  <div style={{ position: 'absolute', top: '-8px', right: '-8px', width: '20px', height: '20px', background: 'var(--primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                    <Move style={{ width: '11px', height: '11px', color: 'white' }} />
                                  </div>

                                  {/* Indicador verde = posición anclada */}
                                  {isAnclado && (
                                    <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '14px', height: '14px', background: '#4ade80', borderRadius: '50%', border: '2px solid #030712', boxShadow: '0 2px 6px rgba(0,0,0,0.5)' }} />
                                  )}
                                </div>
                              );
                            })()}

                            {/* Readout de coordenadas mientras arrastra */}
                            {isDraggingPromoBlock && bloque.conf.promos_posicion && (
                              <div className="absolute bottom-2 right-3 bg-black/75 backdrop-blur-sm rounded-lg px-2 py-1 font-mono text-[8px] text-green-400 border border-green-400/20">
                                X: {bloque.conf.promos_posicion.x.toFixed(1)}% · Y: {bloque.conf.promos_posicion.y.toFixed(1)}%
                              </div>
                            )}

                            {/* Hint */}
                            <div className="absolute bottom-2 left-3 text-[7.5px] text-white/25 font-medium pointer-events-none">
                              ↕ Arrastra el bloque · 🟢 Anclado · Reset limpia posición
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {bloque.tipo === 'StatsBlock' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 space-y-2">
                           <input type="text" value={bloque.conf.stat1_valor} onChange={e => handleConfigChange(bloque.id, 'stat1_valor', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-sm text-white p-2 font-bold outline-none" />
                           <input type="text" value={bloque.conf.stat1_label} onChange={e => handleConfigChange(bloque.id, 'stat1_label', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 p-2 uppercase outline-none" />
                         </div>
                         <div className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 space-y-2">
                           <input type="text" value={bloque.conf.stat2_valor} onChange={e => handleConfigChange(bloque.id, 'stat2_valor', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-sm text-white p-2 font-bold outline-none" />
                           <input type="text" value={bloque.conf.stat2_label} onChange={e => handleConfigChange(bloque.id, 'stat2_label', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 p-2 uppercase outline-none" />
                         </div>
                       </div>
                    )}

                    {bloque.tipo === 'ServicesBlock' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Título de la Sección</label>
                          <input type="text" value={bloque.conf.tituloSeccion || ''} onChange={e => handleConfigChange(bloque.id, 'tituloSeccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Subtítulo Descriptivo</label>
                          <input type="text" value={bloque.conf.subtitulo || ''} onChange={e => handleConfigChange(bloque.id, 'subtitulo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                        </div>

                        {/* Configuración de Pasos de Reserva */}
                        <div className="mt-6 pt-6 border-t border-gray-800">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 block">Sección: ¿Cómo Reservar?</span>
                          
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-gray-400">Título de Sección Reserva</label>
                              <input type="text" value={bloque.conf.reservaTitulo || ''} placeholder="¿Cómo Reservar tu Box?" onChange={e => handleConfigChange(bloque.id, 'reservaTitulo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-xs text-white focus:border-[var(--primary)] outline-none" />
                            </div>

                            {/* Paso 1 */}
                            <div className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 space-y-2">
                              <span className="text-[10px] text-[var(--primary)] font-bold">Paso 1</span>
                              <input type="text" value={bloque.conf.paso1Titulo || ''} placeholder="Elige Especialidad" onChange={e => handleConfigChange(bloque.id, 'paso1Titulo', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-xs text-white p-2 font-bold outline-none" />
                              <textarea rows={2} value={bloque.conf.paso1Desc || ''} placeholder="Haz clic en cualquier tarjeta..." onChange={e => handleConfigChange(bloque.id, 'paso1Desc', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 p-2 outline-none resize-none" />
                              <input type="text" value={bloque.conf.paso1Mobile || ''} placeholder="Texto Corto Mobile (Ej: Elige Servicio)" onChange={e => handleConfigChange(bloque.id, 'paso1Mobile', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-white p-2 outline-none" />
                            </div>

                            {/* Paso 2 */}
                            <div className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 space-y-2">
                              <span className="text-[10px] text-[var(--primary)] font-bold">Paso 2</span>
                              <input type="text" value={bloque.conf.paso2Titulo || ''} placeholder="Esperanza Coordina tu Cita" onChange={e => handleConfigChange(bloque.id, 'paso2Titulo', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-xs text-white p-2 font-bold outline-none" />
                              <textarea rows={2} value={bloque.conf.paso2Desc || ''} placeholder="Atención al cliente consulta la agenda..." onChange={e => handleConfigChange(bloque.id, 'paso2Desc', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 p-2 outline-none resize-none" />
                              <input type="text" value={bloque.conf.paso2Mobile || ''} placeholder="Texto Corto Mobile (Ej: Esperanza Coordina)" onChange={e => handleConfigChange(bloque.id, 'paso2Mobile', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-white p-2 outline-none" />
                            </div>

                            {/* Paso 3 */}
                            <div className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 space-y-2">
                              <span className="text-[10px] text-[var(--primary)] font-bold">Paso 3</span>
                              <input type="text" value={bloque.conf.paso3Titulo || ''} placeholder="¡Listo! Box Reservado" onChange={e => handleConfigChange(bloque.id, 'paso3Titulo', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-xs text-white p-2 font-bold outline-none" />
                              <textarea rows={2} value={bloque.conf.paso3Desc || ''} placeholder="La cita queda agendada al instante..." onChange={e => handleConfigChange(bloque.id, 'paso3Desc', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 p-2 outline-none resize-none" />
                              <input type="text" value={bloque.conf.paso3Mobile || ''} placeholder="Texto Corto Mobile (Ej: Box Reservado)" onChange={e => handleConfigChange(bloque.id, 'paso3Mobile', e.target.value)} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-white p-2 outline-none" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {bloque.tipo === 'SobreNosotrosBlock' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Etiqueta de Sección</label>
                            <input type="text" value={bloque.conf.tituloSeccion || ''} onChange={e => handleConfigChange(bloque.id, 'tituloSeccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Años de Experiencia</label>
                            <input type="number" value={bloque.conf.anosExperiencia || ''} onChange={e => handleConfigChange(bloque.id, 'anosExperiencia', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Título de Cabecera</label>
                            <input type="text" value={bloque.conf.tituloPrincipal || ''} onChange={e => handleConfigChange(bloque.id, 'tituloPrincipal', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Texto del Gradiente</label>
                            <input type="text" value={bloque.conf.tituloGradiente || ''} onChange={e => handleConfigChange(bloque.id, 'tituloGradiente', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">Descripción Sobre Nosotros</label>
                          <textarea rows={3} value={bloque.conf.sobreNosotros || ''} onChange={e => handleConfigChange(bloque.id, 'sobreNosotros', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all resize-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400">URL Imagen o Video de la Sección</label>
                          <div className="flex gap-2 items-center">
                            <input type="text" value={bloque.conf.imagenURL || ''} placeholder="/images/sobre_nosotros.png o /videos/video.mp4" onChange={e => handleConfigChange(bloque.id, 'imagenURL', e.target.value)} className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all font-mono" />
                            <label className="cursor-pointer bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center transition-all">
                              <input type="file" className="hidden" accept="image/*,video/mp4,video/webm" onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('imagen', file);
                                setGuardando(true);
                                api.subirImagenGeneral(formData).then(data => {
                                  handleConfigChange(bloque.id, 'imagenURL', data.imageUrl);
                                  Swal.fire({ title: '¡Subido!', text: 'El archivo se subió correctamente', icon: 'success', background: '#111827', color: '#fff', timer: 1500, showConfirmButton: false });
                                }).catch(err => {
                                  Swal.fire({ title: 'Error', text: err.message || 'Error al subir', icon: 'error', background: '#111827', color: '#fff' });
                                }).finally(() => {
                                  setGuardando(false);
                                  e.target.value = '';
                                });
                              }} />
                              Subir Archivo
                            </label>
                          </div>
                        </div>

                        {/* Características Dinámicas */}
                        <div className="mt-6 pt-6 border-t border-gray-800">
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-4 block">Características Destacadas</span>
                          <div className="space-y-4">
                            {[0, 1, 2].map((idx) => {
                              const caracteristicas = bloque.conf.caracteristicas || [
                                { icono: '✨', titulo: 'Mecánicos Certificados', desc: 'Profesionales capacitados en mecánica general y electrónica automotriz.' },
                                { icono: '🏆', titulo: 'Calidad de Repuestos', desc: 'Todos nuestros mantenimientos se realizan con repuestos de la mejor calidad.' },
                                { icono: '🎨', titulo: 'Mecánica Especializada', desc: 'Brindamos atención personalizada y garantizada para cada vehículo.' },
                              ];
                              const item = caracteristicas[idx];
                              return (
                                <div key={idx} className="p-3 bg-gray-950/50 rounded-xl border border-gray-800 space-y-2">
                                  <span className="text-[10px] text-[var(--primary)] font-bold">Característica {idx + 1}</span>
                                  <div className="flex gap-2">
                                    <input type="text" value={item.icono || ''} placeholder="Icono (Emoji)" onChange={e => {
                                      const newCar = [...caracteristicas];
                                      newCar[idx].icono = e.target.value;
                                      handleConfigChange(bloque.id, 'caracteristicas', newCar);
                                    }} className="w-16 bg-gray-900 border border-gray-800 rounded text-xs text-center text-white p-2 font-bold outline-none" />
                                    <input type="text" value={item.titulo || ''} placeholder="Título" onChange={e => {
                                      const newCar = [...caracteristicas];
                                      newCar[idx].titulo = e.target.value;
                                      handleConfigChange(bloque.id, 'caracteristicas', newCar);
                                    }} className="w-full bg-gray-900 border border-gray-800 rounded text-xs text-white p-2 font-bold outline-none" />
                                  </div>
                                  <textarea rows={2} value={item.desc || ''} placeholder="Descripción..." onChange={e => {
                                    const newCar = [...caracteristicas];
                                    newCar[idx].desc = e.target.value;
                                    handleConfigChange(bloque.id, 'caracteristicas', newCar);
                                  }} className="w-full bg-gray-900 border border-gray-800 rounded text-[10px] text-gray-400 p-2 outline-none resize-none" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {bloque.tipo === 'ContactoBlock' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Etiqueta de Sección</label>
                            <input type="text" value={bloque.conf.subtituloSeccion || ''} onChange={e => handleConfigChange(bloque.id, 'subtituloSeccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Título de Sección</label>
                            <input type="text" value={bloque.conf.tituloSeccion || ''} onChange={e => handleConfigChange(bloque.id, 'tituloSeccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Teléfono</label>
                            <input type="text" value={bloque.conf.telefono || ''} onChange={e => handleConfigChange(bloque.id, 'telefono', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Email</label>
                            <input type="email" value={bloque.conf.email || ''} onChange={e => handleConfigChange(bloque.id, 'email', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Ubicación / Dirección</label>
                            <input type="text" value={bloque.conf.direccion || ''} onChange={e => handleConfigChange(bloque.id, 'direccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                        </div>
                      </div>
                    )}

                    {bloque.tipo === 'TestimonialsBlock' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Título de la Sección</label>
                            <input type="text" value={bloque.conf.tituloSeccion || ''} onChange={e => handleConfigChange(bloque.id, 'tituloSeccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Subtítulo Descriptivo</label>
                            <input type="text" value={bloque.conf.subtitulo || ''} onChange={e => handleConfigChange(bloque.id, 'subtitulo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Estilo de Tarjetas</label>
                            <select value={bloque.conf.estiloTarjeta || 'Estándar'} onChange={e => handleConfigChange(bloque.id, 'estiloTarjeta', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all">
                              <option value="Estándar">Estándar</option>
                              <option value="Borde Neón (Cyberpunk)">Borde Neón (Cyberpunk)</option>
                              <option value="Glassmorphism">Glassmorphism</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Fondo de Sección</label>
                            <select value={bloque.conf.fondoSeccion || 'Oscuro Estándar'} onChange={e => handleConfigChange(bloque.id, 'fondoSeccion', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all">
                              <option value="Oscuro Estándar">Oscuro Estándar</option>
                              <option value="Acentuado">Acentuado</option>
                              <option value="Claro">Claro</option>
                            </select>
                          </div>
                        </div>
                        <div className="flex gap-6 pt-2">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={bloque.conf.mostrarEstrellas !== false} onChange={e => handleConfigChange(bloque.id, 'mostrarEstrellas', e.target.checked)} className="rounded border-slate-800 text-[var(--primary)] focus:ring-0 bg-gray-950" />
                            Mostrar Estrellas
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={bloque.conf.mostrarAvatares !== false} onChange={e => handleConfigChange(bloque.id, 'mostrarAvatares', e.target.checked)} className="rounded border-slate-800 text-[var(--primary)] focus:ring-0 bg-gray-950" />
                            Mostrar Avatares
                          </label>
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={bloque.conf.mostrarEmpresa !== false} onChange={e => handleConfigChange(bloque.id, 'mostrarEmpresa', e.target.checked)} className="rounded border-slate-800 text-[var(--primary)] focus:ring-0 bg-gray-950" />
                            Mostrar Detalles Adicionales
                          </label>
                        </div>
                      </div>
                    )}

                    {bloque.tipo === 'CTABlock' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Mensaje Principal</label>
                            <input type="text" value={bloque.conf.mensaje || ''} onChange={e => handleConfigChange(bloque.id, 'mensaje', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Subtítulo</label>
                            <input type="text" value={bloque.conf.subtitulo || ''} onChange={e => handleConfigChange(bloque.id, 'subtitulo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Texto del Botón</label>
                            <input type="text" value={bloque.conf.textoBoton || ''} onChange={e => handleConfigChange(bloque.id, 'textoBoton', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Fondo</label>
                            <select value={bloque.conf.colorFondo || 'Degradado Primario'} onChange={e => handleConfigChange(bloque.id, 'colorFondo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all">
                              <option value="Degradado Primario">Degradado Primario</option>
                              <option value="Oscuro">Oscuro</option>
                              <option value="Gris Claro">Gris Claro</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Esquinas</label>
                            <select value={bloque.conf.esquinas || 'Redondeadas (xl)'} onChange={e => handleConfigChange(bloque.id, 'esquinas', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all">
                              <option value="Redondeadas (xl)">Redondeadas (xl)</option>
                              <option value="Píldora">Píldora</option>
                              <option value="Estándar">Estándar</option>
                            </select>
                          </div>
                        </div>
                        <div className="pt-2">
                          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                            <input type="checkbox" checked={bloque.conf.animarBoton !== false} onChange={e => handleConfigChange(bloque.id, 'animarBoton', e.target.checked)} className="rounded border-slate-800 text-[var(--primary)] focus:ring-0 bg-gray-950" />
                            Animar Botón (Efecto Latido)
                          </label>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              </div>
            );
          })}

          {/* BOTÓN PARA AGREGAR NUEVAS SECCIONES */}
          <button 
            onClick={() => setModalAgregarOpen(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all duration-300"
          >
            <PlusCircle className="w-4 h-4" /> Agregar Nueva Sección
          </button>
        </div>

        {/* COLUMNA DERECHA: RESPONSIVE LIVE PREVIEW */}
        <div className="xl:col-span-6 relative perspective-[1000px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none -z-10 transition-all duration-700"></div>
          
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <MonitorPlay className="w-4 h-4 text-[var(--primary)]"/> Canvas En Vivo
              </span>
              
              <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button title="Vista de PC" onClick={() => setPreviewMode('desktop')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${previewMode === 'desktop' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                  <Monitor className="w-3.5 h-3.5" /> WEB
                </button>
                <button title="Vista de Celular" onClick={() => setPreviewMode('mobile')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${previewMode === 'mobile' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                  <Smartphone className="w-3.5 h-3.5" /> MÓVIL
                </button>
              </div>
            </div>

            <div className={`transition-all duration-700 mx-auto ${
              previewMode === 'desktop' 
                ? 'w-full max-w-full h-[800px] rounded-2xl border border-gray-700 bg-gray-950 shadow-2xl overflow-hidden flex flex-col' 
                : 'w-[360px] h-[780px] bg-black rounded-[45px] border-[8px] border-gray-800 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_0_0_2px_rgba(255,255,255,0.1)] relative overflow-hidden flex flex-col hover:rotate-y-[-2deg] hover:rotate-x-[2deg]'
            }`}>
              
              {previewMode === 'mobile' && (
                <>
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-2xl z-50 flex justify-center items-end pb-1 gap-2">
                    <div className="w-10 h-1.5 rounded-full bg-gray-900/50"></div>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-10 flex justify-between items-center px-6 pt-1 z-40 pointer-events-none">
                    <span className="text-[9px] font-bold text-white">9:41</span>
                  </div>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-white/20 rounded-full z-50"></div>
                </>
              )}

              {previewMode === 'desktop' && (
                <div className="w-full h-10 bg-gray-900 border-b border-gray-800 flex items-center px-4 gap-3 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="w-full max-w-md mx-auto h-6 bg-gray-950 rounded-md border border-gray-800 flex items-center justify-center">
                      <span className="text-[10px] text-gray-500 font-mono">mecanicapro.com</span>
                    </div>
                  </div>
                </div>
              )}

              <div className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#050505] ${previewMode === 'mobile' ? 'pt-8 pb-16' : ''}`}>
                <div className={`w-full ${previewMode === 'desktop' ? 'h-16 px-8' : 'h-14 px-5'} bg-black/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-30 flex items-center justify-between`}>
                  <span className={`${previewMode === 'desktop' ? 'text-lg' : 'text-xs'} font-black text-white italic tracking-tighter`}>MECÁNICA<span className="text-[var(--primary)]">PRO</span></span>
                  {previewMode === 'desktop' ? (
                    <div className="flex gap-6 text-[111px] font-bold text-gray-300">
                      <span className="hover:text-[var(--primary)] cursor-pointer transition-colors">Inicio</span>
                      <span className="hover:text-[var(--primary)] cursor-pointer transition-colors">Servicios</span>
                      <span className="bg-[var(--primary)] px-4 py-1.5 rounded-md text-white shadow-[0_0_10px_var(--primary)]">Agendar</span>
                    </div>
                  ) : (
                    <div className="space-y-1"><div className="w-5 h-0.5 bg-white"></div><div className="w-5 h-0.5 bg-white"></div></div>
                  )}
                </div>

                <div className={`flex flex-col gap-1 ${previewMode === 'desktop' ? 'p-4 max-w-5xl mx-auto' : 'p-2'}`}>
                  {bloques.filter(b => b.activo).map((bloque, index) => {
                    const BlockComponent = PreviewBlocks[bloque.tipo];
                    if (!BlockComponent) return null;
                    return (
                      <div key={bloque.id} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both" style={{ animationDelay: `${index * 150}ms` }}>
                        <BlockComponent conf={bloque.conf} />
                      </div>
                    );
                  })}

                  {bloques.filter(b => b.activo).length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 opacity-50 mt-10 border border-dashed border-gray-800 rounded-xl">
                      <LayoutTemplate className="w-12 h-12 text-gray-600 mb-4" />
                      <span className="text-xs font-bold uppercase tracking-widest text-gray-500 text-center">Sitio Vacío<br/>Añade secciones desde el panel</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: AJUSTES GLOBALES (TEMAS) */}
      {modalGlobalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl p-6 relative">
            <button onClick={() => setModalGlobalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2"><Palette className="w-5 h-5 text-[var(--primary)]"/> Color Global del Tema</h2>
            <p className="text-xs text-gray-400 mb-6">Cambia la identidad visual de toda la aplicación y la landing page al instante.</p>
            
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {paletas.map(paleta => (
                <div 
                  key={paleta.hex} 
                  onClick={() => cambiarTema(paleta)}
                  className={`p-3 overflow-scroll-y rounded-lg border flex items-center justify-between cursor-pointer transition-all hover:bg-gray-900 ${temaGlobal.color === paleta.hex ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-gray-800'}`}
                >
                  <span className="text-xs font-bold text-white flex items-center gap-2.5">
                    <div className="w-5 h-5 rounded-full border-2 border-white/20 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: paleta.hex, color: paleta.hex }}></div>
                    {paleta.nombre}
                  </span>
                  {temaGlobal.color === paleta.hex && <span className="text-[9px] font-black uppercase text-[var(--primary)]">✓ Activo</span>}
                </div>
              ))}
            </div>
            
            <div className="mt-6 border-t border-gray-800 pt-6">
              <h3 className="text-sm font-bold text-white mb-4">Colores Avanzados</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Secundario (Degradados)</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={temaGlobal.color_secundario || '#00d1ff'} 
                      onChange={(e) => cambiarColorSecundario(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs text-gray-400 uppercase font-mono">{temaGlobal.color_secundario || '#00d1ff'}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500 mb-2">Fondo General</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="color" 
                      value={temaGlobal.color_fondo || '#0f172a'} 
                      onChange={(e) => cambiarColorFondo(e.target.value)}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs text-gray-400 uppercase font-mono">{temaGlobal.color_fondo || '#0f172a'}</span>
                  </div>
                </div>
              </div>
            </div>
            <button onClick={() => setModalGlobalOpen(false)} className="w-full mt-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs border border-gray-800 transition-all">
              Cerrar y Ver Cambios
            </button>
          </div>
        </div>
      )}

      {/* MODAL: CATÁLOGO DE BLOQUES */}
      {modalAgregarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl p-6 md:p-8 relative">
            <button onClick={() => setModalAgregarOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2"><LayoutGrid className="w-5 h-5 text-[var(--primary)]"/> Catálogo de Secciones</h2>
            <p className="text-xs text-gray-400 mb-6">Selecciona un bloque preconstruido para añadirlo a tu página.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div onClick={() => agregarBloqueNuevo('HeroBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                  <LayoutTemplate className="w-8 h-8 text-gray-600 group-hover:text-[var(--primary)]" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Sección Hero</h4>
                <p className="text-[10px] text-gray-500">Cabecera principal con video/imagen y llamado a la acción.</p>
              </div>
              
              <div onClick={() => agregarBloqueNuevo('StatsBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center gap-2 group-hover:bg-[var(--primary)]/10 transition-colors">
                  <div className="w-8 h-10 bg-gray-700 rounded group-hover:bg-[var(--primary)]/30"></div>
                  <div className="w-8 h-14 bg-gray-700 rounded group-hover:bg-[var(--primary)]/50"></div>
                  <div className="w-8 h-8 bg-gray-700 rounded group-hover:bg-[var(--primary)]/20"></div>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Cifras y Estadísticas</h4>
                <p className="text-[10px] text-gray-500">Tres tarjetas con números animados (CountUp) y etiquetas.</p>
              </div>

              <div onClick={() => agregarBloqueNuevo('ServicesBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 grid grid-cols-3 gap-1.5 p-2 group-hover:bg-[var(--primary)]/10 transition-colors">
                  <div className="bg-gray-700 rounded-md group-hover:bg-[var(--primary)]/40"></div><div className="bg-gray-700 rounded-md group-hover:bg-[var(--primary)]/40"></div><div className="bg-gray-700 rounded-md group-hover:bg-[var(--primary)]/40"></div>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Grilla de Servicios</h4>
                <p className="text-[10px] text-gray-500">Muestra tu catálogo con iconos, precios y descripciones cortas.</p>
              </div>

              <div onClick={() => agregarBloqueNuevo('TestimonialsBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex flex-col justify-center gap-2 p-3 group-hover:bg-[var(--primary)]/10 transition-colors">
                  <div className="w-full h-4 bg-gray-700 rounded group-hover:bg-[var(--primary)]/30"></div>
                  <div className="w-3/4 h-4 bg-gray-700 rounded group-hover:bg-[var(--primary)]/30"></div>
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Testimonios y Reseñas</h4>
                <p className="text-[10px] text-gray-500">Prueba social. Tarjetas de clientes con calificación de estrellas.</p>
              </div>
              
              <div onClick={() => agregarBloqueNuevo('SobreNosotrosBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                  <Users className="w-8 h-8 text-gray-600 group-hover:text-[var(--primary)]" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Sobre Nosotros</h4>
                <p className="text-[10px] text-gray-500">Muestra la historia, trayectoria y equipo del taller.</p>
              </div>

              <div onClick={() => agregarBloqueNuevo('EmbedBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all md:col-span-2">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors relative overflow-hidden">
                  <div className="absolute inset-0 bg-[size:10px_10px]" style={{ backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)' }}></div>
                  <Code className="w-8 h-8 text-[var(--primary)] relative z-10" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Código Libre (Embed)</h4>
                <p className="text-[10px] text-gray-500">Pega HTML, Iframes, diseños de Canva o videos de YouTube directamente en tu página.</p>
              </div>

              <div onClick={() => agregarBloqueNuevo('ContactoBlock')} className="p-4 rounded-xl border border-gray-800 bg-gray-900/50 hover:border-[var(--primary)] hover:bg-gray-900 cursor-pointer group transition-all">
                <div className="w-full h-20 bg-gray-800 rounded-lg mb-3 flex items-center justify-center group-hover:bg-[var(--primary)]/10 transition-colors">
                  <Smartphone className="w-8 h-8 text-gray-600 group-hover:text-[var(--primary)]" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Contacto y Horarios</h4>
                <p className="text-[10px] text-gray-500">Formulario de cita al instante, horarios y datos de contacto.</p>
              </div>

            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleGuardar}
        disabled={guardando}
        title="Guarda todos los cambios de tu Landing Page"
        className="fixed bottom-8 right-8 z-[100] flex items-center gap-2 px-6 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-2xl text-sm font-black transition-all duration-300 shadow-[0_10px_40px_var(--primary)] hover:scale-105 cursor-pointer"
      >
        {guardando ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</>
        ) : (
          <><Save className="w-5 h-5" /> GUARDAR CAMBIOS</>
        )}
      </button>

    </div>
  );
}
