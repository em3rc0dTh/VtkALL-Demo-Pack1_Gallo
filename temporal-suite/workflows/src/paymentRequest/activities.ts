// activities.ts — Actividades REALES del flujo PaymentRequest
// Estas actividades replican exactamente el comportamiento del controller GoDigitalBack:
//   • Mismos templates HTML de email
//   • Misma lógica de notificación por etapa
//   • Nodemailer con la misma configuración SMTP

import { log } from '@temporalio/activity';
import nodemailer from 'nodemailer';
import type {
    PaymentRequest,
    AprobarPayload,
    AutorizarPayload,
    PagarPayload,
    RechazarPayload,
} from './types';

// ─── Transporte SMTP (misma config que GoDigitalBack/src/services/email.ts) ───

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT ?? '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!process.env.SMTP_USER) {
        log.warn('⚠️ SMTP_USER no configurado — email omitido', { to, subject });
        return;
    }
    const transporter = createTransporter();
    const info = await transporter.sendMail({
        from: `"${process.env.SMTP_FROM_NAME ?? 'GoDigital'}" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
    });
    log.info(`📨 Email enviado`, { to, subject, messageId: info.messageId });
}

// ─── Helpers de template (idénticos a GoDigitalBack) ───────────────────────────

function frontendUrl(): string {
    const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return base.endsWith('/') ? base.slice(0, -1) : base;
}

function emailTable(pr: PaymentRequest, extraRows: string = ''): string {
    return `
    <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold;">Project:</td>
            <td style="padding: 10px;">${pr.projectName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold;">Provider:</td>
            <td style="padding: 10px;">${pr.providerName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold;">Amount:</td>
            <td style="padding: 10px;">${pr.total.toLocaleString()} ${pr.currency}</td>
        </tr>
        ${extraRows}
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 10px; font-weight: bold;">Description:</td>
            <td style="padding: 10px;">${pr.notes ?? 'No description'}</td>
        </tr>
    </table>`;
}

type ButtonSuffix = '' | '/review' | '/authorize' | '/pay';
type ButtonColor = string;

const BUTTON_MAP: Record<ButtonSuffix, { text: string; color: ButtonColor }> = {
    '': { text: 'View Payment Request', color: '#007bff' },
    '/review': { text: 'Approve Payment Request', color: '#28a745' },
    '/authorize': { text: 'Authorize Payment Request', color: '#17a2b8' },
    '/pay': { text: 'Attend Payment Request', color: '#6f42c1' },
};

function emailButton(pr: PaymentRequest, suffix: ButtonSuffix): string {
    const { text, color } = BUTTON_MAP[suffix];
    const url = `${frontendUrl()}/payment-request/${pr._id}${suffix}`;
    return `
    <p style="margin-top: 20px; text-align: center;">
        <a href="${url}"
           style="display: inline-block; background-color: ${color}; color: white;
                  padding: 12px 24px; text-decoration: none; border-radius: 5px;
                  font-weight: bold; font-family: Arial, sans-serif;">
            ${text}
        </a>
    </p>`;
}

function wrap(body: string): string {
    return `<div style="font-family: Arial, sans-serif; padding: 20px;">${body}</div>`;
}

// ─── ACTIVIDADES ───────────────────────────────────────────────────────────────

/** Actividad trivial de "guardar" — GoDigitalBack ya guardó en MongoDB. Solo log. */
export async function guardarPaymentRequest(pr: PaymentRequest): Promise<void> {
    log.info('💾 [DB] PaymentRequest registrada en GoDigitalBack MongoDB', {
        id: pr._id,
        proyecto: pr.projectName,
        proveedor: pr.providerName,
        total: `${pr.currency} ${pr.total}`,
    });
    // GoDigitalBack ya hizo el insert — sin doble escritura.
}

/** Actualizar estado — GoDigitalBack lo hace en su controller. Solo trazabilidad. */
export async function actualizarEstado(
    prId: string,
    status: string,
    updates: Record<string, unknown>,
): Promise<void> {
    log.info(`🔄 [Temporal] Estado → ${status.toUpperCase()}`, { prId, ...updates });
    // GoDigitalBack actualiza MongoDB. Temporal lleva el audit trail del flujo.
}

// ─── Notificaciones (idénticas al controller GoDigitalBack) ───────────────────

export async function notificarCreacion(pr: PaymentRequest): Promise<void> {
    log.info('📧 Notificando creación de PR', { id: pr._id });

    const isCreatorOwner = pr.createdByEmail === pr.projectOwnerEmail;

    // 1. Email al CREADOR (confirmación) — solo si no es también el project owner
    if (!isCreatorOwner && pr.createdByEmail) {
        await sendEmail(
            pr.createdByEmail,
            `Payment Request Submitted - ${pr.projectName}`,
            wrap(`
                <h2>New Payment Request Submitted</h2>
                <p>Hello ${pr.createdByName},</p>
                <p>You have successfully submitted a new payment request.</p>
                ${emailTable(pr)}
                ${emailButton(pr, '')}
            `),
        );
    }

    // 2. Email al PROJECT OWNER (acción requerida: aprobar)
    if (pr.projectOwnerEmail) {
        await sendEmail(
            pr.projectOwnerEmail,
            `Action Required: Approve Payment Request - ${pr.projectName}`,
            wrap(`
                <h2>New Payment Request to Approve</h2>
                <p>Hello ${pr.projectOwnerName},</p>
                ${isCreatorOwner
                    ? '<p>You created this request, but it still requires your formal approval.</p>'
                    : '<p>You have a new payment request pending your approval.</p>'}
                ${emailTable(pr)}
                ${emailButton(pr, '/review')}
            `),
        );
    }
}

export async function notificarAprobacion(
    pr: PaymentRequest,
    data: AprobarPayload,
): Promise<void> {
    log.info('📧 Notificando aprobación', { aprobadoPor: data.userName });

    // Notificar al CREADOR
    if (pr.createdByEmail) {
        await sendEmail(
            pr.createdByEmail,
            `Payment Request Approved - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Approved</h2>
                <p>Hello ${pr.createdByName},</p>
                <p>Your payment request has been approved by the Project Owner (${data.userName}). It is now pending authorization.</p>
                ${emailTable(pr, `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:10px;font-weight:bold;">Status:</td>
                        <td style="padding:10px;">approved</td>
                    </tr>
                    ${data.notes ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;font-weight:bold;">Approval Notes:</td><td style="padding:10px;">${data.notes}</td></tr>` : ''}
                `)}
                ${emailButton(pr, '')}
            `),
        );
    }

    // Notificar al APROBADOR (self — confirmación)
    if (pr.projectOwnerEmail) {
        await sendEmail(
            pr.projectOwnerEmail,
            `Payment Request Approved (Confirmation) - ${pr.projectName}`,
            wrap(`
                <h2>You Approved a Payment Request</h2>
                <p>Hello ${pr.projectOwnerName},</p>
                <p>You have approved the payment request. It is now awaiting authorization.</p>
                ${emailTable(pr)}
                ${emailButton(pr, '')}
            `),
        );
    }

    // Notificar al PROJECT OWNER (siguiente paso: autorizar)
    if (pr.projectOwnerEmail) {
        await sendEmail(
            pr.projectOwnerEmail,
            `Action Required: Authorize Payment Request - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Authorization Needed</h2>
                <p>Hello ${pr.projectOwnerName},</p>
                <p>You have approved a payment request. The next step is to <strong>Authorize</strong> it.</p>
                ${emailTable(pr)}
                ${emailButton(pr, '/authorize')}
            `),
        );
    }
}

