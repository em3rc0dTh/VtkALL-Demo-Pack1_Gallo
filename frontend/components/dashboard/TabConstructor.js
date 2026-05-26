'use client';

import { useState, useEffect } from 'react';
import { LayoutTemplate, MoveUp, MoveDown, Eye, EyeOff, Settings2, Save, MonitorPlay, Type, Image as ImageIcon, PaintBucket, LayoutGrid, ToggleLeft, Sliders, BoxSelect, Smartphone, Monitor, Zap, PlusCircle, Trash2, Palette, XCircle, Users } from 'lucide-react';
import Swal from 'sweetalert2';
import { api } from '../../lib/api.js';

export default function TabConstructor() {
  const [previewMode, setPreviewMode] = useState('desktop'); 
  const [modalGlobalOpen, setModalGlobalOpen] = useState(false);
  const [modalAgregarOpen, setModalAgregarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Paleta de temas para toda la app
  const [temaGlobal, setTemaGlobal] = useState({
    color: '#00aeef',
    nombre: 'Azul Eléctrico (Default)'
  });

  const paletas = [
    { nombre: 'Azul Eléctrico (Default)', hex: '#00aeef', hover: '#008fcc' },
    { nombre: 'Rojo Racing', hex: '#ef4444', hover: '#dc2626' },
    { nombre: 'Verde Eco', hex: '#10b981', hover: '#059669' },
    { nombre: 'Naranja Fuego', hex: '#f97316', hover: '#ea580c' },
    { nombre: 'Púrpura Neón', hex: '#8b5cf6', hover: '#7c3aed' },
  ];

  // Aplicar tema dinámicamente al CSS root de la app real
  const cambiarTema = (paleta) => {
    setTemaGlobal({ color: paleta.hex, nombre: paleta.nombre });
    if (typeof document !== 'undefined') {
      document.documentElement.style.setProperty('--primary', paleta.hex);
      document.documentElement.style.setProperty('--primary-hover', paleta.hover);
      // Para Forzar re-render de colores Tailwind que dependen de opacidad
      document.documentElement.style.setProperty('--color-primary', paleta.hex);
      try {
        localStorage.setItem('tema-color', paleta.hex);
      } catch (e) {}
    }
  };

  const [bloques, setBloques] = useState([
    { 
      id: 1, tipo: 'HeroBlock', titulo: 'Sección Principal (Hero)', activo: true, 
      conf: { tituloPrincipal: 'Tu vehículo en las mejores manos', subtitulo: 'Expertos en mecánica automotriz con diagnóstico avanzado.', tipoFondo: 'Video', overlayOpacidad: '60', tamanoFuente: 'Grande (XL)', alineacion: 'Centro', textoBoton: 'AGENDAR CITA', estiloBoton: 'Solid (Relleno)', colorBoton: 'Primario' } 
    },
    { 
      id: 2, tipo: 'StatsBlock', titulo: 'Estadísticas del Negocio', activo: true, 
      conf: { estilo: 'Tarjetas Oscuras', columnas: '3', animacion: 'Contador (CountUp)', stat1_valor: '+10', stat1_label: 'Años Experiencia', stat2_valor: '+500', stat2_label: 'Clientes Felices', stat3_valor: '+2000', stat3_label: 'Autos Reparados' } 
    },
    { 
      id: 3, tipo: 'ServicesBlock', titulo: 'Catálogo de Servicios', activo: true, 
      conf: { tituloSeccion: 'Nuestros Servicios', subtitulo: 'Soluciones integrales para cada necesidad de tu vehículo.', layout: 'Grid 4 Columnas', estiloTarjeta: 'Glassmorphism', mostrarPrecios: true, mostrarTiempo: true, mostrarBotonAgendar: false, hoverEffect: 'Escalar (Zoom In)' } 
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

  useEffect(() => {
    async function loadData() {
      try {
        const config = await api.getConfiguracion();
        if (config) {
          if (config.tema_global) {
            setTemaGlobal(config.tema_global);
            // Apply color variables to document
            document.documentElement.style.setProperty('--primary', config.tema_global.color);
            const hoverColors = {
              '#00aeef': '#008fcc',
              '#ef4444': '#dc2626',
              '#10b981': '#059669',
              '#f97316': '#ea580c',
              '#8b5cf6': '#7c3aed'
            };
            const hoverVal = hoverColors[config.tema_global.color] || config.tema_global.color;
            document.documentElement.style.setProperty('--primary-hover', hoverVal);
            document.documentElement.style.setProperty('--color-primary', config.tema_global.color);
          }
          if (config.constructor_bloques && config.constructor_bloques.length > 0) {
            setBloques(config.constructor_bloques);
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
        cambiarTema(response.taller.tema_global);
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
        return { ...b, conf: { ...b.conf, [campo]: valor } };
      }
      return b;
    }));
  };

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
      case 'ServicesBlock':
        nuevoBloque.titulo = 'Nuevo Catálogo';
        nuevoBloque.conf = { tituloSeccion: 'Más Servicios', subtitulo: 'Descripción breve.', layout: 'Grid 4 Columnas', estiloTarjeta: 'Glassmorphism', mostrarPrecios: true };
        break;
      case 'TestimonialsBlock':
        nuevoBloque.titulo = 'Nuevos Testimonios';
        nuevoBloque.conf = { tituloSeccion: 'Clientes Satisfechos', subtitulo: 'Reseñas reales.', layout: 'Grid 3x3', estiloTarjeta: 'Borde Neón (Cyberpunk)', mostrarAvatares: true, mostrarEstrellas: true, mostrarEmpresa: false, fondoSeccion: 'Oscuro Estándar' };
        break;
      case 'CTABlock':
        nuevoBloque.titulo = 'Nuevo CTA';
        nuevoBloque.conf = { mensaje: '¡Contáctanos Hoy!', subtitulo: 'No esperes más.', textoBoton: 'Escribir', colorFondo: 'Degradado Primario', esquinas: 'Redondeadas (xl)', animarBoton: true };
        break;
      case 'SobreNosotrosBlock':
        nuevoBloque.titulo = 'Sobre Nosotros';
        nuevoBloque.conf = {};
        break;
      case 'ContactoBlock':
        nuevoBloque.titulo = 'Contacto y Horarios';
        nuevoBloque.conf = {};
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
    HeroBlock: ({ conf }) => (
      <div className={`w-full ${previewMode === 'desktop' ? 'h-72' : 'h-48'} bg-gray-900 rounded-xl flex flex-col ${conf.alineacion === 'Centro' ? 'items-center text-center' : conf.alineacion === 'Izquierda' ? 'items-start text-left pl-10' : 'items-end text-right pr-10'} justify-center border border-gray-800 mb-4 transition-all duration-500 ease-out relative overflow-hidden group hover:border-gray-600`}>
        {conf.tipoFondo === 'Video' && <div className="absolute inset-0 bg-blue-900 transition-all duration-300" style={{ opacity: conf.overlayOpacidad / 100 }}></div>}
        {conf.tipoFondo === 'Color' && <div className="absolute inset-0 bg-gray-800 transition-all duration-300"></div>}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-0"></div>
        <span className={`transition-all duration-500 transform group-hover:scale-105 ${conf.tamanoFuente === 'Gigante (2XL)' ? (previewMode === 'desktop' ? 'text-4xl' : 'text-2xl') : conf.tamanoFuente === 'Grande (XL)' ? (previewMode === 'desktop' ? 'text-3xl' : 'text-xl') : (previewMode === 'desktop' ? 'text-xl' : 'text-sm')} font-black text-white relative z-10 leading-tight tracking-tight shadow-lg`}>{conf.tituloPrincipal}</span>
        <span className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[9px]'} text-gray-300 mt-2 relative z-10 max-w-[85%] md:max-w-[60%] leading-relaxed transition-all duration-300`}>{conf.subtitulo}</span>
        <div className={`mt-6 px-6 py-2.5 ${previewMode === 'desktop' ? 'text-[11px]' : 'text-[9px]'} font-black tracking-wider rounded-lg relative z-10 transition-all duration-300 hover:scale-105 shadow-xl ${conf.estiloBoton === 'Solid (Relleno)' ? 'bg-[var(--primary)] text-white shadow-[0_0_15px_var(--primary)]' : 'border border-[var(--primary)] text-[var(--primary)] bg-transparent'}`}>{conf.textoBoton}</div>
      </div>
    ),
    StatsBlock: ({ conf }) => (
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
    ServicesBlock: ({ conf }) => (
      <div className="w-full h-auto bg-gray-900/20 rounded-xl flex flex-col px-4 py-6 mb-4 transition-all duration-500">
        <div className="text-center mb-6">
          <span className={`${previewMode === 'desktop' ? 'text-xl' : 'text-xs'} font-black text-white block tracking-tight`}>{conf.tituloSeccion}</span>
          <span className={`${previewMode === 'desktop' ? 'text-[10px]' : 'text-[7px]'} text-gray-500 block mt-1`}>{conf.subtitulo}</span>
        </div>
        <div className={`grid ${previewMode === 'desktop' ? 'grid-cols-4' : 'grid-cols-2'} gap-4`}>
          {[1,2,3,4].slice(0, conf.layout.includes('4') ? 4 : (previewMode === 'desktop' ? 3 : 2)).map(i => (
            <div key={i} className={`${previewMode === 'desktop' ? 'h-32' : 'h-24'} ${conf.estiloTarjeta === 'Glassmorphism' ? 'bg-white/5 backdrop-blur-md border border-white/10' : 'bg-gray-800'} rounded-xl flex flex-col p-3 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_var(--primary)] group cursor-pointer`}>
              <div className={`${previewMode === 'desktop' ? 'w-8 h-8' : 'w-6 h-6'} bg-[var(--primary)]/20 rounded-lg mb-3 flex items-center justify-center group-hover:bg-[var(--primary)]/40 transition-colors`}>
                <Zap className={`${previewMode === 'desktop' ? 'w-4 h-4' : 'w-3 h-3'} text-[var(--primary)]`} />
              </div>
              <div className="w-full h-1.5 bg-gray-700/50 rounded mb-1.5"></div>
              <div className="w-2/3 h-1.5 bg-gray-700/50 rounded"></div>
              {conf.mostrarPrecios && <div className={`mt-auto ${previewMode === 'desktop' ? 'text-[10px]' : 'text-[8px]'} text-green-400 font-bold group-hover:text-green-300 transition-colors`}>$0.00</div>}
            </div>
          ))}
        </div>
      </div>
    ),
    TestimonialsBlock: ({ conf }) => (
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
    CTABlock: ({ conf }) => (
      <div className={`w-full ${previewMode === 'desktop' ? 'h-40' : 'h-24'} ${conf.colorFondo === 'Degradado Primario' ? 'bg-gradient-to-r from-[var(--secondary)] via-[var(--primary)] to-indigo-600' : 'bg-gray-900 border border-gray-800'} ${conf.esquinas === 'Redondeadas (xl)' ? 'rounded-3xl' : conf.esquinas === 'Píldora' ? 'rounded-full' : 'rounded-lg'} flex flex-col items-center justify-center mb-4 transition-all duration-500 relative overflow-hidden group hover:shadow-[0_10px_30px_var(--primary)]`}>
        {conf.colorFondo === 'Degradado Primario' && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>}
        <span className={`${previewMode === 'desktop' ? 'text-2xl' : 'text-xs'} font-black text-white relative z-10 shadow-black/50 drop-shadow-md`}>{conf.mensaje}</span>
        <span className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[7px]'} text-blue-200 mt-2 relative z-10 max-w-[80%] text-center`}>{conf.subtitulo}</span>
        <div className={`mt-5 px-6 py-2.5 bg-white text-[var(--primary)] ${previewMode === 'desktop' ? 'text-[11px]' : 'text-[8px]'} font-black tracking-widest rounded-full relative z-10 shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer ${conf.animarBoton ? 'animate-pulse' : ''}`}>{conf.textoBoton}</div>
      </div>
    ),
    SobreNosotrosBlock: () => (
      <div className="w-full h-24 bg-gray-900/50 rounded-xl flex flex-col items-center justify-center border border-gray-800 mb-4 opacity-80 select-none">
        <span className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[9px]'} font-bold text-white uppercase tracking-widest flex items-center gap-2`}><Users className="w-4 h-4 text-[var(--primary)]" /> Sección Sobre Nosotros</span>
      </div>
    ),
    ContactoBlock: () => (
      <div className="w-full h-24 bg-gray-900/50 rounded-xl flex flex-col items-center justify-center border border-gray-800 mb-4 opacity-80 select-none">
        <span className={`${previewMode === 'desktop' ? 'text-xs' : 'text-[9px]'} font-bold text-white uppercase tracking-widest flex items-center gap-2`}><Smartphone className="w-4 h-4 text-[var(--primary)]" /> Contacto y Horarios</span>
      </div>
    ),
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DE LA SECCIÓN (W/ TEMA GLOBAL) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-900/40 p-4 rounded-2xl border border-gray-800/60 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)]/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-[var(--primary)]" /> Constructor tipo WordPress
          </h3>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">Arquitectura libre. Agrega, elimina, edita y cambia el color de toda la App.</p>
        </div>
        <div className="relative z-10 flex gap-3">
          <button
            onClick={() => setModalGlobalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all duration-300"
          >
            <Palette className="w-4 h-4 text-[var(--primary)]" /> Apariencia Global
          </button>
          <button
            onClick={handleGuardar}
            disabled={guardando}
            className="flex items-center gap-2 px-6 py-2.5 bg-[var(--primary)] hover:opacity-80 text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-[0_0_15px_var(--primary)]"
          >
            {guardando ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Guardando...</>
            ) : (
              <><Save className="w-4 h-4" /> Guardar Todo</>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* COLUMNA IZQUIERDA: EL CONSTRUCTOR DRAG & DROP */}
        <div className="xl:col-span-6 space-y-4">
          
          {bloques.map((bloque, index) => (
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
                    className={`p-2.5 rounded-xl border transition-all duration-300 ${
                      bloque.activo ? 'bg-green-500/10 border-green-500/20 text-green-500 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 hover:scale-105' : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-white'
                    }`}
                    title={bloque.activo ? "Ocultar bloque" : "Mostrar bloque"}
                  >
                    {bloque.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => eliminarBloque(bloque.id)}
                    className="p-2.5 rounded-xl border border-transparent bg-transparent text-gray-600 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all duration-300"
                    title="Eliminar Sección"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* PANEL DE EDICIÓN PRO (EXPANDIBLE CON CSS GRID TRANSITION) */}
              <div className={`grid transition-[grid-template-rows,opacity] duration-500 ease-in-out ${bloqueEditando === bloque.id ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                  <div className="p-6 bg-gray-900 border border-gray-800 border-t-0 rounded-b-2xl shadow-2xl relative z-0">
                    
                    {/* CONTENIDO DEL FORMULARIO DEPENDIENDO DEL TIPO */}
                    {bloque.tipo === 'HeroBlock' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-bold text-gray-400">Título Principal (H1)</label>
                            <input type="text" value={bloque.conf.tituloPrincipal} onChange={e => handleConfigChange(bloque.id, 'tituloPrincipal', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-[10px] font-bold text-gray-400">Subtítulo Descriptivo (H2)</label>
                            <input type="text" value={bloque.conf.subtitulo} onChange={e => handleConfigChange(bloque.id, 'subtitulo', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Texto del Botón</label>
                            <input type="text" value={bloque.conf.textoBoton} onChange={e => handleConfigChange(bloque.id, 'textoBoton', e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-xs text-white focus:border-[var(--primary)] outline-none transition-all" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">Opacidad del Overlay Oscuro</label>
                            <input type="range" min="0" max="100" value={bloque.conf.overlayOpacidad} onChange={e => handleConfigChange(bloque.id, 'overlayOpacidad', e.target.value)} className="w-full h-1.5 bg-gray-800 mt-3 rounded-lg appearance-none cursor-pointer" />
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

                    {(bloque.tipo !== 'HeroBlock' && bloque.tipo !== 'StatsBlock') && (
                       <div className="text-sm text-gray-400 p-6 bg-gray-950/50 rounded-2xl border border-gray-800/80 text-center font-medium shadow-inner">
                         Bloque {bloque.tipo} editable. (Simulación de opciones).
                       </div>
                    )}

                  </div>
                </div>
              </div>

            </div>
          ))}

          {/* BOTÓN PARA AGREGAR NUEVAS SECCIONES */}
          <button 
            onClick={() => setModalAgregarOpen(true)}
            className="w-full py-4 rounded-2xl border-2 border-dashed border-gray-700 text-gray-400 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 transition-all duration-300"
          >
            <PlusCircle className="w-4 h-4" /> Agregar Nueva Sección
          </button>
        </div>

        {/* COLUMNA DERECHA: RESPONSIVE LIVE PREVIEW (WEB FIRST + MOBILE TOGGLE) */}
        <div className="xl:col-span-6 relative perspective-[1000px]">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-[var(--primary)]/10 blur-[100px] rounded-full pointer-events-none -z-10 transition-all duration-700"></div>
          
          <div className="sticky top-6">
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="text-xs font-black text-white flex items-center gap-2 uppercase tracking-wider">
                <MonitorPlay className="w-4 h-4 text-[var(--primary)]"/> Canvas En Vivo
              </span>
              
              <div className="flex bg-gray-900 p-1 rounded-xl border border-gray-800">
                <button onClick={() => setPreviewMode('desktop')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${previewMode === 'desktop' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
                  <Monitor className="w-3.5 h-3.5" /> WEB
                </button>
                <button onClick={() => setPreviewMode('mobile')} className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${previewMode === 'mobile' ? 'bg-[var(--primary)] text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
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
                    <div className="flex gap-6 text-[11px] font-bold text-gray-300">
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
          <div className="w-full max-w-md rounded-3xl bg-gray-950 border border-gray-800 shadow-2xl p-6 relative">
            <button onClick={() => setModalGlobalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white">
              <XCircle className="w-6 h-6" />
            </button>
            <h2 className="text-lg font-black text-white flex items-center gap-2 mb-2"><Palette className="w-5 h-5 text-[var(--primary)]"/> Color Global del Tema</h2>
            <p className="text-xs text-gray-400 mb-6">Cambia la identidad visual de toda la aplicación y la landing page al instante.</p>
            
            <div className="space-y-3">
              {paletas.map(paleta => (
                <div 
                  key={paleta.hex} 
                  onClick={() => cambiarTema(paleta)}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all hover:bg-gray-900 ${temaGlobal.color === paleta.hex ? 'border-[var(--primary)] bg-[var(--primary)]/5' : 'border-gray-800'}`}
                >
                  <span className="text-sm font-bold text-white flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-white/20 shadow-[0_0_10px_currentColor]" style={{ backgroundColor: paleta.hex, color: paleta.hex }}></div>
                    {paleta.nombre}
                  </span>
                  {temaGlobal.color === paleta.hex && <span className="text-[10px] font-black uppercase text-[var(--primary)]">Activo</span>}
                </div>
              ))}
            </div>
            
            <button onClick={() => setModalGlobalOpen(false)} className="w-full mt-6 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs border border-gray-800">
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

    </div>
  );
}
