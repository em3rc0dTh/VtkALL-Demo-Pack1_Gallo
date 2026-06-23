import React from 'react';
import { User, Car, Clock, AlertTriangle, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

export default function OperationalCard({
  id,
  priority = 'normal',
  identity = {},
  businessState = {},
  owner,
  extraDetails = [],
  nextAction,
  onDoubleClick,
  className = ''
}) {
  const priorityConfig = {
    critical: { border: 'border-red-500/50', bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle, label: 'CRÍTICO' },
    high:     { border: 'border-yellow-500/50', bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: AlertCircle, label: 'ALTO' },
    normal:   { border: 'border-blue-500/50', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Info, label: 'NORMAL' },
    low:      { border: 'border-gray-500/50', bg: 'bg-gray-500/10', text: 'text-gray-400', icon: CheckCircle, label: 'BAJA' }
  };

  const pConfig = priorityConfig[priority] || priorityConfig.normal;
  const PriorityIcon = pConfig.icon;

  return (
    <div 
      onDoubleClick={onDoubleClick}
      className={`group relative bg-dark-card/60 backdrop-blur-md border border-gray-700/60 rounded-xl overflow-hidden shadow-sm hover:border-gray-500/70 hover:shadow-lg hover:shadow-black/20 transition-all select-none flex flex-col ${className}`}
      title="Doble clic para ver detalles completos"
    >
      {/* Indicador de prioridad fino superior */}
      {priority === 'critical' || priority === 'high' ? (
         <div className={`absolute top-0 left-0 w-full h-1 ${priority === 'critical' ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
      ) : null}

      <div className="p-4 space-y-3.5">
        {/* Nivel 1: Header - Cliente y Badge de Prioridad */}
        <div>
          <div className="flex justify-between items-start gap-2 mb-1.5">
            <h3 className="text-sm font-bold text-white leading-tight truncate">
              {identity.cliente || 'Cliente no registrado'}
            </h3>
            {priority !== 'normal' && priority !== 'low' && (
              <span className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase border ${pConfig.border} ${pConfig.text} ${pConfig.bg}`}>
                <PriorityIcon className="w-3 h-3" strokeWidth={2.5} />
                {pConfig.label}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="truncate">{identity.marca || 'Auto'} {identity.modelo} {identity.anio ? `(${identity.anio})` : ''}</span>
            {identity.patente && (
              <span className="ml-auto text-[10px] font-mono font-bold bg-gray-900 text-gray-300 px-1.5 py-0.5 rounded border border-gray-700 shadow-inner">
                {identity.patente}
              </span>
            )}
          </p>
        </div>

        {/* Separador sutil */}
        <div className="h-px bg-gray-800/60 w-full"></div>

        {/* Nivel 2: Detalles Operativos */}
        <div className="space-y-2">
          {businessState.current && (
            <div className="text-[11px] flex flex-col gap-0.5">
              <span className="text-gray-500 uppercase tracking-wide font-semibold text-[9px]">Estado Operativo</span>
              <span className="font-semibold text-primary truncate flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> {businessState.current}
              </span>
            </div>
          )}

          {extraDetails && extraDetails.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {extraDetails.map((detail, idx) => (
                <div key={idx} className={`text-[11px] flex items-center gap-1.5 ${detail.highlight ? 'text-emerald-400 font-medium' : 'text-gray-400'}`}>
                  {detail.icon && <detail.icon className={`w-3.5 h-3.5 shrink-0 ${detail.highlight ? 'text-emerald-500' : 'text-gray-500'}`} />}
                  <span className="truncate">
                    {detail.label}: {detail.highlight ? <span className="font-bold text-emerald-400">{detail.value}</span> : detail.value}
                  </span>
                </div>
              ))}
            </div>
          )}

          {owner && (
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-gray-400 pt-1">
               <User className="w-3.5 h-3.5 text-gray-500 shrink-0" />
               <span className="truncate">Responsable: {owner}</span>
            </div>
          )}
        </div>
      </div>

      {/* Nivel 3: Footer de Acciones */}
      <div className="mt-auto bg-gray-900/40 p-3 pt-2.5 flex flex-col gap-2.5 border-t border-gray-800/60">
        {nextAction && (
          <Button 
            variant={nextAction.primary ? 'primary' : 'outline'}
            size="sm"
            icon={nextAction.icon}
            onClick={(e) => { e.stopPropagation(); nextAction.onClick(); }}
            className="w-full text-[10px] uppercase tracking-wider py-1.5 h-auto font-bold shadow-sm"
          >
            {nextAction.label}
          </Button>
        )}
        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            type="button"
            className="text-[10px] font-semibold text-gray-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
            onClick={(e) => { e.stopPropagation(); onDoubleClick(e); }}
          >
            Ver detalle <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
