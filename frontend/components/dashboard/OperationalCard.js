import React from 'react';
import { User, Car, Clock, AlertTriangle, AlertCircle, CheckCircle, Info, ChevronRight } from 'lucide-react';

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
    critical: { border: 'border-red-500', bg: 'bg-red-500/10', text: 'text-red-400', icon: AlertTriangle, label: 'CRÍTICO' },
    high:     { border: 'border-yellow-500', bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: AlertCircle, label: 'ALTO' },
    normal:   { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Info, label: 'NORMAL' },
    low:      { border: 'border-gray-500', bg: 'bg-gray-500/10', text: 'text-gray-400', icon: CheckCircle, label: 'BAJA' }
  };

  const pConfig = priorityConfig[priority] || priorityConfig.normal;
  const PriorityIcon = pConfig.icon;

  // Determine primary action vs secondary action visual style
  const isActionPrimary = nextAction && nextAction.primary;
  const actionClass = isActionPrimary 
    ? "bg-primary hover:bg-primary-hover text-white border-transparent"
    : "bg-gray-800 hover:bg-gray-700 text-white border-gray-700";

  return (
    <div 
      onDoubleClick={onDoubleClick}
      className={`group relative bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-sm hover:border-gray-600 transition-all select-none cursor-pointer flex flex-col ${className}`}
      title="Doble clic para ver detalles completos o editar"
    >
      {/* Priority Indicator Line */}
      <div className={`absolute top-0 left-0 w-1 h-full ${pConfig.bg.replace('/10', '')} ${priority === 'critical' ? 'animate-pulse' : ''}`}></div>

      <div className="p-3.5 space-y-3">
        {/* Priority Badge */}
        {priority !== 'normal' && priority !== 'low' && (
          <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase border ${pConfig.border} ${pConfig.text} ${pConfig.bg}`}>
            <PriorityIcon className="w-3 h-3" />
            {pConfig.label}
          </div>
        )}

        {/* Level 1: Identity */}
        <div className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-xs font-bold text-white leading-tight">
              {identity.marca || 'Auto'} {identity.modelo} {identity.anio ? `(${identity.anio})` : ''}
            </h3>
            {identity.patente && (
              <span className="text-[9px] font-mono font-bold bg-gray-950 text-gray-300 px-1.5 py-0.5 rounded border border-gray-800 shrink-0">
                {identity.patente}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 flex items-center gap-1.5">
            <User className="w-3 h-3 text-gray-500 shrink-0" /> <span className="truncate">{identity.cliente || 'Cliente no registrado'}</span>
          </p>
        </div>

        {/* Level 2: Business State */}
        <div className="bg-gray-950/50 rounded-lg p-2 border border-gray-850">
          <p className="text-[10px] font-semibold text-blue-400 flex items-center gap-1.5">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate" title={businessState.current}>{businessState.current}</span>
          </p>
          {businessState.next && (
            <p className="text-[9px] text-gray-500 mt-1 pl-4.5 flex items-center gap-1 truncate" title={`Próximo Paso: ${businessState.next}`}>
              <ChevronRight className="w-3 h-3 shrink-0" /> Next: {businessState.next}
            </p>
          )}
        </div>

        {/* Level 2.5: Extra Details (Dynamic) */}
        {extraDetails && extraDetails.length > 0 && (
          <div className="space-y-1.5 mt-2 border-t border-gray-850 pt-2.5">
            {extraDetails.map((detail, idx) => (
              <div key={idx} className={`text-[10px] flex items-start gap-1.5 ${detail.highlight ? 'text-emerald-400' : 'text-gray-400'}`}>
                {detail.icon && <detail.icon className={`w-3 h-3 shrink-0 mt-0.5 ${detail.highlight ? 'text-emerald-500' : 'text-gray-500'}`} />}
                <span className="flex-1 truncate" title={`${detail.label}: ${detail.value}`}>
                  {detail.label}: <span className={detail.highlight ? 'font-bold text-emerald-400' : 'text-gray-300 font-medium'}>{detail.value}</span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Level 3: Owner */}
        <div className="flex items-center gap-1.5 text-[9px] font-medium text-gray-500 mt-2">
          <span className="w-4 h-4 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400 shrink-0 uppercase">
            {owner ? owner.charAt(0) : '?'}
          </span>
          <span className="truncate" title={`Responsable: ${owner || 'Sin asignar'}`}>Responsable: {owner || 'Sin asignar'}</span>
        </div>
      </div>

      {/* Level 4: Action (If provided) */}
      {nextAction && (
        <div className="mt-auto px-3.5 pb-3.5 pt-0">
          <button 
            onClick={(e) => { e.stopPropagation(); nextAction.onClick(); }}
            className={`w-full py-1.5 rounded-lg text-[9px] font-bold border transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wide ${actionClass} opacity-0 group-hover:opacity-100 focus:opacity-100`}
          >
            {nextAction.icon && <nextAction.icon className="w-3 h-3" />}
            {nextAction.label}
          </button>
        </div>
      )}
    </div>
  );
}
