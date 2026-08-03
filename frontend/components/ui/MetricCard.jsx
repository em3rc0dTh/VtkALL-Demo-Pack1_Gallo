import { Card, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export function MetricCard({ label, value, hint, variant = 'neutral' }) {
  return (
    <Card className="min-h-[112px]">
      <CardContent className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-text-secondary">{label}</span>
          <Badge estado={hint} variant={variant} />
        </div>
        <div className="text-3xl font-bold leading-none text-text-primary">{value}</div>
      </CardContent>
    </Card>
  );
}
