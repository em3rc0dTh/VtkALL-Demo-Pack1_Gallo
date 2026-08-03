import {
  CreateAppointmentInput,
  CreateManagedEntityInput,
  CreateOperationalCaseInput,
  CreateOrReuseCustomerInput,
  GetAvailabilityInput,
  IdempotentOperationInput,
} from './types';

export type ScheduleConsultationDraftInput = IdempotentOperationInput & {
  customer?: CreateOrReuseCustomerInput;
  managedEntity?: CreateManagedEntityInput;
  case?: CreateOperationalCaseInput;
  availability?: GetAvailabilityInput;
  appointment?: CreateAppointmentInput;
};

// Policy: /api/demo-test/schedule-consultation remains manual service orchestration until stability tests pass.
