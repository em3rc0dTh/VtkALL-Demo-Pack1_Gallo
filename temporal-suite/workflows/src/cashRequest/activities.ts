// activities.ts — Actividades del flujo Cash Request
// Siguen exactamente el mismo patrón que paymentRequest/activities.ts:
//   • Mismo transporte SMTP (nodemailer)
//   • Mismos templates HTML
//   • Cada actividad: notificar + actualizar estado via API del backend (GoDigitalBack)

import { log } from '@temporalio/activity';
import nodemailer from 'nodemailer';
import axios from 'axios';
import type {
    CashRequest,
    AprobarCRPayload,
    AutorizarCRPayload,
    PagarCRPayload,
    SubmitExpensePayload,
    ReviewExpensePayload,
    RechazarCRPayload,
    ClosePayload,
} from './types';

// ─── SMTP ─────────────────────────────────────────────────────────────────────

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
        to, subject, html,
    });
    log.info(`📨 Email enviado`, { to, subject, messageId: info.messageId });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function frontendUrl(): string {
    const base = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return base.endsWith('/') ? base.slice(0, -1) : base;
}

function backendUrl(): string {
    const base = process.env.BACKEND_URL ?? 'http://localhost:5000';
    return base.endsWith('/') ? base.slice(0, -1) : base;
}

function wrap(body: string): string {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9;">
        <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.08);">
            <div style="border-bottom: 3px solid #6366f1; padding-bottom: 12px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #1e1b4b; font-size: 20px;">GoDigital</h2>
                <p style="margin: 4px 0 0; color: #6b7280; font-size: 12px;">Cash Request Management</p>
            </div>
            ${body}
            <hr style="margin: 24px 0; border: none; border-top: 1px solid #e5e7eb;" />
            <p style="color: #9ca3af; font-size: 11px; text-align: center;">
                This is an automated notification from GoDigital. Do not reply to this email.
            </p>
        </div>
    </div>`;
}

function emailTable(cr: CashRequest, extraRows: string = ''): string {
    return `
    <table style="border-collapse: collapse; width: 100%;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 12px; font-weight: bold; color: #374151; width: 40%;">Project:</td>
            <td style="padding: 8px 12px; color: #111827;">${cr.projectName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
            <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Employee:</td>
            <td style="padding: 8px 12px; color: #111827;">${cr.employeeName}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Amount Requested:</td>
            <td style="padding: 8px 12px; color: #111827;">${cr.requestedAmount.toLocaleString()} ${cr.currency}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
            <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Purpose:</td>
            <td style="padding: 8px 12px; color: #111827;">${cr.purpose}</td>
        </tr>
        ${extraRows}
    </table>`;
}

function emailButton(cr: CashRequest, suffix: string, text: string, color: string): string {
    const url = `${frontendUrl()}/cash-request/${cr._id}${suffix}`;
    return `
    <p style="margin-top: 20px; text-align: center;">
        <a href="${url}"
           style="display: inline-block; background-color: ${color}; color: white;
                  padding: 12px 28px; text-decoration: none; border-radius: 6px;
                  font-weight: bold; font-family: Arial, sans-serif; font-size: 14px;">
            ${text}
        </a>
    </p>`;
}

// ─── Backend state update helper──────────────────────────────────────────────

async function updateBackendStatus(cr: CashRequest, patch: Record<string, unknown>): Promise<void> {
    try {
        await axios.put(
            `${backendUrl()}/api/cash-requests/${cr._id}/internal-status`,
            patch,
            {
                headers: {
                    'x-internal-token': process.env.INTERNAL_API_TOKEN ?? 'temporal-internal',
                    'x-tenant-id': cr.tenantId,
                },
                timeout: 10_000,
            }
        );
        log.info('✅ Estado actualizado en backend', { id: cr._id, patch });
    } catch (err: any) {
        log.warn('⚠️ No se pudo actualizar estado en backend (no crítico)', { err: err?.message });
    }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ACTIVITIES
// ═══════════════════════════════════════════════════════════════════════════════

/** Llamada al crear la CR — notifica al empleado y al supervisor */
export async function notificarCreacion(cr: CashRequest): Promise<void> {
    log.info('📧 notificarCreacion', { id: cr._id });

    // To employee
    await sendEmail(
        cr.employeeEmail,
        `Cash Request Submitted — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #1e1b4b;">Your Cash Request was Submitted</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your cash request has been submitted and is pending supervisor approval.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '', 'View Cash Request', '#6366f1')}
        `)
    );

    // To supervisor
    await sendEmail(
        cr.supervisorEmail,
        `Action Required: Approve Cash Request — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #1e1b4b;">New Cash Request Awaiting Your Approval</h3>
            <p>Hello ${cr.supervisorName},</p>
            <p>${cr.employeeName} has submitted a cash advance request for your project. Please review and approve.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '/review', 'Approve Cash Request', '#10b981')}
        `)
    );
}

/** Supervisor aprobó → notifica empleado + superadmin para autorizar */
export async function notificarAprobacion(cr: CashRequest, payload: AprobarCRPayload): Promise<void> {
    log.info('📧 notificarAprobacion', { id: cr._id });
    await updateBackendStatus(cr, { status: 'approved', approved_by_name: payload.userName, approval_notes: payload.notes });

    await sendEmail(
        cr.employeeEmail,
        `Cash Request Approved — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #10b981;">Your Cash Request was Approved ✓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your supervisor <strong>${payload.userName}</strong> has approved your cash request. It is now pending authorization by the administrator.</p>
            ${emailTable(cr, payload.notes ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #374151;">Notes:</td><td style="padding: 8px 12px;">${payload.notes}</td></tr>` : '')}
            ${emailButton(cr, '', 'View Cash Request', '#6366f1')}
        `)
    );

    await sendEmail(
        cr.superAdminEmail,
        `Action Required: Authorize Cash Request — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #1e1b4b;">Cash Request Needs Authorization</h3>
            <p>Hello ${cr.superAdminName},</p>
            <p>A cash request for <strong>${cr.employeeName}</strong> has been approved by the supervisor and requires your authorization. Please define the approved amount and the expense period.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '/authorize', 'Authorize Cash Request', '#8b5cf6')}
        `)
    );
}

/** SuperAdmin autorizó → notifica empleado + superadmin (como tesorero) para pagar */
export async function notificarAutorizacion(cr: CashRequest, payload: AutorizarCRPayload): Promise<void> {
    log.info('📧 notificarAutorizacion', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'authorized',
        authorized_by_name: payload.userName,
        authorized_amount: payload.authorizedAmount,
        expense_period_days: payload.expensePeriodDays,
        authorization_notes: payload.notes,
    });

    await sendEmail(
        cr.employeeEmail,
        `Cash Request Authorized — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #8b5cf6;">Your Cash Request was Authorized ✓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your cash advance has been authorized. You will receive the funds shortly.</p>
            ${emailTable(cr, `
                <tr style="border-bottom: 1px solid #e5e7eb; background: #f0fdf4;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">✅ Authorized Amount:</td>
                    <td style="padding: 8px 12px; font-weight: bold; color: #10b981;">${payload.authorizedAmount.toLocaleString()} ${cr.currency}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">📅 Expense Period:</td>
                    <td style="padding: 8px 12px; color: #111827;">${payload.expensePeriodDays} days to submit expenses</td>
                </tr>
                ${payload.notes ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #374151;">Notes:</td><td style="padding: 8px 12px;">${payload.notes}</td></tr>` : ''}
            `)}
            ${emailButton(cr, '', 'View Cash Request', '#6366f1')}
        `)
    );

    await sendEmail(
        cr.superAdminEmail,
        `Action Required: Disburse Cash — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #1e1b4b;">Cash Request Ready for Disbursement</h3>
            <p>Hello ${cr.superAdminName},</p>
            <p>You authorized the cash request for <strong>${cr.employeeName}</strong>. As treasurer, please proceed with the disbursement of <strong>${payload.authorizedAmount.toLocaleString()} ${cr.currency}</strong>.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '/pay', 'Disburse Cash', '#14b8a6')}
        `)
    );
}

