import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function CaseTimeline({ events, onReset }) {
  if (!events || events.length === 0) return null;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Timeline del Caso</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative border-l border-border-strong ml-3 space-y-6 pb-4">
          {events.map((evt, idx) => (
            <div key={idx} className="relative pl-6">
              <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-action-primary rounded-full ring-4 ring-surface-panel" />
              <div className="mb-1 text-xs text-text-muted">
                {new Date(evt.createdAt).toLocaleString()}
              </div>
              <h4 className="text-sm font-bold text-text-primary">{evt.title}</h4>
              <p className="text-sm text-text-secondary mt-1">{evt.description}</p>
              <div className="text-xs font-mono text-text-disabled mt-2">
                Type: {evt.eventType}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-4 border-t border-border-subtle flex justify-center">
          <Button variant="outline" onClick={onReset}>
            Iniciar Nuevo Flujo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
