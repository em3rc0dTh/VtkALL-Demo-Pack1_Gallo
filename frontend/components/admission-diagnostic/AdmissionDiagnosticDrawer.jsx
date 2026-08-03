'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FactRow } from '@/components/shared/FactRow';
import { adminMutationRepository } from '@/lib/admin/adminMutationRepository';

export function AdmissionDiagnosticDrawer({ item, onClose, onChanged }) {
  const [savingStatus, setSavingStatus] = useState('');
  const [error, setError] = useState('');

  if (!item) return null;

  const isEvaluation = item.cardKind === 'evaluation';
  const actions = isEvaluation
    ? [
      { label: 'Marcar pendiente', status: 'consultation_pending', statusGroup: 'appointment' },
      { label: 'Confirmar cita', status: 'appointment_scheduled', statusGroup: 'appointment' },
      { label: 'Cancelar case', status: 'cancelled', statusGroup: 'cancelled' },
    ]
    : [
      { label: 'Poner en espera', status: 'waiting_customer', statusGroup: 'service' },
      { label: 'Marcar en ejecucion', status: 'in_progress', statusGroup: 'service' },
      { label: 'Marcar completado', status: 'completed', statusGroup: 'completed' },
    ];

  const updateStatus = async (action) => {
    setSavingStatus(action.status);
    setError('');
    try {
      await adminMutationRepository.updateCaseStatus({
        caseId: item.id,
        status: action.status,
        statusGroup: action.statusGroup,
        reason: `Admin action: ${action.label}`,
      });
      onChanged?.();
      onClose();
    } catch (updateError) {
      setError(updateError.message || 'No se pudo actualizar el Case.');
    } finally {
      setSavingStatus('');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border-subtle bg-surface-sidebar shadow-xl">
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-text-primary">CASE {item.caseNumber}</h2>
            <p className="text-sm font-semibold uppercase text-text-secondary">
              {isEvaluation ? 'Appointment Evaluation' : 'Appointment Service'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-text-muted transition-colors hover:bg-surface-subtle hover:text-text-primary">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-6">
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-text-muted">General</h3>
            <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-panel p-3">
              <FactRow label="Cliente" value={item.customer?.name || 'Sin cliente'} />
              <FactRow label="Entidad" value={item.managedEntity?.displayName || 'Sin entidad'} />
              <FactRow label="Referencia" value={item.managedEntity?.secondaryLabel || 'Sin dato'} />
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-text-muted">Detalles operativos</h3>
            <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-panel p-3">
              <FactRow label="Estado" value={(item.appointmentStatus || item.operationalStatus || item.workflowStage || 'sin_estado').replace(/_/g, ' ')} />
              <FactRow label="Equipo asignado" value={item.assignment?.teamName || 'Sin asignar'} />
              {isEvaluation ? (
                <>
                  <FactRow label="Modalidad" value={item.evaluation?.mode || 'consultation'} />
                  <FactRow label="Confirmacion" value={(item.confirmationStatus || 'sin confirmacion').replace(/_/g, ' ')} />
                </>
              ) : (
                <>
                  <FactRow label="Servicio" value={item.offering?.name || 'Sin servicio'} />
                  <FactRow label="Duracion" value={item.durationMinutes ? `${item.durationMinutes} min` : 'Sin duracion'} />
                </>
              )}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-text-muted">Programacion</h3>
            <div className="space-y-2 rounded-lg border border-border-subtle bg-surface-panel p-3">
              {item.schedule?.startAt ? (
                <>
                  <FactRow label="Fecha y hora" value={new Date(item.schedule.startAt).toLocaleString()} />
                  <FactRow label="Zona horaria" value={item.schedule.timezone || 'backend'} />
                </>
              ) : (
                <div className="text-sm italic text-text-muted">Aun no programado</div>
              )}
            </div>
          </section>
        </div>

        <div className="border-t border-border-subtle bg-surface-subtle p-6">
          <h3 className="mb-3 text-xs font-bold uppercase text-text-muted">Acciones backend</h3>
          {error && (
            <div className="mb-3 rounded border border-border-danger bg-surface-danger p-2 text-xs font-semibold text-text-danger">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            {actions.map((action) => (
              <Button
                key={action.status}
                variant="outline"
                size="sm"
                loading={savingStatus === action.status}
                className="justify-start text-xs"
                onClick={() => updateStatus(action)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
