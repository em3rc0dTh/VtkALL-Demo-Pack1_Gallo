import { Clock, CheckCircle2, PlayCircle, Check, XCircle, AlertCircle } from 'lucide-react';

export default function EstadoBadge({ estado }) {
  // Normalizar el string de estado para hacer match de forma segura
  const normalizedEstado = (estado || "").toLowerCase().replace(/ /g, "_").replace(/-/g, "_");

  const config = {
    pendiente: {
      bg: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      label: 'PENDIENTE',
      icon: Clock
    },
    confirmada: {
      bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      label: 'CONFIRMADA',
      icon: CheckCircle2
    },
    en_proceso: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      label: 'EN PROCESO',
      icon: PlayCircle
    },
    en_progreso: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      label: 'EN PROGRESO',
      icon: PlayCircle
    },
    en_curso: {
      bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      label: 'EN CURSO',
      icon: PlayCircle
    },
    completada: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      label: 'COMPLETADA',
      icon: Check
    },
    ok: {
      bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      label: 'COMPLETADA',
      icon: Check
    },
    cancelada: {
      bg: 'bg-red-500/10 text-red-500 border-red-500/20',
      label: 'CANCELADA',
      icon: XCircle
    }
  };

  const current = config[normalizedEstado] || { 
    bg: 'bg-gray-500/10 text-gray-400 border-gray-500/20', 
    label: String(estado || "DESCONOCIDO").toUpperCase(), 
    icon: AlertCircle 
  };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black tracking-widest uppercase border shadow-sm ${current.bg}`}>
      <Icon className="w-3 h-3" strokeWidth={3} />
      {current.label}
    </span>
  );
}
