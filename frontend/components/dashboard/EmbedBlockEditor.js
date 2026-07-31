import { Code, Layout, Link } from 'lucide-react';

export default function EmbedBlockEditor({ bloque, onChange }) {
  const conf = bloque.conf || {};
  const htmlContent = conf.htmlContent || '';
  const paddingY = conf.paddingY || 'py-16';
  const colorFondo = conf.colorFondo || '#ffffff';
  const nombreNavbar = conf.nombreNavbar || 'Extra';
  const idSeccion = conf.idSeccion || bloque.id || 'seccion_custom';

  return (
    <div className="space-y-6">
      
      {/* InformaciÃ³n */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <h4 className="font-bold flex items-center gap-2 mb-1">
          <Code className="w-4 h-4" /> CÃ³digo Libre / Embed
        </h4>
        <p>Pega aquÃ­ cualquier cÃ³digo HTML, Iframes de YouTube, Mapas de Google o diseÃ±os embebidos de Canva.</p>
      </div>

      {/* ConfiguraciÃ³n General y Navbar */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Nombre en el MenÃº (Navbar)</label>
          <input 
            type="text" 
            value={nombreNavbar} 
            onChange={(e) => onChange('nombreNavbar', e.target.value)}
            className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Ej: Video Promocional"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">ID de la SecciÃ³n (Enlace)</label>
          <input 
            type="text" 
            value={idSeccion} 
            onChange={(e) => onChange('idSeccion', e.target.value)}
            className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
            placeholder="Ej: video-promo"
          />
        </div>
      </div>

      {/* Estilos Visuales */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Color de Fondo de SecciÃ³n</label>
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
        <div>
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Espaciado Vertical (MÃ¡rgenes)</label>
          <select 
            value={paddingY} 
            onChange={(e) => onChange('paddingY', e.target.value)}
            className="w-full text-sm text-gray-900 bg-white border-gray-300 rounded-lg focus:ring-primary focus:border-primary"
          >
            <option value="py-0">Sin Espaciado</option>
            <option value="py-8">PequeÃ±o</option>
            <option value="py-16">Medio (Recomendado)</option>
            <option value="py-24">Grande</option>
          </select>
        </div>
      </div>

      {/* CÃ³digo HTML */}
      <div className="bg-gray-900 rounded-xl overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Code className="w-3.5 h-3.5" /> HTML / Iframe Code
          </span>
        </div>
        <textarea
          value={htmlContent}
          onChange={(e) => onChange('htmlContent', e.target.value)}
          placeholder='<iframe width="100%" height="500" src="https://www.youtube.com/embed/..." frameborder="0" allowfullscreen></iframe>'
          className="w-full bg-gray-900 text-green-400 font-mono text-sm p-4 min-h-[300px] border-none focus:ring-0 resize-y"
          spellCheck={false}
        />
      </div>

      {/* Vista Previa */}
      {htmlContent && (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white mt-4">
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
            <Layout className="w-3.5 h-3.5" /> Vista Previa
          </div>
          <div 
            className="w-full overflow-hidden flex justify-center"
            style={{ backgroundColor: colorFondo }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      )}

    </div>
  );
}
