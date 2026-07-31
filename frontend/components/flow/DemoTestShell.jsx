'use client';

import { useState } from 'react';
import { useFlowState } from '@/hooks/useFlowState';
import { mockApi } from '@/lib/mockApi';

import { FlowStepper } from './FlowStepper';
import { CustomerForm, ManagedEntityForm, CaseForm } from './Forms';
import { CapacitySelector } from './CapacitySelector';
import { ScheduleConfirmation } from './ScheduleConfirmation';
import { CaseTimeline } from './CaseTimeline';
import { RawResponsePanel, BackendErrorPanel } from './Panels';

export function DemoTestShell() {
  const { state, updateState, reset } = useFlowState();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const clearError = () => updateState({ lastError: null });

  const handleCustomerSubmit = async (payload) => {
    setLoading(true);
    clearError();
    updateState({ lastRequest: payload });
    const res = await mockApi.createCustomer(payload);
    updateState({ lastResponse: res });
    
    if (res.ok) {
      updateState({ customerId: res.customer._id, customer: res.customer, currentStep: 'entity' });
    } else {
      updateState({ lastError: res.error });
    }
    setLoading(false);
  };

  const handleEntitySubmit = async (payload) => {
    setLoading(true);
    clearError();
    const fullPayload = { ...payload, customerId: state.customerId };
    updateState({ lastRequest: fullPayload });
    const res = await mockApi.createManagedEntity(fullPayload);
    updateState({ lastResponse: res });
    
    if (res.ok) {
      updateState({ managedEntityId: res.managedEntity._id, managedEntity: res.managedEntity, currentStep: 'case' });
    } else {
      updateState({ lastError: res.error });
    }
    setLoading(false);
  };

  const handleCaseSubmit = async (payload) => {
    setLoading(true);
    clearError();
    const fullPayload = { ...payload, customerId: state.customerId, managedEntityId: state.managedEntityId };
    updateState({ lastRequest: fullPayload });
    const res = await mockApi.createCase(fullPayload);
    updateState({ lastResponse: res });
    
    if (res.ok) {
      updateState({ caseId: res.case._id, case: res.case, currentStep: 'schedule' });
    } else {
      updateState({ lastError: res.error });
    }
    setLoading(false);
  };

  const handleSearchSlots = async (query) => {
    setSearchLoading(true);
    clearError();
    updateState({ lastRequest: query });
    const res = await mockApi.getAvailability(query);
    updateState({ lastResponse: res });
    
    if (res.ok) {
      updateState({ availabilityQuery: query, slots: res.slots });
    } else {
      updateState({ lastError: res.error, slots: [] });
    }
    setSearchLoading(false);
  };

  const handleSelectSlot = async (slot) => {
    setLoading(true);
    clearError();
    const payload = {
      customerId: state.customerId,
      managedEntityId: state.managedEntityId,
      caseId: state.caseId,
      teamId: "team_frontdesk",
      startAt: slot.startAt,
      durationMinutes: 60
    };
    updateState({ lastRequest: payload });
    const res = await mockApi.scheduleConsultation(payload);
    updateState({ lastResponse: res });

    if (res.ok) {
      updateState({ 
        appointmentId: res.appointment._id, 
        appointment: res.appointment,
        resourceReservationId: res.resourceReservation._id,
        resourceReservation: res.resourceReservation,
        currentStep: 'done' 
      });
    } else {
      updateState({ lastError: res.error });
    }
    setLoading(false);
  };

  const handleFinish = async () => {
    setLoading(true);
    clearError();
    const res = await mockApi.getTimeline(state.caseId);
    if (res.ok) {
      updateState({ timeline: res.events, currentStep: 'timeline' });
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Demo Test: ContractMK1 Flow</h1>
        <p className="text-text-secondary mt-1">
          Frontend independiente para validar el flujo completo según el nuevo contrato.
        </p>
      </div>

      <RawResponsePanel request={state.lastRequest} response={state.lastResponse} />
      <BackendErrorPanel error={state.lastError} onDismiss={clearError} />

      {state.currentStep !== 'timeline' && <FlowStepper currentStep={state.currentStep} />}

      <div className="mt-8">
        {state.currentStep === 'customer' && (
          <CustomerForm onSubmit={handleCustomerSubmit} loading={loading} />
        )}
        
        {state.currentStep === 'entity' && (
          <ManagedEntityForm onSubmit={handleEntitySubmit} loading={loading} customer={state.customer} />
        )}

        {state.currentStep === 'case' && (
          <CaseForm onSubmit={handleCaseSubmit} loading={loading} managedEntity={state.managedEntity} />
        )}

        {state.currentStep === 'schedule' && (
          <CapacitySelector 
            onSearch={handleSearchSlots}
            onSelectSlot={handleSelectSlot}
            slots={state.slots}
            loading={loading}
            searchLoading={searchLoading}
          />
        )}

        {state.currentStep === 'done' && (
          <ScheduleConfirmation 
            appointment={state.appointment} 
            reservation={state.resourceReservation} 
            onFinish={handleFinish} 
          />
        )}

        {state.currentStep === 'timeline' && (
          <CaseTimeline events={state.timeline} onReset={reset} />
        )}
      </div>
    </div>
  );
}