export async function notificarAutorizacion(
    pr: PaymentRequest,
    data: AutorizarPayload,
): Promise<void> {
    log.info('📧 Notificando autorización', { autorizadoPor: data.userName });

    // Notificar al CREADOR
    if (pr.createdByEmail) {
        await sendEmail(
            pr.createdByEmail,
            `Payment Request Authorized - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Authorized</h2>
                <p>Hello ${pr.createdByName},</p>
                <p>Your payment request has been authorized by the Business Unit Admin (${data.userName}). It is now pending payment.</p>
                ${emailTable(pr, `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:10px;font-weight:bold;">Payment Date:</td>
                        <td style="padding:10px;">${new Date(data.paymentDate).toLocaleDateString()}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:10px;font-weight:bold;">Debited Account:</td>
                        <td style="padding:10px;">${data.bankAccountName}</td>
                    </tr>
                    ${data.notes ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;font-weight:bold;">Authorization Notes:</td><td style="padding:10px;">${data.notes}</td></tr>` : ''}
                `)}
                ${emailButton(pr, '')}
            `),
        );
    }

    // Notificar al AUTORIZADOR (self — siguiente paso: pagar)
    if (pr.projectOwnerEmail) {
        await sendEmail(
            pr.projectOwnerEmail,
            `Action Required: Attend Payment Request - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Authorized</h2>
                <p>Hello ${pr.projectOwnerName},</p>
                <p>You have authorized the payment request. The final step is to <strong>Attend/Pay</strong> it.</p>
                ${emailTable(pr, `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:10px;font-weight:bold;">Payment Date:</td>
                        <td style="padding:10px;">${new Date(data.paymentDate).toLocaleDateString()}</td>
                    </tr>
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:10px;font-weight:bold;">Debited Account:</td>
                        <td style="padding:10px;">${data.bankAccountName}</td>
                    </tr>
                `)}
                ${emailButton(pr, '/pay')}
            `),
        );
    }
}

