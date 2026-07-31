import { NextFunction, Request, Response } from 'express';
import { createSystemExecutionContext, logExecutionError, toApiErrorEnvelope } from '../services/demoTest/core';

export const demoTestErrorMiddleware = (err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const context = req.executionContext || createSystemExecutionContext({ channel: 'http' });
  const envelope = toApiErrorEnvelope(err, context);
  logExecutionError('demoTest request failed', err, context);

  if (res.headersSent) {
    return;
  }

  res.status(envelope.statusCode).json(envelope.body);
};
