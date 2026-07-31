import { NextFunction, Request, Response } from 'express';
import {
  createExecutionId,
  createSystemExecutionContext,
  ExecutionContext,
  normalizeIdempotencyKey,
} from '../services/demoTest/core';

declare global {
  namespace Express {
    interface Request {
      executionContext?: ExecutionContext;
    }
  }
}

const headerValue = (req: Request, name: string) => req.header(name)?.trim();

export const executionContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const correlationId = headerValue(req, 'X-Correlation-Id') || createExecutionId('corr');
    const causationId = headerValue(req, 'X-Causation-Id') || createExecutionId('cause');
    const idempotencyKey = normalizeIdempotencyKey(headerValue(req, 'Idempotency-Key'));

    const context = createSystemExecutionContext({
      correlationId,
      causationId,
      idempotencyKey,
      channel: 'http',
      actor: {
        type: 'anonymous',
        id: headerValue(req, 'X-Actor-Id'),
        name: headerValue(req, 'X-Actor-Name'),
      },
      metadata: {
        method: req.method,
        path: req.path,
        userAgent: headerValue(req, 'User-Agent'),
      },
    });

    req.executionContext = context;
    res.setHeader('X-Correlation-Id', context.correlationId);
    res.setHeader('X-Causation-Id', context.causationId);
    if (context.idempotencyKey) {
      res.setHeader('Idempotency-Key', context.idempotencyKey);
    }

    next();
  } catch (error) {
    next(error);
  }
};
