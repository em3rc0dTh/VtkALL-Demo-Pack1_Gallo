import { NextFunction, Request, Response } from 'express';

const adminWriteMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const referenceAdminWriteMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (!adminWriteMethods.has(req.method)) {
    return next();
  }

  const expectedToken = process.env.DEMO_TEST_ADMIN_WRITE_TOKEN;
  const providedToken = req.header('X-Demo-Test-Admin-Token');

  if (!expectedToken || providedToken !== expectedToken) {
    return res.status(403).json({
      error: {
        code: 'REFERENCE_WRITE_ADMIN_REQUIRED',
        message: 'Reference-data writes require an authorized administrative context.',
        details: {
          resource: req.baseUrl,
          method: req.method,
        },
      },
    });
  }

  return next();
};
