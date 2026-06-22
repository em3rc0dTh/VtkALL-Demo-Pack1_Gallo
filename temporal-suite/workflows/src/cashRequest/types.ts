// types.ts — Tipos e interfaces del módulo CashRequest

export type CRStatus =
    | 'created'
    | 'approved'
    | 'authorized'
    | 'paid'
    | 'expense_draft'
    | 'submitted'
    | 'under_review'
    | 'closed'
    | 'rejected'
    | 'reimbursement'
    | 'refund';

export interface CashRequest {
    _id: string;
    tenantId: string;
    projectId: string;
    projectName: string;
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    /** Supervisor / Project Owner */
    supervisorEmail: string;
    supervisorName: string;
    /** SuperAdmin (authorizer + treasurer) */
    superAdminEmail: string;
    superAdminName: string;
    requestedAmount: number;
    currency: string;
    purpose: string;
    notes?: string;
    status: CRStatus;
}

// ── Signal payloads ────────────────────────────────────────────────────────────

export interface AprobarCRPayload {
    userId: string;
    userName: string;
    notes?: string;
}

export interface AutorizarCRPayload {
    userId: string;
    userName: string;
    authorizedAmount: number;
    expensePeriodDays: number;   // Days the employee has to submit expenses
    notes?: string;
}

export interface PagarCRPayload {
    userId: string;
    userName: string;
    paymentProof: string;
    notes?: string;
}

export interface SubmitExpensePayload {
    userId: string;
    userName: string;
    totalSpent: number;
    files: string[]; // URLs / references
    notes?: string;
}

export interface ReviewExpensePayload {
    userId: string;
    userName: string;
    totalSpent: number;
    authorizedAmount: number;
    /** positive = reimbursement (company pays more), negative = refund (employee returns) */
    balance: number;
    notes?: string;
}

export interface RechazarCRPayload {
    userId: string;
    userName: string;
    reason: string;
}

export interface ClosePayload {
    userId: string;
    userName: string;
    proof?: string;
    notes?: string;
}

// ── Full workflow state (returned by estadoQuery) ──────────────────────────────

export interface CRWorkflowState {
    status: CRStatus;
    cr: CashRequest;
    aprobacion?: AprobarCRPayload & { timestamp: string };
    autorizacion?: AutorizarCRPayload & { timestamp: string };
    pago?: PagarCRPayload & { timestamp: string };
    expenseSubmit?: SubmitExpensePayload & { timestamp: string };
    review?: ReviewExpensePayload & { timestamp: string };
    closure?: ClosePayload & { timestamp: string };
    rechazo?: RechazarCRPayload & { timestamp: string };
    history: Array<{ status: CRStatus; timestamp: string; actor?: string }>;
}
