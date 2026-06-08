'use client';

export default function FreeCanvas({ conf = {} }) {
  const items = conf.items || [];
  const colorFondo = conf.colorFondo || '#ffffff';
  const idSeccion = conf.idSeccion || 'seccion_custom';

  return (
    <section 
      id={idSeccion} 
      className="relative overflow-hidden w-full flex justify-center"
      style={{ backgroundColor: colorFondo }}
    >
      <div 
        className="w-full aspect-video relative"
      >
        {items.map(item => (
          <div
            key={item.id}
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
              zIndex: 10,
            }}
            className={`flex items-center justify-center ${item.type === 'text' ? '' : 'overflow-hidden'}`}
          >
            {item.type === 'text' && (
              <div className="w-full h-full font-bold leading-tight" dangerouslySetInnerHTML={{__html: item.content}}></div>
            )}
            {item.type === 'image' && (
              <img src={item.content} alt="img" className="w-full h-full object-cover pointer-events-none" />
            )}
          </div>
        ))}

        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center opacity-50">
            <p className="text-gray-500 font-medium tracking-widest uppercase text-sm">Lienzo Vacío</p>
          </div>
        )}
      </div>
    </section>
  );
}
