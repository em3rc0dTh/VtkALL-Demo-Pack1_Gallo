import { Request, Response } from 'express';
import { ZodError } from 'zod';
import {
  businessProfileSettingsValidationErrorCode,
  getBusinessProfileSettings,
  patchBusinessProfileSettings,
  uploadBusinessLogo,
} from '../services/businessProfileSettings.service';

const sendError = (res: Response, error: any) => {
  if (error instanceof ZodError) {
    const fields = error.issues.reduce<Record<string, string>>((acc, issue) => {
      const key = (issue.path.join('.') || 'payload')
        .replace(/^changes\./, '')
        .replace(/^branding\./, 'brand.');
      acc[key] = issue.message;
      return acc;
    }, {});

    return res.status(422).json({
      error: {
        code: businessProfileSettingsValidationErrorCode,
        message: 'BusinessProfile settings payload is invalid.',
        details: { fields, issues: error.issues },
      },
    });
  }
  return res.status(error.status || 500).json({
    error: {
      code: error.code || 'BUSINESS_PROFILE_SETTINGS_ERROR',
      message: error.message || 'BusinessProfile settings error.',
    },
  });
};

export const getBusinessProfileSettingsController = async (req: Request, res: Response) => {
  try {
    const businessSlug = String(req.params.businessSlug);
    const settings = await getBusinessProfileSettings(businessSlug);
    return res.json({ data: settings });
  } catch (error) {
    return sendError(res, error);
  }
};

export const patchBusinessProfileSettingsController = async (req: Request, res: Response) => {
  try {
    const businessSlug = String(req.params.businessSlug);
    const settings = await patchBusinessProfileSettings(businessSlug, req.body, 'admin');
    return res.json({ data: settings });
  } catch (error) {
    return sendError(res, error);
  }
};

export const uploadBusinessProfileLogoController = async (req: Request, res: Response) => {
  try {
    const businessSlug = String(req.params.businessSlug);
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const result = await uploadBusinessLogo(businessSlug, String(req.headers['content-type'] || ''), Buffer.concat(chunks));
    return res.json({ data: result });
  } catch (error) {
    return sendError(res, error);
  }
};
