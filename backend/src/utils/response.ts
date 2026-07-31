import { Response } from 'express';

export const sendListResponse = (res: Response, data: any[], meta: any) => {
  res.status(200).json({ data, meta });
};

export const sendSingleResponse = (res: Response, data: any, statusCode: number = 200) => {
  res.status(statusCode).json({ data });
};

export const sendErrorResponse = (res: Response, code: string, message: string, details: any = {}, statusCode: number = 400) => {
  res.status(statusCode).json({
    error: {
      code,
      message,
      details,
    },
  });
};
