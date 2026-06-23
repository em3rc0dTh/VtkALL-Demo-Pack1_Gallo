import { FileQuestion } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ 
  icon: Icon = FileQuestion, 
  title = "No hay resultados", 
  description = "Intenta ajustar los filtros o crear un nuevo registro.", 
  actionLabel, 
  onAction 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px] border border-dashed border-gray-700/50 rounded-xl bg-dark-card/20 backdrop-blur-sm">
      <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 text-gray-500 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

export function ErrorState({ 
  title = "Ocurrió un error", 
  description = "No pudimos cargar la información. Por favor, intenta de nuevo.", 
  onRetry 
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center border border-red-500/20 rounded-xl bg-red-500/5 backdrop-blur-sm">
      <div className="text-red-400 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-md mb-5">{description}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