/** Tesorero (SuperAdmin) pagó → notifica empleado, inicia período de gastos */
export async function notificarPago(cr: CashRequest, payload: PagarCRPayload): Promise<void> {
    log.info('📧 notificarPago', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'paid',
        paid_by_name: payload.userName,
        payment_proof: payload.paymentProof,
        payment_notes: payload.notes,
        expense_period_started_at: new Date().toISOString(),
    });

    await sendEmail(
        cr.employeeEmail,
        `💰 Cash Disbursed — Your Expense Period Has Started — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #14b8a6;">Cash Disbursed — Expense Period Active ✓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>The cash advance has been disbursed. Your expense reporting period is now active.</p>
            <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <p style="margin: 0; font-weight: bold; color: #15803d;">📋 What you need to do:</p>
                <ul style="color: #15803d; margin: 8px 0 0; padding-left: 20px;">
                    <li>Upload all receipts and invoices to your Expense Report</li>
                    <li>Submit the report before the period expires</li>
                    <li>Keep original documents for audit purposes</li>
                </ul>
            </div>
            ${emailTable(cr)}
            ${emailButton(cr, '/expense', 'Open Expense Report', '#14b8a6')}
        `)
    );

    await sendEmail(
        cr.superAdminEmail,
        `Cash Disbursed Confirmation — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #14b8a6;">Cash Disbursement Confirmed</h3>
            <p>Hello ${cr.superAdminName},</p>
            <p>The cash advance for <strong>${cr.employeeName}</strong> has been marked as disbursed. The expense period has started.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '', 'View Cash Request', '#6366f1')}
        `)
    );
}

