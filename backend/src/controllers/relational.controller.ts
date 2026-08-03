import { Request, Response } from 'express';
import { Case } from '../models/Case.model';
import { ManagedEntity } from '../models/ManagedEntity.model';
import { TimelineEvent } from '../models/TimelineEvent.model';
import { CustomerInteraction } from '../models/CustomerInteraction.model';
import { Appointment } from '../models/Appointment.model';
import { Notification } from '../models/Notification.model';
import { DecisionRecord } from '../models/DecisionRecord.model';
import { parseQuery } from '../utils/queryParser';
import { sendListResponse, sendErrorResponse } from '../utils/response';

const getRelationalData = async (req: Request, res: Response, model: any, filterKey: string) => {
  try {
    const { filterObj, pageNum, limitNum, sortObj } = parseQuery(req.query);
    const filter = { ...filterObj, [filterKey]: req.params.id };
    const skip = (pageNum - 1) * limitNum;
    
    const [data, total] = await Promise.all([
      model.find(filter).sort(sortObj).skip(skip).limit(limitNum).exec(),
      model.countDocuments(filter).exec()
    ]);
    
    sendListResponse(res, data, { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) });
  } catch (error: any) {
    sendErrorResponse(res, 'INTERNAL_ERROR', error.message, {}, 500);
  }
};

export const getCustomerCases = (req: Request, res: Response) => getRelationalData(req, res, Case, 'customerId');
export const getCustomerManagedEntities = (req: Request, res: Response) => getRelationalData(req, res, ManagedEntity, 'customerId');
export const getCaseTimeline = (req: Request, res: Response) => getRelationalData(req, res, TimelineEvent, 'caseId');
export const getCaseInteractions = (req: Request, res: Response) => getRelationalData(req, res, CustomerInteraction, 'caseId');
export const getCaseAppointments = (req: Request, res: Response) => getRelationalData(req, res, Appointment, 'caseId');
export const getCaseNotifications = (req: Request, res: Response) => getRelationalData(req, res, Notification, 'caseId');
export const getCaseDecisions = (req: Request, res: Response) => getRelationalData(req, res, DecisionRecord, 'caseId');
export const getManagedEntityCases = (req: Request, res: Response) => getRelationalData(req, res, Case, 'managedEntityId');
