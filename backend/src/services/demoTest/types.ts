export type BusinessScopedInput = {
  businessSlug: string;
};

export type DemoTestActor = {
  type: 'system' | 'user' | 'workflow' | 'agent';
  id?: string;
  name?: string;
};

export type DemoTestSource = {
  channel?: string;
  agent?: string;
  origin?: string;
};

export type DemoTestWarning = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export type DemoTestSuccess<T> = {
  ok: true;
  data: T;
  warnings?: DemoTestWarning[];
};

export type BlockingReservationStatus = 'held' | 'booked';

export type NonBlockingReservationStatus = 'cancelled' | 'released' | 'expired';

export type ResourceReservationStatus = BlockingReservationStatus | NonBlockingReservationStatus;

export type DemoTestManagedEntityType = 'vehicle' | 'dessert_request' | 'other';

export type DemoTestTimelineEventType =
  | 'customer.created'
  | 'managed_entity.created'
  | 'case.created'
  | 'availability.checked'
  | 'resource_reservation.held'
  | 'resource_reservation.booked'
  | 'resource_reservation.released'
  | 'appointment.scheduled'
  | 'appointment.confirmed'
  | 'appointment.failed'
  | 'status.changed';

export const BLOCKING_RESERVATION_STATUSES: BlockingReservationStatus[] = ['held', 'booked'];

export const NON_BLOCKING_RESERVATION_STATUSES: NonBlockingReservationStatus[] = ['cancelled', 'released', 'expired'];

export type IdempotentOperationInput = {
  idempotencyKey?: string;
  workflowId?: string;
};

export type TimelinePolicy = {
  failBeforeAppointmentCreation: true;
  warnAfterAppointmentAndReservationBooked: true;
};

export const TIMELINE_POLICY: TimelinePolicy = {
  failBeforeAppointmentCreation: true,
  warnAfterAppointmentAndReservationBooked: true,
};

export type CreateOrReuseCustomerInput = BusinessScopedInput & {
  name: string;
  phone?: string;
  normalizedPhone?: string;
  contact?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type GetCustomerByIdInput = BusinessScopedInput & {
  customerId: string;
};

export type CreateOrReuseCustomerResult = {
  customer: unknown;
  reused: boolean;
};

export type CreateManagedEntityInput = BusinessScopedInput & {
  customerId: string;
  type: DemoTestManagedEntityType;
  displayName?: string;
  summary?: string;
  status?: string;
  data?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type GetManagedEntityByIdInput = BusinessScopedInput & {
  managedEntityId: string;
};

export type CreateOperationalCaseInput = BusinessScopedInput & {
  customerId: string;
  managedEntityId?: string;
  verticalType?: string;
  status?: string;
  statusGroup?: string;
  priority?: string;
  source?: DemoTestSource;
  intent?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

export type GetCaseByIdInput = BusinessScopedInput & {
  caseId: string;
};

export type UpdateCaseStatusInput = BusinessScopedInput & {
  caseId: string;
  status: string;
  statusGroup?: string;
  reason?: string;
};

export type GetAvailabilityInput = BusinessScopedInput & {
  teamId?: string;
  date: string;
  durationMinutes?: number;
  timezone: string;
  catalogOfferingId?: string;
  caseId?: string;
};

export type AvailabilitySlotCandidate = {
  _id: string;
  businessSlug: string;
  catalogOfferingId?: string;
  teamId: string;
  teamName?: string;
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  slotGranularityMinutes: number;
  requiredUnits: number;
  effectiveCapacity: number;
  availableCapacity: number;
  slotKeys: string[];
};

export type AvailabilityResult = BusinessScopedInput & {
  teamId: string;
  catalogOfferingId?: string;
  date: string;
  durationMinutes: number;
  slotGranularityMinutes: number;
  timezone: string;
  slots: AvailabilitySlotCandidate[];
};

export type ReservationCapacityCheckInput = BusinessScopedInput & {
  teamId: string;
  slotKeys: string[];
  effectiveCapacity: number;
  excludeReservationId?: string;
};

export type HoldResourceReservationInput = IdempotentOperationInput &
  BusinessScopedInput & {
    teamId: string;
    catalogOfferingId?: string;
    caseId?: string;
    customerId?: string;
    managedEntityId?: string;
    startAt: Date;
    endAt: Date;
    durationMinutes: number;
    slotGranularityMinutes: number;
    timezone?: string;
    requiredUnits?: number;
    slotKeys?: string[];
    expiresAt?: Date;
    effectiveCapacity?: number;
  };

export type ConfirmResourceReservationInput = BusinessScopedInput & {
  resourceReservationId: string;
  reason?: string;
};

export type ReleaseResourceReservationInput = BusinessScopedInput & {
  resourceReservationId: string;
  reason?: string;
};

export type ReservationStateTransitionResult = {
  reservation: unknown;
  previousStatus: ResourceReservationStatus;
  nextStatus: ResourceReservationStatus;
};

export type CreateAppointmentInput = IdempotentOperationInput &
  BusinessScopedInput & {
    caseId: string;
    customerId: string;
    managedEntityId: string;
    resourceReservationId: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    timezone: string;
    appointmentType: string;
  };

export type CancelAppointmentInput = BusinessScopedInput & {
  appointmentId: string;
  reason?: string;
};

export type RecordTimelineEventInput = BusinessScopedInput & {
  caseId: string;
  eventType: DemoTestTimelineEventType;
  title: string;
  description?: string;
  visibility?: 'internal' | 'customer' | 'system';
  actor?: DemoTestActor;
  metadata?: Record<string, unknown>;
};

export type ListTimelineByCaseInput = BusinessScopedInput & {
  caseId: string;
};

export type ScheduleConsultationInput = IdempotentOperationInput &
  BusinessScopedInput & {
    caseId: string;
    customerId: string;
    managedEntityId: string;
    teamId: string;
    catalogOfferingId?: string;
    startAt: Date;
    durationMinutes: number;
    timezone: string;
    appointmentType: string;
  };

export type ScheduleConsultationResult = {
  appointment: unknown;
  resourceReservation: unknown;
  case: {
    _id: string;
    status: string;
  };
  warnings?: DemoTestWarning[];
};

export type DemoTestSeedInspectionCollection = {
  count: number;
  sampleIds: string[];
};

export type DemoTestSeedInspectionReport = {
  businessSlug: string;
  workTeams: DemoTestSeedInspectionCollection;
  workTeamScheduleRules: DemoTestSeedInspectionCollection;
  workTeamScheduleOverrides: DemoTestSeedInspectionCollection;
  catalogOfferings: DemoTestSeedInspectionCollection;
  resourceReservations: DemoTestSeedInspectionCollection & {
    blockingCount: number;
    expiredHoldsCount: number;
  };
  appointments: DemoTestSeedInspectionCollection;
  cases: DemoTestSeedInspectionCollection;
  conclusion: {
    seedSufficient: boolean;
    cleanupRecommended: boolean;
    resetRecommended: boolean;
    proposedAction: 'none' | 'partial_cleanup' | 'full_reset';
  };
};
