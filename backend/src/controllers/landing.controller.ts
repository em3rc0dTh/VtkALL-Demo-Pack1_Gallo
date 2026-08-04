import { Request, Response } from 'express';
import { sendErrorResponse, sendSingleResponse } from '../utils/response';
import {
  getAdminLandingPage,
  getPublicLandingPage,
  publishLandingPage,
  restoreLandingPageVersion,
  updateDraftLandingPage,
} from '../services/landing/landing.service';
import { uploadLandingAsset } from '../services/landing/landingAssetUpload.service';

const routeParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value || '';

export const readPublicLandingPage = async (req: Request, res: Response) => {
  const businessSlug = routeParam(req.params.businessSlug);
  const pageSlug = routeParam(req.params.pageSlug);
  const payload = await getPublicLandingPage(businessSlug, pageSlug);
  if (!payload) {
    return sendErrorResponse(res, 'LANDING_PAGE_NOT_FOUND', 'Published landing page not found.', req.params, 404);
  }
  return sendSingleResponse(res, payload);
};

export const readAdminLandingPage = async (req: Request, res: Response) => {
  const businessSlug = routeParam(req.params.businessSlug);
  const pageSlug = routeParam(req.params.pageSlug);
  const payload = await getAdminLandingPage(businessSlug, pageSlug);
  if (!payload) {
    return sendErrorResponse(res, 'LANDING_PAGE_NOT_FOUND', 'Landing page not found.', req.params, 404);
  }
  return sendSingleResponse(res, payload);
};

export const updateAdminLandingDraft = async (req: Request, res: Response) => {
  const page = await updateDraftLandingPage({
    businessSlug: routeParam(req.params.businessSlug),
    pageSlug: routeParam(req.params.pageSlug),
    patch: req.body,
  });
  if (!page) {
    return sendErrorResponse(res, 'LANDING_PAGE_NOT_FOUND', 'Landing page not found.', req.params, 404);
  }
  return sendSingleResponse(res, page);
};

export const publishAdminLandingPage = async (req: Request, res: Response) => {
  const page = await publishLandingPage({
    businessSlug: routeParam(req.params.businessSlug),
    pageSlug: routeParam(req.params.pageSlug),
    actor: req.header('X-Actor-Id') || 'admin',
  });
  if (!page) {
    return sendErrorResponse(res, 'LANDING_PAGE_NOT_FOUND', 'Landing page not found.', req.params, 404);
  }
  return sendSingleResponse(res, page);
};

export const restoreAdminLandingPage = async (req: Request, res: Response) => {
  const version = Number(req.params.version);
  if (!Number.isInteger(version) || version < 1) {
    return sendErrorResponse(res, 'LANDING_VERSION_INVALID', 'Landing version must be a positive integer.', req.params, 400);
  }

  const page = await restoreLandingPageVersion({
    businessSlug: routeParam(req.params.businessSlug),
    pageSlug: routeParam(req.params.pageSlug),
    version,
    actor: req.header('X-Actor-Id') || 'admin',
  });
  if (!page) {
    return sendErrorResponse(res, 'LANDING_VERSION_NOT_FOUND', 'Landing page version not found.', req.params, 404);
  }
  return sendSingleResponse(res, page);
};

export const uploadAdminLandingAsset = async (req: Request, res: Response) => {
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const asset = await uploadLandingAsset(String(req.headers['content-type'] || ''), Buffer.concat(chunks));
    return sendSingleResponse(res, asset);
  } catch (error: any) {
    return sendErrorResponse(res, error.code || 'LANDING_ASSET_UPLOAD_ERROR', error.message || 'No se pudo subir el archivo.', {}, error.status || 500);
  }
};
