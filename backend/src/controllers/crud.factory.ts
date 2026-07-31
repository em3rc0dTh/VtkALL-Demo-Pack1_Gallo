import { Request, Response } from 'express';
import { BaseCrudService } from '../services/baseCrud.service';
import { parseQuery } from '../utils/queryParser';
import { sendListResponse, sendSingleResponse, sendErrorResponse } from '../utils/response';

export const createCrudController = <T>(service: BaseCrudService<T>) => {
  return {
    list: async (req: Request, res: Response) => {
      try {
        const { filterObj, pageNum, limitNum, sortObj } = parseQuery(req.query);
        const result = await service.getList(filterObj, pageNum, limitNum, sortObj);
        sendListResponse(res, result.data, result.meta);
      } catch (error) {
        sendErrorResponse(res, 'INTERNAL_ERROR', (error as Error).message, {}, 500);
      }
    },
    getById: async (req: Request, res: Response) => {
      try {
        const data = await service.getById(req.params.id as string);
        sendSingleResponse(res, data);
      } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
          return sendErrorResponse(res, 'NOT_FOUND', 'Resource not found', {}, 404);
        }
        sendErrorResponse(res, 'INTERNAL_ERROR', error.message, {}, 500);
      }
    },
    create: async (req: Request, res: Response) => {
      try {
        const data = await service.create(req.body);
        sendSingleResponse(res, data, 201);
      } catch (error: any) {
        sendErrorResponse(res, 'BAD_REQUEST', error.message, {}, 400);
      }
    },
    replace: async (req: Request, res: Response) => {
      try {
        const data = await service.replace(req.params.id as string, req.body);
        sendSingleResponse(res, data);
      } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
          return sendErrorResponse(res, 'NOT_FOUND', 'Resource not found', {}, 404);
        }
        sendErrorResponse(res, 'BAD_REQUEST', error.message, {}, 400);
      }
    },
    update: async (req: Request, res: Response) => {
      try {
        const data = await service.update(req.params.id as string, req.body);
        sendSingleResponse(res, data);
      } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
          return sendErrorResponse(res, 'NOT_FOUND', 'Resource not found', {}, 404);
        }
        sendErrorResponse(res, 'BAD_REQUEST', error.message, {}, 400);
      }
    },
    delete: async (req: Request, res: Response) => {
      try {
        await service.delete(req.params.id as string);
        res.status(204).send();
      } catch (error: any) {
        if (error.message === 'NOT_FOUND') {
          return sendErrorResponse(res, 'NOT_FOUND', 'Resource not found', {}, 404);
        }
        sendErrorResponse(res, 'INTERNAL_ERROR', error.message, {}, 500);
      }
    },
  };
};
