'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { DEFAULT_PUBLIC_BUSINESS_SLUG, flowStorageKey } from '@/lib/config/businessSlug';

const FlowStateContext = createContext();

const defaultState = {
  businessSlug: DEFAULT_PUBLIC_BUSINESS_SLUG,

  customerId: null,
  customer: null,

  managedEntityId: null,
  managedEntity: null,

  caseId: null,
  case: null,

  availabilityQuery: null,
  slots: [],
  selectedSlot: null,

  appointmentId: null,
  appointment: null,

  resourceReservationId: null,
  resourceReservation: null,

  timeline: [],

  lastRequest: null,
  lastResponse: null,
  lastError: null,

  currentStep: "customer"
};

export function FlowStateProvider({ children }) {
  const [state, setState] = useState(defaultState);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(flowStorageKey);
    if (saved) {
      try {
        setState(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse flow state', e);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      sessionStorage.setItem(flowStorageKey, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const reset = () => {
    setState(defaultState);
    sessionStorage.removeItem(flowStorageKey);
  };

  if (!isLoaded) return null; // Avoid hydration mismatch by waiting for sessionStorage

  return (
    <FlowStateContext.Provider value={{ state, updateState, reset }}>
      {children}
    </FlowStateContext.Provider>
  );
}

export function useFlowState() {
  const context = useContext(FlowStateContext);
  if (!context) {
    throw new Error('useFlowState must be used within a FlowStateProvider');
  }
  return context;
}
