export const TASK_QUEUE = 'vtkall-demo-test-schedule-consultation';

export type CustomerDataInput = {
  firstName: string;
  lastName: string;
  phone: string;
  managedEntityType?: string;
  managedEntityDisplayName: string;
  managedEntitySummary?: string;
  managedEntityData?: Record<string, unknown>;
  verticalType?: string;
};

export type ScheduleConsultationStatus =
  | 'CATALOG_REQUESTED'
  | 'WAITING_FOR_SERVICE_SELECTION'
  | 'WAITING_FOR_CUSTOMER_DATA'
  | 'CUSTOMER_DATA_VALIDATED'
  | 'WAITING_FOR_SLOT_SELECTION'
  | 'SLOT_SELECTED'
  | 'APPOINTMENT_BOOKED'
  | 'FAILED_SERVICE_NOT_IN_CATALOG'
  | 'FAILED_INVALID_DATA'
  | 'FAILED_SLOT_UNAVAILABLE'
  | 'CANCELLED';

export type ScheduleConsultationState = {
  workflowId?: string;
  businessSlug: string;
  status: ScheduleConsultationStatus;
  nextAction: string;
  agentInstruction: string;
  catalog: any[];
  selectedOffering?: any;
  requiredFields: any[];
  customerData?: CustomerDataInput;
  availableSlots: any[];
  selectedSlotId?: string;
  selectedTeamId?: string;
  durationMinutes?: number;
  reservationId?: string;
  reservationStartAt?: string;
  reservationEndAt?: string;
  appointment?: any;
  errors: string[];
};

export type ScheduleConsultationInput = {
  businessSlug: string;
  conversationId?: string;
  agentRole?: 'manual';
};
