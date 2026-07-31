import { AlertCircle, CheckCircle2, Clock, PlayCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusLabel, statusTitle, statusVariant } from '@/lib/admin/statusPresentation';

const VARIANTS = {
  danger: {
    className: 'bg-status-danger-soft text-status-danger border-status-danger/25',
    icon: XCircle,
  },
  warning: {
    className: 'bg-status-warning-soft text-status-warning border-status-warning/25',
    icon: Clock,
  },
  success: {
    className: 'bg-status-success-soft text-status-success border-status-success/25',
    icon: CheckCircle2,
  },
  info: {
    className: 'bg-status-info-soft text-status-info border-status-info/25',
    icon: PlayCircle,
  },
  neutral: {
    className: 'bg-status-neutral-soft text-status-neutral border-status-neutral/25',
    icon: AlertCircle,
  },
};

const inferVariant = (estado = '') => {
  const mapped = statusVariant(estado);
  if (mapped !== 'neutral') return mapped;
  const normalized = String(estado).toLowerCase().replace(/[\s-]+/g, '_');
  if (['fallido', 'bloqueado', 'urgente', 'riesgo', 'detenido', 'conflicto'].some((key) => normalized.includes(key))) return 'danger';
  if (['pendiente', 'incompleto', 'vence', 'revision', 'parcial', 'esperando'].some((key) => normalized.includes(key))) return 'warning';
  if (['completo', 'confirmado', 'disponible', 'aprobado', 'listo'].some((key) => normalized.includes(key))) return 'success';
  if (['diagnostico', 'ejecucion', 'enviado', 'informativo', 'activo', 'recibido'].some((key) => normalized.includes(key))) return 'info';
  return mapped;
};

export default function Badge({ estado, variant, className }) {
  const resolvedVariant = variant || inferVariant(estado);
  const current = VARIANTS[resolvedVariant] || VARIANTS.neutral;
  const Icon = current.icon;
  const label = statusLabel(estado || resolvedVariant);

  return (
    <span
      title={statusTitle(estado || resolvedVariant)}
      className={cn(
        'inline-flex min-h-6 w-fit items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold',
        current.className,
        className
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
