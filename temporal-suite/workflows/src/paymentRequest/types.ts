// types.ts — Tipos e interfaces del módulo PaymentRequest

export type PRStatus =
    | 'pending'
    | 'approved'
    | 'authorized'
    | 'paid'
    | 'rejected';

export interface PaymentRequest {
    _id: string;
    tenantId: string;
    projectId: string;
    projectName: string;
    providerId: string;
    providerName: string;
    subtotal: number;
    tax: number;
    total: number;
    currency: string;
    date?: string;
    dueDate?: string;
    notes?: string;
    status: PRStatus;
    createdBy: string;
    createdByName: string;
    createdByEmail: string;
    projectOwnerEmail: string;
    projectOwnerName: string;
    attachments?: string[];
}

// Payloads de cada señal
export interface AprobarPayload {
    userId: string;
    userName: string;
    notes?: string;
}

export interface AutorizarPayload {
    userId: string;
    userName: string;
    paymentDate: string;
    bankAccountId: string;
    bankAccountName: string;
    notes?: string;
}

export interface PagarPayload {
    userId: string;
    userName: string;
    paymentProof: string;
    notes?: string;
}

export interface RechazarPayload {
    userId: string;
    userName: string;
    reason: string;
}

// Estado completo del workflow (para queries)
export interface PRWorkflowState {
    status: PRStatus;
    pr: PaymentRequest;
    aprobacion?: AprobarPayload & { timestamp: string };
    autorizacion?: AutorizarPayload & { timestamp: string };
    pago?: PagarPayload & { timestamp: string };
    rechazo?: RechazarPayload & { timestamp: string };
    history: Array<{ status: PRStatus; timestamp: string; actor?: string }>;
}
