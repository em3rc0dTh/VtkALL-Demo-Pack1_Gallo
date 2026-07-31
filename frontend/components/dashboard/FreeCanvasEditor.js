import { useState, useRef, useEffect } from 'react';
import { Type, Image as ImageIcon, Trash2, Settings, MousePointer2, Move, Circle, Square } from 'lucide-react';

export default function FreeCanvasEditor({ bloque, onChange }) {
  const conf = bloque.conf || {};
  const items = conf.items || [];
  const nombreNavbar = conf.nombreNavbar || 'Extra';
  const idSeccion = conf.idSeccion || bloque.id || 'seccion_custom';
  const colorFondo = conf.colorFondo || '#ffffff';

  const [activeItem, setActiveItem] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const updateItems = (newItems) => {
    onChange('items', newItems);
  };

  const addItem = (type) => {
    const newItem = {
      id: 'item_' + Date.now(),
      type: type,
      x: 10, // 10%
      y: 10, // 10%
      w: type === 'text' ? 40 : 20, // width in %
      h: type === 'text' ? 20 : 30, // height in % (or aspect relative)
      color: type === 'text' ? '#0f172a' : '#3b82f6',
      content: type === 'text' ? 'Nuevo Texto' : type === 'image' ? 'https://via.placeholder.com/300' : '',
      radius: type === 'circle' ? 50 : 0
    };
    updateItems([...items, newItem]);
    setActiveItem(newItem.id);
  };

  const updateItem = (id, updates) => {
    updateItems(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const deleteItem = (id) => {
    updateItems(items.filter(item => item.id !== id));
    if (activeItem === id) setActiveItem(null);
  };

  // Drag and Drop Logic
  const onMouseDown = (e, id) => {
    e.stopPropagation();
    setActiveItem(id);
    const rect = canvasRef.current.getBoundingClientRect();
    const item = items.find(i => i.id === id);
    
    // Pixel positions relative to canvas
    const pxX = (item.x / 100) * rect.width;
    const pxY = (item.y / 100) * rect.height;
    
    // Mouse offset relative to the item's top-left corner
    const offsetX = e.clientX - rect.left - pxX;
    const offsetY = e.clientY - rect.top - pxY;
    
    setDragOffset({ x: offsetX, y: offsetY });
    setDraggingId(id);
  };

  const onMouseMove = (e) => {
    if (!draggingId || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const pxX = e.clientX - rect.left - dragOffset.x;
    const pxY = e.clientY - rect.top - dragOffset.y;
    
    // Convert to percentages
    let pctX = (pxX / rect.width) * 100;
    let pctY = (pxY / rect.height) * 100;
    
    // Snap to grid or limits could be added here
    updateItem(draggingId, { x: pctX, y: pctY });
  };

  const onMouseUp = () => {
    setDraggingId(null);
  };

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [draggingId, dragOffset]);

  const activeData = items.find(i => i.id === activeItem);

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÃ“N: CONFIGURACIÃ“N GENERAL Y NAVBAR */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre en el MenÃº (Navbar)</label>
          <input 
            type="text" 
            value={nombreNavbar} 
            onChange={(e) => onChange('nombreNavbar', e.target.value)}
            className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Ej: Ofertas"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">ID de la SecciÃ³n (Enlace)</label>
          <input 
            type="text" 
            value={idSeccion} 
            onChange={(e) => onChange('idSeccion', e.target.value)}
            className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Ej: ofertas"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Color de Fondo del Lienzo</label>
          <div className="flex items-center gap-2">
            <input 
              type="color" 
              value={colorFondo} 
              onChange={(e) => onChange('colorFondo', e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
            <input 
              type="text" 
              value={colorFondo} 
              onChange={(e) => onChange('colorFondo', e.target.value)}
              className="flex-1 text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary focus:border-primary uppercase font-mono"
            />
          </div>
        </div>
      </div>

      {/* 2. BARRA DE HERRAMIENTAS */}
      <div className="flex items-center gap-2 p-2 bg-gray-900 rounded-lg overflow-x-auto shadow-inner">
        <button onClick={() => addItem('text')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-xs font-semibold transition-colors">
          <Type className="w-4 h-4" /> Texto
        </button>
        <button onClick={() => addItem('box')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-xs font-semibold transition-colors">
          <Square className="w-4 h-4" /> Cuadrado
        </button>
        <button onClick={() => addItem('circle')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-xs font-semibold transition-colors">
          <Circle className="w-4 h-4" /> CÃ­rculo
        </button>
        <button onClick={() => addItem('image')} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-md text-xs font-semibold transition-colors">
          <ImageIcon className="w-4 h-4" /> Imagen
        </button>
        <div className="flex-1"></div>
        <div className="text-xs text-gray-400 flex items-center gap-2 px-2">
          <MousePointer2 className="w-3.5 h-3.5" /> Arrastra libremente
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 3. EL LIENZO (CANVAS PROPORCIONAL) */}
        <div className="lg:col-span-3">
          <div 
            ref={canvasRef}
            className="w-full aspect-video rounded-xl border-2 border-gray-300 overflow-hidden relative shadow-sm cursor-crosshair bg-[linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc),linear-gradient(45deg,#f8fafc_25%,transparent_25%,transparent_75%,#f8fafc_75%,#f8fafc)]"
            style={{ 
              backgroundColor: colorFondo,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px'
            }}
            onClick={() => setActiveItem(null)}
          >
            {items.map(item => (
              <div
                key={item.id}
                onMouseDown={(e) => onMouseDown(e, item.id)}
                style={{
                  position: 'absolute',
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.w}%`,
                  height: `${item.h}%`,
                  backgroundColor: item.type === 'box' || item.type === 'circle' ? item.color : 'transparent',
                  borderRadius: item.type === 'circle' ? '50%' : '0',
                  color: item.type === 'text' ? item.color : 'inherit',
                  fontSize: 'clamp(12px, 2vw, 40px)',
                  zIndex: activeItem === item.id ? 50 : 10,
                  cursor: draggingId === item.id ? 'grabbing' : 'grab',
                  boxShadow: activeItem === item.id ? '0 0 0 2px #3b82f6, 0 10px 15px -3px rgba(0,0,0,0.3)' : 'none',
                }}
                className={`flex items-center justify-center relative select-none transition-shadow ${item.type === 'text' ? '' : 'overflow-hidden'}`}
              >
                {item.type === 'text' && (
                  <div className="w-full h-full font-bold leading-tight" dangerouslySetInnerHTML={{__html: item.content}}></div>
                )}
                {item.type === 'image' && (
                  <img src={item.content} alt="img" className="w-full h-full object-cover pointer-events-none" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 4. PANEL DE PROPIEDADES (DERECHA) */}
        <div className="lg:col-span-1">
          {activeData ? (
            <div className="bg-white border border-gray-200 rounded-xl p-4 sticky top-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center justify-between border-b border-gray-100 pb-2">
                <span>Propiedades</span>
                <span className="bg-gray-100 text-gray-500 px-2 py-0.5 rounded text-[10px] uppercase">{activeData.type}</span>
              </h3>

              <div className="space-y-4">
                {/* Text Content */}
                {activeData.type === 'text' && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Contenido (HTML permitido)</label>
                    <textarea 
                      value={activeData.content} 
                      onChange={(e) => updateItem(activeItem, { content: e.target.value })}
                      className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary min-h-[80px]"
                    />
                  </div>
                )}
                
                {/* Image Content */}
                {activeData.type === 'image' && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">URL de la Imagen</label>
                    <input 
                      type="text" 
                      value={activeData.content} 
                      onChange={(e) => updateItem(activeItem, { content: e.target.value })}
                      className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary"
                    />
                  </div>
                )}

                {/* Color Picker */}
                {(activeData.type === 'text' || activeData.type === 'box' || activeData.type === 'circle') && (
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
                      {activeData.type === 'text' ? 'Color de Texto' : 'Color de Relleno'}
                    </label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="color" 
                        value={activeData.color} 
                        onChange={(e) => updateItem(activeItem, { color: e.target.value })}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <input 
                        type="text" 
                        value={activeData.color} 
                        onChange={(e) => updateItem(activeItem, { color: e.target.value })}
                        className="flex-1 text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary uppercase font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Dimensions */}
                <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Ancho (%)</label>
                    <input 
                      type="number" 
                      value={activeData.w} 
                      onChange={(e) => updateItem(activeItem, { w: parseFloat(e.target.value) })}
                      className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Alto (%)</label>
                    <input 
                      type="number" 
                      value={activeData.h} 
                      onChange={(e) => updateItem(activeItem, { h: parseFloat(e.target.value) })}
                      className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-gray-100">
                  <button 
                    onClick={() => deleteItem(activeItem)}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-semibold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar Elemento
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-8 text-center text-gray-400 h-full flex flex-col items-center justify-center">
              <Settings className="w-8 h-8 mb-3 opacity-50" />
              <p className="text-sm font-medium">Selecciona un elemento en el lienzo para ver sus propiedades.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
