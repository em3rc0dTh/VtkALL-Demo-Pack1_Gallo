'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Clock, MessageSquare, Image as ImageIcon, Send, X, DollarSign, UploadCloud } from 'lucide-react';
import Swal from 'sweetalert2';
import CloseModalButton from '../ui/CloseModalButton.js';
import { api } from '../../lib/api.js';

export default function TabBandejaPastelero() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  
  // Formulario feedback
  const [ingredientes, setIngredientes] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [precio, setPrecio] = useState('');
  const [imagenContra, setImagenContra] = useState('');
  const [subiendoImg, setSubiendoImg] = useState(false);

  const cargarPedidos = async () => {
    setCargando(true);
    try {
      // Cargamos citas en revisión maestro
      const resRevision = await api.getCitas('', 'revision_maestro', 1, 50);
      // Opcional: cargar también las que están esperando al cliente para ver seguimiento
      const resEsperando = await api.getCitas('', 'esperando_cliente', 1, 50);
      
      const todas = [...(resRevision.citas || []), ...(resEsperando.citas || [])];
      // Ordenar por fecha_cita
      todas.sort((a, b) => new Date(a.fecha_cita) - new Date(b.fecha_cita));
      
      setPedidos(todas);
    } catch (error) {
      console.error('Error cargando bandeja pastelero:', error);
      Swal.fire('Error', 'No se pudieron cargar los pedidos en revisión.', 'error');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const abrirModal = (pedido) => {
    setPedidoActivo(pedido);
    setIngredientes(pedido.notas_mecanico || '');
    setPrecio(pedido.precio_estimado || '');
    setFechaEntrega(pedido.fecha_entrega || '');
    setImagenContra('');
  };

  const cerrarModal = () => {
    setPedidoActivo(null);
  };

  const handleSubirImagen = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire('Error', 'Debe ser un archivo de imagen', 'error');
      return;
    }

    setSubiendoImg(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.subirImagenGeneral(formData);
      setImagenContra(res.url);
    } catch (err) {
      Swal.fire('Error', err.message || 'Fallo al subir imagen', 'error');
    } finally {
      setSubiendoImg(false);
    }
  };

  const enviarFeedback = async () => {
    if (!ingredientes.trim() || !precio || !fechaEntrega.trim()) {
      Swal.fire('Atención', 'Debes completar los ingredientes, precio y fecha de entrega.', 'warning');
      return;
    }

    try {
      Swal.fire({ title: 'Enviando...', text: 'Enviando cotización por WhatsApp al cliente', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      await api.temporalBakerQuote({
        pedidoId: pedidoActivo._id,
        precioFinal: Number(precio),
        ingredientes,
        fechaEntrega,
        imagenUrl: imagenContra || null
      });

      Swal.fire('¡Enviado!', 'La cotización ha sido enviada al cliente. Esperando confirmación.', 'success');
      cerrarModal();
      cargarPedidos();
    } catch (error) {
      Swal.fire('Error', 'Hubo un problema al enviar la cotización.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            <ChefHat className="text-primary w-6 h-6" /> Bandeja de Pedidos
          </h2>
          <p className="text-sm text-gray-400 mt-1">Revisa las cotizaciones recopiladas por la IA, define factibilidad y precios.</p>
        </div>
        <button onClick={cargarPedidos} className="px-4 py-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors text-xs font-semibold">
          Actualizar Bandeja
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>
      ) : pedidos.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-10 text-center">
          <ChefHat className="w-12 h-12 text-gray-700 mx-auto mb-3" />
          <h3 className="text-gray-400 font-medium">Bandeja Vacía</h3>
          <p className="text-xs text-gray-500 mt-1">No hay pedidos pendientes de revisión por el momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pedidos.map(pedido => (
            <div key={pedido._id} onClick={() => abrirModal(pedido)} className={`bg-gray-900 border ${pedido.estado === 'revision_maestro' ? 'border-primary/50 cursor-pointer hover:border-primary' : 'border-gray-800 opacity-60'} rounded-2xl p-5 transition-all relative overflow-hidden group`}>
              {pedido.estado === 'revision_maestro' ? (
                <span className="absolute top-0 right-0 bg-primary/20 text-primary text-[9px] font-bold px-2 py-1 rounded-bl-lg">NUEVO PARA REVISAR</span>
              ) : (
                <span className="absolute top-0 right-0 bg-yellow-500/20 text-yellow-500 text-[9px] font-bold px-2 py-1 rounded-bl-lg">ESPERANDO CLIENTE</span>
              )}
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold">
                  {pedido.nombre_cliente?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm truncate">{pedido.nombre_cliente}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3"/> {new Date(pedido.fecha_cita).toLocaleDateString('es-PE')} - {new Date(pedido.fecha_cita).toLocaleTimeString('es-PE', {hour:'2-digit', minute:'2-digit'})}</p>
                </div>
              </div>
              
              <div className="bg-gray-950 rounded-xl p-3 mb-3">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-1 block">Detalles Recopilados:</span>
                {pedido.detalles_reserva ? (
                  <div className="space-y-1">
                    {Object.entries(pedido.detalles_reserva).map(([k, v]) => (
                      <p key={k} className="text-xs text-gray-300"><span className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}:</span> {v}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">No hay detalles extra</p>
                )}
              </div>

              {pedido.imagenes && pedido.imagenes.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {pedido.imagenes.map((img, i) => (
                    <div key={i} className="w-12 h-12 rounded-lg bg-gray-800 overflow-hidden border border-gray-700">
                      <img src={img} alt="Ref" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE REVISIÓN */}
      <AnimatePresence>
        {pedidoActivo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cerrarModal} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden relative z-10 flex flex-col md:flex-row">
              
              {/* Columna Izquierda: Info del Cliente */}
              <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-gray-950/50 border-r border-gray-800">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2"><MessageSquare className="w-5 h-5 text-primary"/> Detalles del Pedido</h3>
                  <CloseModalButton onClick={cerrarModal} className="md:hidden" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Cliente</label>
                    <p className="text-sm text-gray-200">{pedidoActivo.nombre_cliente} ({pedidoActivo.numero_telefono})</p>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Servicio Interesado</label>
                    <p className="text-sm text-gray-200">{pedidoActivo.servicio}</p>
                  </div>
                  
                  {pedidoActivo.detalles_reserva && Object.keys(pedidoActivo.detalles_reserva).length > 0 && (
                    <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                       <label className="text-[10px] text-primary uppercase font-bold tracking-widest block mb-3">Requerimientos (IA Recopiló)</label>
                       <ul className="space-y-2">
                         {Object.entries(pedidoActivo.detalles_reserva).map(([k, v]) => (
                           <li key={k} className="text-xs text-gray-300"><b className="text-gray-500 capitalize">{k.replace(/_/g, ' ')}:</b> {v}</li>
                         ))}
                       </ul>
                    </div>
                  )}

                  {pedidoActivo.imagenes && pedidoActivo.imagenes.length > 0 && (
                    <div>
                      <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-2">Imágenes de Referencia</label>
                      <div className="grid grid-cols-2 gap-3">
                        {pedidoActivo.imagenes.map((img, i) => (
                          <a key={i} href={img} target="_blank" rel="noreferrer" className="aspect-square rounded-xl bg-gray-800 overflow-hidden border border-gray-700 block hover:border-primary transition-colors">
                            <img src={img} alt="Referencia" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Feedback del Jefe de Cocina */}
              <div className="w-full md:w-1/2 p-6 flex flex-col relative bg-gray-900">
                <CloseModalButton onClick={cerrarModal} absolute className="hidden md:flex" />
                
                <h3 className="text-lg font-bold text-white mb-6">Tu Evaluación (Feedback)</h3>
                
                {pedidoActivo.estado === 'esperando_cliente' ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                      <h4 className="text-white font-bold mb-1">Esperando al cliente</h4>
                      <p className="text-xs text-gray-400">Ya enviaste el feedback a la IA. Estamos esperando que el cliente responda en el chat.</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 flex-1 overflow-y-auto pr-2">
                    <div>
                      <label className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-2"><ChefHat className="w-4 h-4 text-primary"/> Ingredientes / Detalles de la Receta</label>
                      <textarea 
                        value={ingredientes} 
                        onChange={e => setIngredientes(e.target.value)}
                        placeholder="Ej: Torta de vainilla con relleno de manjarblanco, cubierta en fondant decorativo..." 
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl p-3 text-sm text-gray-200 outline-none focus:border-primary min-h-[80px]"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-2"><Clock className="w-4 h-4 text-orange-400"/> Fecha y Hora de Entrega Confirmada</label>
                      <input 
                        type="text" 
                        value={fechaEntrega} 
                        onChange={e => setFechaEntrega(e.target.value)}
                        placeholder="Ej: Sábado 15 a las 4:00 PM" 
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500"/> Precio Estimado Propuesto (S/.)</label>
                      <input 
                        type="number" 
                        value={precio} 
                        onChange={e => setPrecio(e.target.value)}
                        placeholder="Ej: 150" 
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 outline-none focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-400 font-bold mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-blue-400"/> Adjuntar Contra-propuesta Visual (Opcional)</label>
                      
                      {!imagenContra ? (
                        <div className="relative">
                          <input type="file" accept="image/*" onChange={handleSubirImagen} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                          <div className={`border-2 border-dashed ${subiendoImg ? 'border-primary bg-primary/10' : 'border-gray-700 bg-gray-950 hover:border-primary'} rounded-xl p-4 text-center transition-colors`}>
                            {subiendoImg ? (
                              <div className="flex flex-col items-center gap-2 text-primary">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-bold">Subiendo...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-gray-500">
                                <UploadCloud className="w-6 h-6" />
                                <span className="text-xs">Sube una foto o bosquejo referencial</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="relative rounded-xl border border-primary p-2 flex items-center gap-3 bg-gray-950">
                          <img src={imagenContra} alt="Contrapropuesta" className="w-12 h-12 rounded object-cover" />
                          <span className="text-xs text-gray-300 flex-1 truncate">Imagen subida exitosamente</span>
                          <button onClick={() => setImagenContra('')} className="p-1.5 bg-red-500/20 text-red-500 hover:bg-red-500/40 rounded-lg"><X className="w-4 h-4"/></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {pedidoActivo.estado !== 'esperando_cliente' && (
                  <div className="mt-6 pt-6 border-t border-gray-800">
                    <button onClick={enviarFeedback} className="w-full py-3 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/80 transition-colors shadow-lg shadow-primary/20">
                      <Send className="w-4 h-4" /> Enviar Cotización al Cliente
                    </button>
                    <p className="text-[10px] text-gray-500 text-center mt-3">El cliente recibirá un WhatsApp automático con estos detalles.</p>
                  </div>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
