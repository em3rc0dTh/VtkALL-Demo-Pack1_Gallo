'use client';

export default function EmbedBlock({ conf = {} }) {
  const htmlContent = conf.htmlContent || '';
  const colorFondo = conf.colorFondo || '#ffffff';
  const paddingY = conf.paddingY || 'py-16';
  const idSeccion = conf.idSeccion || 'seccion_custom';

  return (
    <section 
      id={idSeccion} 
      className={`relative w-full ${paddingY} flex justify-center`}
      style={{ backgroundColor: colorFondo }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 md:px-8">
        {htmlContent ? (
          <div 
            className="w-full h-full overflow-hidden"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <div className="w-full py-12 text-center text-gray-400 font-medium">
            Bloque de Código Vacío
          </div>
        )}
      </div>
    </section>
  );
}
