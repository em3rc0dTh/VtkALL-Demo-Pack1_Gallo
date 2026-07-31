import { ReadOnlyProcessSummary } from './hermesContext.contract';

const nextMissingField = (state: any) => {
  const data = state?.customerData || {};
  const required = Array.isArray(state?.requiredFields) && state.requiredFields.length
    ? state.requiredFields.map((field: any) => String(field?.key || field?.label || ''))
    : [];
  return required.find((field: string) => field && !String(data[field] || '').trim());
};

export const summarizeProcessContext = (state?: any): ReadOnlyProcessSummary | undefined => {
  if (!state?.status) return undefined;
  const nextRecommendedField = nextMissingField(state);
  const optionSource = Array.isArray(state?.availableOptions) && state.availableOptions.length
    ? state.availableOptions
    : Array.isArray(state?.availableSlots) && state.availableSlots.length
      ? state.availableSlots
      : [];
  const availableOptions = optionSource.length
    ? optionSource.slice(0, 6).map((slot: any) => ({
      id: String(slot?._id || slot?.id || slot?.slotId || ''),
      label: String(slot?.label || ''),
      startAt: slot?.startAt ? String(slot.startAt) : undefined,
      endAt: slot?.endAt ? String(slot.endAt) : undefined,
    }))
    : undefined;
  return {
    active: !['APPOINTMENT_BOOKED', 'CANCELLED', 'FAILED_SERVICE_NOT_IN_CATALOG', 'FAILED_SLOT_UNAVAILABLE'].includes(String(state.status)),
    processType: 'schedule_consultation',
    status: String(state.status),
    awaiting: state.status === 'WAITING_FOR_SERVICE_SELECTION'
      ? {
        type: 'offering_selection',
        field: 'catalogOfferingId',
        nextRecommendedField: 'catalogOfferingId',
      }
      : state.status === 'WAITING_FOR_CUSTOMER_DATA'
        ? {
          type: nextRecommendedField === 'managedEntityDisplayName' ? 'managed_entity_information' : 'customer_information',
          field: nextRecommendedField,
          nextRecommendedField,
        }
        : state.status === 'CUSTOMER_DATA_VALIDATED'
          ? {
            type: 'date_preference',
            field: 'preferredDate',
            nextRecommendedField: 'preferredDate',
          }
          : state.status === 'WAITING_FOR_SLOT_SELECTION'
            ? {
              type: 'slot_selection',
              field: 'slotId',
              nextRecommendedField: 'slotId',
            }
            : {
              type: state.awaiting?.type,
              field: state.awaiting?.field,
              nextRecommendedField: state.awaiting?.nextRecommendedField,
            },
    knownFacts: {
      firstName: state.customerData?.firstName,
      offeringId: state.selectedOffering?._id || state.selectedOfferingId,
      offering: state.selectedOffering,
      durationMinutes: state.durationMinutes || state.selectedOffering?.fulfillmentPolicy?.estimatedDurationMinutes,
    },
    availableOptions,
    allowedActions: [],
    informationalOnly: true,
  };
};
