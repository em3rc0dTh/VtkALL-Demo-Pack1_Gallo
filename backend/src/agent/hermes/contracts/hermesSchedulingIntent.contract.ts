export type HermesSchedulingIntentType =
  | 'none'
  | 'start_booking'
  | 'continue_booking'
  | 'provide_customer_data'
  | 'select_offering'
  | 'request_availability'
  | 'select_slot'
  | 'cancel_booking'
  | 'reschedule_booking'
  | 'side_question'
  | 'ambiguous';

export interface HermesSchedulingIntent {
  type: HermesSchedulingIntentType;
  confidence: 'high' | 'medium' | 'low';
  extracted: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    offeringId?: string;
    offeringReference?: string;
    requestedDate?: string;
    requestedTime?: string;
    requestedDayPart?: 'morning' | 'afternoon' | 'evening';
    notBeforeTime?: string;
    slotId?: string;
    managedEntityHint?: string;
    cancellationReason?: string;
  };
  source: {
    messageId: string;
    conversationId: string;
    businessSlug: string;
  };
  requiresAction: boolean;
  requiresClarification: boolean;
}