/** Empleado hizo submit del expense report */
export async function notificarExpenseSubmit(cr: CashRequest, payload: SubmitExpensePayload): Promise<void> {
    log.info('📧 notificarExpenseSubmit', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'submitted',
        total_spent: payload.totalSpent,
        expense_files: payload.files,
        submitted_at: new Date().toISOString(),
    });

    await sendEmail(
        cr.employeeEmail,
        `Expense Report Submitted — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #6366f1;">Expense Report Submitted ✓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your expense report has been submitted and locked for review. You uploaded <strong>${payload.files.length}</strong> document(s) for a total of <strong>${payload.totalSpent.toLocaleString()} ${cr.currency}</strong>.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '/expense', 'View Expense Report', '#6366f1')}
        `)
    );

    await sendEmail(
        cr.superAdminEmail,
        `Action Required: Review Expense Report — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #1e1b4b;">Expense Report Ready for Review</h3>
            <p>Hello ${cr.superAdminName},</p>
            <p><strong>${cr.employeeName}</strong> has submitted their expense report for the cash advance of <strong>${cr.requestedAmount.toLocaleString()} ${cr.currency}</strong>.</p>
            ${emailTable(cr, `
                <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Total Spent:</td>
                    <td style="padding: 8px 12px; font-weight: bold;">${payload.totalSpent.toLocaleString()} ${cr.currency}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Documents:</td>
                    <td style="padding: 8px 12px;">${payload.files.length} file(s)</td>
                </tr>
            `)}
            ${emailButton(cr, '/review-expense', 'Review Expense Report', '#f59e0b')}
        `)
    );
}

/** Admin revisó — balance = 0, cierre directo */
export async function notificarCierreDirecto(cr: CashRequest, payload: ReviewExpensePayload): Promise<void> {
    log.info('📧 notificarCierreDirecto', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'closed',
        reviewed_by_name: payload.userName,
        balance: payload.balance,
        closure_notes: payload.notes,
        closed_at: new Date().toISOString(),
    });

    await sendEmail(
        cr.employeeEmail,
        `✅ Cash Request Closed — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #10b981;">Cash Request Fully Closed ✓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your cash request has been reviewed and closed. The amounts match perfectly — no further action required.</p>
            ${emailTable(cr, `
                <tr style="border-bottom: 1px solid #e5e7eb; background: #f0fdf4;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Balance:</td>
                    <td style="padding: 8px 12px; font-weight: bold; color: #10b981;">0.00 ${cr.currency} — Exact match ✓</td>
                </tr>
            `)}
            ${emailButton(cr, '', 'View Summary', '#6366f1')}
        `)
    );

    await sendEmail(cr.superAdminEmail, `Cash Request Closed — ${cr.projectName}`, wrap(`
        <h3 style="color: #10b981;">Cash Request Closed</h3>
        <p>The cash request for <strong>${cr.employeeName}</strong> has been closed with a zero balance.</p>
        ${emailTable(cr)}
    `));
}

/** Admin detectó que gastado > autorizado → reembolso al empleado */
export async function notificarReembolso(cr: CashRequest, payload: ReviewExpensePayload): Promise<void> {
    log.info('📧 notificarReembolso', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'reimbursement',
        reviewed_by_name: payload.userName,
        balance: payload.balance,
        review_notes: payload.notes,
    });

    const diff = Math.abs(payload.balance).toLocaleString();

    await sendEmail(
        cr.employeeEmail,
        `💳 Reimbursement Pending — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #f97316;">Reimbursement Required ↑</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>After reviewing your expense report, the company owes you an additional <strong>${diff} ${cr.currency}</strong> because you spent more than the authorized amount.</p>
            ${emailTable(cr, `
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fff7ed;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Authorized:</td>
                    <td style="padding: 8px 12px;">${payload.authorizedAmount.toLocaleString()} ${cr.currency}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fff7ed;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Total Spent:</td>
                    <td style="padding: 8px 12px;">${payload.totalSpent.toLocaleString()} ${cr.currency}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fff7ed;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #f97316;">Company Owes You:</td>
                    <td style="padding: 8px 12px; font-weight: bold; color: #f97316;">+${diff} ${cr.currency}</td>
                </tr>
            `)}
            ${emailButton(cr, '', 'View Status', '#f97316')}
        `)
    );

    await sendEmail(
        cr.superAdminEmail,
        `Action Required: Process Reimbursement — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #f97316;">Reimbursement to Employee Required</h3>
            <p>Hello ${cr.superAdminName},</p>
            <p>${cr.employeeName} spent <strong>${diff} ${cr.currency} more</strong> than authorized. Please process the reimbursement and attach proof.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '/reimburse', 'Process Reimbursement', '#f97316')}
        `)
    );
}

