import { errorMessages } from '@/lib/errorMessages';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AlertCircle, Code } from 'lucide-react';

export function BackendErrorPanel({ error, onDismiss }) {
  if (!error) return null;

  const msg = errorMessages[error.code] || errorMessages.INTERNAL_ERROR;

  return (
    <div className="p-4 bg-status-danger-soft border border-status-danger/30 rounded-xl mb-6">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-status-danger shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-bold text-status-danger">{msg.title}</h3>
          <p className="text-sm text-status-danger/80 mt-1">{error.message || msg.action}</p>
          {error.details && (
            <pre className="mt-3 p-2 bg-surface-panel/50 rounded text-xs font-mono text-status-danger border border-status-danger/20 overflow-auto">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          )}
          {onDismiss && (
            <button onClick={onDismiss} className="text-xs font-semibold text-status-danger hover:underline mt-3 block">
              Entendido
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function RawResponsePanel({ request, response }) {
  if (!request && !response) return null;

  return (
    <Card className="w-full mb-6 border-border-subtle shadow-none bg-surface-subtle">
      <CardHeader className="py-3 px-4 border-b border-border-subtle flex flex-row items-center gap-2">
        <Code className="w-4 h-4 text-text-muted" />
        <CardTitle className="text-sm text-text-secondary">Visor de Payload (ContractMK1)</CardTitle>
      </CardHeader>
      <CardContent className="p-0 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border-subtle">
        <div className="p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2 tracking-wider">Request Payload</h4>
          <pre className="text-[11px] font-mono text-code-text bg-code-bg p-3 rounded-lg overflow-auto max-h-60">
            {request ? JSON.stringify(request, null, 2) : "No request data"}
          </pre>
        </div>
        <div className="p-4">
          <h4 className="text-xs font-semibold text-text-muted uppercase mb-2 tracking-wider">Raw Response</h4>
          <pre className="text-[11px] font-mono text-code-text bg-code-bg p-3 rounded-lg overflow-auto max-h-60">
            {response ? JSON.stringify(response, null, 2) : "No response data"}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
