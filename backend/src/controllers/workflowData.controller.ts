import { Request, Response } from 'express';
import {
  buildCustomerContextPreview,
  getRequiredFields,
  listAvailability,
  listCatalog,
  reserveAppointment,
} from '../services/workflowData.service';
import { sendErrorResponse, sendListResponse, sendSingleResponse } from '../utils/response';

const DEFAULT_BUSINESS_SLUG = 'demo_test';

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const businessSlug = String(req.query.businessSlug || DEFAULT_BUSINESS_SLUG);
    const catalog = await listCatalog(businessSlug);
    sendListResponse(res, catalog, { total: catalog.length, page: 1, limit: catalog.length || 20, totalPages: 1 });
  } catch (error: any) {
    sendErrorResponse(res, 'INTERNAL_ERROR', error.message, {}, 500);
  }
};

export const getCatalogRequiredFields = async (req: Request, res: Response) => {
  try {
    const businessSlug = String(req.query.businessSlug || DEFAULT_BUSINESS_SLUG);
    const result = await getRequiredFields(businessSlug, String(req.params.id));
    sendSingleResponse(res, result);
  } catch (error: any) {
    const status = error.message === 'CATALOG_OFFERING_NOT_FOUND' ? 404 : 500;
    sendErrorResponse(res, error.message, error.message, {}, status);
  }
};

export const getAvailability = async (req: Request, res: Response) => {
  try {
    const businessSlug = String(req.query.businessSlug || DEFAULT_BUSINESS_SLUG);
    const catalogOfferingId = String(req.query.catalogOfferingId || '');
    const preferredDate = req.query.preferredDate ? String(req.query.preferredDate) : undefined;
    if (!catalogOfferingId) {
      return sendErrorResponse(res, 'BAD_REQUEST', 'catalogOfferingId is required', {}, 400);
    }
    const slots = await listAvailability(businessSlug, catalogOfferingId, preferredDate);
    sendListResponse(res, slots, { total: slots.length, page: 1, limit: slots.length || 20, totalPages: 1 });
  } catch (error: any) {
    sendErrorResponse(res, 'INTERNAL_ERROR', error.message, {}, 500);
  }
};

export const postCustomerContext = async (req: Request, res: Response) => {
  try {
    const result = await buildCustomerContextPreview(req.body.businessSlug || DEFAULT_BUSINESS_SLUG, req.body.customerData || req.body);
    sendSingleResponse(res, result);
  } catch (error: any) {
    sendErrorResponse(res, 'BAD_REQUEST', error.message, {}, 400);
  }
};

export const postReserveAppointment = async (req: Request, res: Response) => {
  try {
    const result = await reserveAppointment(req.body);
    sendSingleResponse(res, result, 201);
  } catch (error: any) {
    const status = ['SLOT_UNAVAILABLE', 'RESOURCE_UNAVAILABLE', 'CATALOG_OFFERING_NOT_FOUND'].includes(error.message) ? 409 : 400;
    sendErrorResponse(res, error.message, error.message, (error as any).details || {}, status);
  }
};