/** Admin detectó que gastado < autorizado → empleado devuelve diferencia */
export async function notificarDevolucion(cr: CashRequest, payload: ReviewExpensePayload): Promise<void> {
    log.info('📧 notificarDevolucion', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'refund',
        reviewed_by_name: payload.userName,
        balance: payload.balance,
        review_notes: payload.notes,
    });

    const diff = Math.abs(payload.balance).toLocaleString();

    await sendEmail(
        cr.employeeEmail,
        `🔄 Refund Required — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #e11d48;">Refund to Company Required ↓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>After reviewing your expense report, you used less than the authorized amount. Please return <strong>${diff} ${cr.currency}</strong> to the company.</p>
            ${emailTable(cr, `
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fff1f2;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Authorized:</td>
                    <td style="padding: 8px 12px;">${payload.authorizedAmount.toLocaleString()} ${cr.currency}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fff1f2;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #374151;">Total Spent:</td>
                    <td style="padding: 8px 12px;">${payload.totalSpent.toLocaleString()} ${cr.currency}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fff1f2;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #e11d48;">Amount to Return:</td>
                    <td style="padding: 8px 12px; font-weight: bold; color: #e11d48;">${diff} ${cr.currency}</td>
                </tr>
            `)}
            ${emailButton(cr, '/refund', 'Submit Refund', '#e11d48')}
        `)
    );

    await sendEmail(
        cr.superAdminEmail,
        `Action Required: Collect Refund — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #e11d48;">Employee Must Return Funds</h3>
            <p>Hello ${cr.superAdminName},</p>
            <p>${cr.employeeName} spent <strong>${diff} ${cr.currency} less</strong> than authorized. Please collect the refund and validate.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '/validate-refund', 'Validate Refund', '#e11d48')}
        `)
    );
}

/** Cierre final (después de reembolso/devolución) */
export async function notificarCierreFinal(cr: CashRequest, payload: ClosePayload): Promise<void> {
    log.info('📧 notificarCierreFinal', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'closed',
        closed_by_name: payload.userName,
        closure_proof: payload.proof,
        closure_notes: payload.notes,
        closed_at: new Date().toISOString(),
    });

    await sendEmail(
        cr.employeeEmail,
        `✅ Cash Request Fully Closed — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #10b981;">Cash Request Closed ✓</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your cash request has been fully resolved and closed by the treasurer.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '', 'View Summary', '#6366f1')}
        `)
    );

    await sendEmail(cr.superAdminEmail, `Cash Request Closed — ${cr.projectName}`, wrap(`
        <h3 style="color: #10b981;">Cash Request Process Complete</h3>
        <p>The cash request for <strong>${cr.employeeName}</strong> has been closed.</p>
        ${emailTable(cr)}
    `));
}

/** Rechazo en cualquier etapa */
export async function notificarRechazo(cr: CashRequest, payload: RechazarCRPayload): Promise<void> {
    log.info('📧 notificarRechazo', { id: cr._id });
    await updateBackendStatus(cr, {
        status: 'rejected',
        rejected_by_name: payload.userName,
        rejection_reason: payload.reason,
    });

    await sendEmail(
        cr.employeeEmail,
        `❌ Cash Request Rejected — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #dc2626;">Cash Request Rejected</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your cash request has been rejected by <strong>${payload.userName}</strong>.</p>
            ${emailTable(cr, `
                <tr style="border-bottom: 1px solid #e5e7eb; background: #fef2f2;">
                    <td style="padding: 8px 12px; font-weight: bold; color: #dc2626;">Reason:</td>
                    <td style="padding: 8px 12px; color: #dc2626;">${payload.reason}</td>
                </tr>
            `)}
            ${emailButton(cr, '', 'View Details', '#6366f1')}
        `)
    );
}

/** Timeout en cualquier etapa */
export async function notificarTimeout(cr: CashRequest, etapa: string, diasEspera: number): Promise<void> {
    log.warn('⏰ notificarTimeout', { id: cr._id, etapa });
    await updateBackendStatus(cr, {
        status: 'rejected',
        rejection_reason: `Timeout: no response in ${diasEspera} days at stage "${etapa}"`,
    });

    await sendEmail(
        cr.employeeEmail,
        `⏰ Cash Request Expired — ${cr.projectName}`,
        wrap(`
            <h3 style="color: #dc2626;">Cash Request Timed Out</h3>
            <p>Hello ${cr.employeeName},</p>
            <p>Your cash request was automatically rejected because no action was taken within <strong>${diasEspera} days</strong> at the <strong>${etapa}</strong> stage.</p>
            ${emailTable(cr)}
            ${emailButton(cr, '', 'View Details', '#6366f1')}
        `)
    );
}
