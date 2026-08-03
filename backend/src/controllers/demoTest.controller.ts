import { NextFunction, Request, Response } from 'express';
import {
  createManagedEntity,
  createOperationalCase,
  createOrReuseCustomer,
  contextResponse,
  getAvailability,
  listTimelineByCase,
  ScheduleConsultationInput,
  SemanticError,
  scheduleConsultation as scheduleConsultationService,
  withExecutionScope,
} from '../services/demoTest';

const handler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    void fn(req, res, next).catch(next);
  };

export const createCustomer = handler(async (req: Request, res: Response) => {
  const context = withExecutionScope(req.executionContext, { businessSlug: req.body?.businessSlug });
  const result = await createOrReuseCustomer(req.body, context);
  return res.status(201).json({
    ok: true,
    customer: result.customer,
    reused: result.reused,
    context: contextResponse(context),
  });
});

export const createManagedEntityHandler = handler(async (req: Request, res: Response) => {
  const context = withExecutionScope(req.executionContext, { businessSlug: req.body?.businessSlug });
  const managedEntity = await createManagedEntity(req.body, context);
  return res.status(201).json({ ok: true, data: managedEntity, context: contextResponse(context) });
});

export const createCase = handler(async (req: Request, res: Response) => {
  const context = withExecutionScope(req.executionContext, { businessSlug: req.body?.businessSlug });
  const operationalCase = await createOperationalCase(req.body, context);
  return res.status(201).json({ ok: true, data: operationalCase, context: contextResponse(context) });
});

export const getAvailabilityHandler = handler(async (req: Request, res: Response) => {
  const businessSlug = String(req.query.businessSlug || '');
  const context = withExecutionScope(req.executionContext, { businessSlug });
  const durationMinutes = Number(req.query.durationMinutes);
  const availability = await getAvailability({
    businessSlug,
    teamId: String(req.query.teamId || ''),
    date: String(req.query.date || ''),
    durationMinutes,
    timezone: String(req.query.timezone || ''),
    catalogOfferingId: req.query.catalogOfferingId ? String(req.query.catalogOfferingId) : undefined,
    caseId: req.query.caseId ? String(req.query.caseId) : undefined,
  }, context);

  return res.status(200).json({ ok: true, data: availability, context: contextResponse(context) });
});

export const scheduleConsultation = handler(async (req: Request, res: Response) => {
  const body = req.body as ScheduleConsultationInput;
  if (!req.executionContext?.idempotencyKey) {
    throw new SemanticError({
      code: 'IDEMPOTENCY_KEY_REQUIRED',
      message: 'An Idempotency-Key header is required for this operation.',
      details: { operation: 'scheduleConsultation' },
    });
  }
  const context = withExecutionScope(req.executionContext, {
    businessSlug: body?.businessSlug,
    caseId: body?.caseId,
    idempotencyKey: req.executionContext.idempotencyKey,
  });
  const result = await scheduleConsultationService(
    { ...body, idempotencyKey: context.idempotencyKey },
    context
  );
  return res.status(201).json({ ok: true, ...result, context: contextResponse(context) });
});

export const listCaseTimeline = handler(async (req: Request, res: Response) => {
  const businessSlug = String(req.query.businessSlug || '');
  const caseId = String(req.params.caseId || '');
  const context = withExecutionScope(req.executionContext, { businessSlug, caseId });
  const timeline = await listTimelineByCase({
    businessSlug,
    caseId,
  });

  return res.status(200).json({ ok: true, timeline, context: contextResponse(context) });
});
