import { Clock, CheckCircle2, PlayCircle, Check, XCircle, AlertCircle, DollarSign, Package, Activity, Ban } from 'lucide-react';

export default function EstadoBadge({ estado }) {
  // Normalizar el string de estado para hacer match de forma segura
  const normalizedEstado = (estado || "").toLowerCase().replace(/ /g, "_").replace(/-/g, "_");

  const config = {
    // Operativos básicos
    pendiente: { bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'PENDIENTE', icon: Clock },
    confirmada: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'CONFIRMADO', icon: CheckCircle2 },
    confirmado: { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'CONFIRMADO', icon: CheckCircle2 },
    en_proceso: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'EN PROCESO', icon: PlayCircle },
    en_progreso: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'EN PROGRESO', icon: PlayCircle },
    en_curso: { bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20', label: 'EN CURSO', icon: PlayCircle },
    
    // Finalización
    listo: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'LISTO', icon: Check },
    completada: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'COMPLETADO', icon: Check },
    completado: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'COMPLETADO', icon: Check },
    ok: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'OK', icon: Check },
    entregado: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'ENTREGADO', icon: Package },
    cancelada: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'CANCELADO', icon: XCircle },
    cancelado: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'CANCELADO', icon: XCircle },
    vencido: { bg: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'VENCIDO', icon: AlertCircle },

    // Pagos
    pagado: { bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'PAGADO', icon: DollarSign },
    parcial: { bg: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'PAGO PARCIAL', icon: DollarSign },
    
    // Entidades
    activo: { bg: 'bg-green-500/10 text-green-400 border-green-500/20', label: 'ACTIVO', icon: Activity },
    inactivo: { bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'INACTIVO', icon: Ban },
  };

  const current = config[normalizedEstado] || { 
    bg: 'bg-gray-800 text-gray-400 border-gray-700', 
    label: String(estado || "DESCONOCIDO").toUpperCase(), 
    icon: AlertCircle 
  };
  
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase border ${current.bg} w-fit`}>
      <Icon className="w-3 h-3" strokeWidth={2.5} />
      {current.label}
    </span>
  );
}
