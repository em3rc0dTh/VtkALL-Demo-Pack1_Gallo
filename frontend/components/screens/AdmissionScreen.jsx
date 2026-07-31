'use client';

import { useMemo } from 'react';
import { AdmissionDiagnosticBoard } from '../admission-diagnostic/AdmissionDiagnosticBoard';
import { Button } from '@/components/ui/Button';
import { LayoutGrid, CalendarDays, Plus } from 'lucide-react';
import { useAdminData } from '@/hooks/useAdminData';
import {
  adminEmptyData,
  appointmentForCase,
  customerName,
  indexById,
  isOperationalCaseRecord,
  managedEntityLabel,
  managedEntitySecondary,
  offeringName,
  reservationForCase,
} from '@/lib/admin/adminMappers';

const stageForStatus = (status = '') => {
  const normalized = String(status).toLowerCase();
  if (normalized.includes('progress') || normalized.includes('execut') || normalized.includes('completed')) return 'evaluating_and_quoting';
  if (normalized.includes('confirmed')) return 'appointment_confirmed';
  if (normalized.includes('waiting')) return 'waiting_customer';
  if (normalized.includes('scheduled') || normalized.includes('booked')) return 'evaluation_scheduled';
  if (normalized.includes('pending') || normalized.includes('consultation')) return 'evaluation_requested';
  return 'evaluation_requested';
};

export function AdmissionScreen() {
  const { data = adminEmptyData, loading, error, reload } = useAdminData();
  const customersById = useMemo(() => indexById(data?.customers || []), [data?.customers]);
  const entitiesById = useMemo(() => indexById(data?.managedEntities || []), [data?.managedEntities]);
  const teamsById = useMemo(() => indexById(data?.workTeams || []), [data?.workTeams]);
  const offeringsById = useMemo(() => indexById(data?.catalogOfferings || []), [data?.catalogOfferings]);

  const boardItems = useMemo(() => (data?.cases || []).flatMap((caseItem) => {
    const customer = customersById.get(caseItem.customerId);
    const entity = entitiesById.get(caseItem.managedEntityId);
    const appointment = appointmentForCase(data?.appointments || [], caseItem._id);
    const reservation = reservationForCase(data?.resourceReservations || [], caseItem._id, appointment?._id);
    const offering = offeringsById.get(appointment?.catalogOfferingId || reservation?.catalogOfferingId || caseItem.catalogOfferingId);
    const team = teamsById.get(reservation?.teamId || appointment?.teamId);

    if (!isOperationalCaseRecord({ caseItem, customer, entity, appointment, reservation })) {
      return [];
    }

    return [{
      id: caseItem._id,
      caseNumber: caseItem.caseNumber || caseItem._id,
      boardStage: stageForStatus(appointment?.status || caseItem.status),
      appointmentKind: appointment?.appointmentType === 'service' ? 'service' : 'evaluation',
      cardKind: appointment?.appointmentType === 'service' ? 'service' : 'evaluation',
      appointmentStatus: appointment?.status,
      operationalStatus: caseItem.status,
      workflowStage: caseItem.status,
      confirmationStatus: appointment?.status,
      customer: { name: customerName(customer) },
      managedEntity: {
        displayName: managedEntityLabel(entity),
        secondaryLabel: managedEntitySecondary(entity),
      },
      assignment: {
        teamName: team?.name || reservation?.teamId || 'Sin asignar',
      },
      offering: { name: offeringName(offering) },
      durationMinutes: appointment?.durationMinutes || reservation?.durationMinutes,
      schedule: {
        startAt: appointment?.startAt || reservation?.startAt,
        timezone: appointment?.timezone || 'backend',
      },
      evaluation: {
        mode: appointment?.appointmentType || 'consultation',
      },
    }];
  }), [customersById, data?.appointments, data?.cases, data?.resourceReservations, entitiesById, offeringsById, teamsById]);

  if (loading) return <StateBox>Cargando admision desde backend...</StateBox>;
  if (error) return <StateBox danger>{error.message}</StateBox>;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
        <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-panel px-4 py-1.5 text-xs font-bold text-text-secondary">
          <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />confirmado</div>
          <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-slate-400" />pendiente</div>
          <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-full bg-orange-500" />en proceso</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border-default bg-surface-panel p-1">
            <button className="flex items-center gap-2 rounded-md bg-action-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm">
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button className="flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-subtle transition-colors">
              <CalendarDays className="h-4 w-4" />
              Agenda
            </button>
          </div>
          <Button size="sm" variant="outline" className="hidden sm:flex">
            Backend v3
          </Button>
          <Button size="sm" icon={Plus}>
            Ingreso Manual
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {boardItems.length ? <AdmissionDiagnosticBoard items={boardItems} onChanged={reload} /> : <StateBox>No hay Cases/Appointments en backend para admision.</StateBox>}
      </div>
    </div>
  );
}

function StateBox({ children, danger }) {
  return (
    <div className={`rounded-lg border p-4 text-sm font-semibold ${danger ? 'border-border-danger bg-surface-danger text-text-danger' : 'border-border-subtle bg-surface-panel text-text-secondary'}`}>
      {children}
    </div>
  );
}
