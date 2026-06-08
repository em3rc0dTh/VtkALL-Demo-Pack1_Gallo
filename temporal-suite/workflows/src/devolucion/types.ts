// types.ts — Tipos del módulo Solicitud de Devolución

import type { PaymentRequest } from '../paymentRequest/types';

// Tipo de solicitud según la diferencia detectada
export type TipoDevolucion =
    | 'reembolso'   // Se pagó DE MENOS → la empresa debe pagar más al trabajador
    | 'devolucion'; // Se pagó DE MÁS  → el trabajador debe regresar dinero a la empresa

export type DevolucionStatus =
    | 'pending'    // Creada, esperando aprobación
    | 'approved'   // Aprobada, esperando comprobante
    | 'completed'  // Cerrada exitosamente
    | 'rejected';  // Rechazada desde cualquier estado

export interface SolicitudDevolucion {
    _id: string;
    tenantId: string;

    // Referencia al PaymentRequest original
    paymentRequestId: string;
    paymentRequestRef: string;        // Descripción legible (ej: "PR-001 — Constructora del Norte")

    // Contexto del proyecto y personas
    projectId: string;
    projectName: string;
    trabajadorId: string;
    trabajadorName: string;
    trabajadorEmail: string;
    projectOwnerEmail: string;
    projectOwnerName: string;

    // Montos y diferencia
    montoOriginalPagado: number;      // Lo que se pagó en la PR original
    montoRealRequerido: number;       // Lo que realmente se necesitaba
    diferencia: number;               // |montoRealRequerido - montoOriginalPagado|
    currency: string;

    // El tipo determinado automáticamente al crear
    tipo: TipoDevolucion;

    // Descripción y evidencia
    notes?: string;
    attachments?: string[];

    status: DevolucionStatus;
    createdBy: string;
    createdByName: string;
}

// ── Payloads de señales ──────────────────────────────────────────────────────

export interface AprobarDevolucionPayload {
    userId: string;
    userName: string;
    notes?: string;
}

export interface CompletarDevolucionPayload {
    userId: string;
    userName: string;
    comprobante: string;    // URL del comprobante (pago adicional o recibo de devolución)
    fechaEfectiva: string;  // Fecha en que se realizó el pago/devolución
    notes?: string;
}

export interface RechazarDevolucionPayload {
    userId: string;
    userName: string;
    reason: string;
}

// ── Estado completo del workflow (para queries) ──────────────────────────────

export interface DevolucionWorkflowState {
    status: DevolucionStatus;
    solicitud: SolicitudDevolucion;
    aprobacion?: AprobarDevolucionPayload & { timestamp: string };
    completado?: CompletarDevolucionPayload & { timestamp: string };
    rechazo?: RechazarDevolucionPayload & { timestamp: string };
    history: Array<{ status: DevolucionStatus; timestamp: string; actor?: string }>;

    // Resumen calculado (útil para la UI)
    resumen: {
        tipo: TipoDevolucion;
        descripcion: string;   // "El trabajador debe devolver USD 500.00 a la empresa"
        accionRequerida: string; // "Procesar reembolso" | "Confirmar devolución"
    };
}