export async function notificarPago(
    pr: PaymentRequest,
    data: PagarPayload,
): Promise<void> {
    log.info('📧 Notificando pago completado', { pagadoPor: data.userName });

    // Notificar al CREADOR
    if (pr.createdByEmail) {
        await sendEmail(
            pr.createdByEmail,
            `Payment Completed - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Paid</h2>
                <p>Hello ${pr.createdByName},</p>
                <p>Your payment request has been processed/attended by (${data.userName}).</p>
                <p>Payment Proof: <a href="${data.paymentProof}">View Voucher</a></p>
                ${emailTable(pr, `
                    <tr style="border-bottom:1px solid #eee;">
                        <td style="padding:10px;font-weight:bold;">Status:</td>
                        <td style="padding:10px;">paid</td>
                    </tr>
                    ${data.notes ? `<tr style="border-bottom:1px solid #eee;"><td style="padding:10px;font-weight:bold;">Payment Notes:</td><td style="padding:10px;">${data.notes}</td></tr>` : ''}
                `)}
                ${emailButton(pr, '')}
            `),
        );
    }

    // Notificar al PAGADOR (self — confirmación)
    if (pr.projectOwnerEmail) {
        await sendEmail(
            pr.projectOwnerEmail,
            `Payment Processed (Confirmation) - ${pr.projectName}`,
            wrap(`
                <h2>You Processed a Payment</h2>
                <p>Hello ${pr.projectOwnerName},</p>
                <p>You have successfully marked the payment request as paid.</p>
                ${emailTable(pr)}
                ${emailButton(pr, '')}
            `),
        );
    }
}

export async function notificarRechazo(
    pr: PaymentRequest,
    data: RechazarPayload,
): Promise<void> {
    log.info('📧 Notificando rechazo', { rechazadoPor: data.userName, motivo: data.reason });

    if (pr.createdByEmail) {
        await sendEmail(
            pr.createdByEmail,
            `Payment Request Rejected - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Rejected</h2>
                <p>Hello ${pr.createdByName},</p>
                <p>Your payment request has been rejected by ${data.userName}.</p>
                ${emailTable(pr, `
                    <tr style="border-bottom:1px solid #fee; background-color: #fee;">
                        <td style="padding:10px;font-weight:bold;color:#dc3545;">Rejection Reason:</td>
                        <td style="padding:10px;color:#dc3545;">${data.reason}</td>
                    </tr>
                `)}
                ${emailButton(pr, '')}
            `),
        );
    }
}

export async function notificarTimeout(
    pr: PaymentRequest,
    etapa: string,
    dias: number,
): Promise<void> {
    log.warn(`⏰ Timeout en etapa ${etapa} — ${dias} días sin respuesta`, { prId: pr._id });

    const mensaje = `The payment request has been automatically rejected after ${dias} days without a response at stage: ${etapa}.`;

    if (pr.createdByEmail) {
        await sendEmail(
            pr.createdByEmail,
            `Payment Request Expired - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Expired</h2>
                <p>Hello ${pr.createdByName},</p>
                <p>${mensaje}</p>
                ${emailTable(pr)}
                ${emailButton(pr, '')}
            `),
        );
    }

    if (pr.projectOwnerEmail) {
        await sendEmail(
            pr.projectOwnerEmail,
            `Payment Request Expired (No Action Taken) - ${pr.projectName}`,
            wrap(`
                <h2>Payment Request Expired</h2>
                <p>Hello ${pr.projectOwnerName},</p>
                <p>${mensaje}</p>
                ${emailTable(pr)}
                ${emailButton(pr, '')}
            `),
        );
    }
}
