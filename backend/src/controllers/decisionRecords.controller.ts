import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { DecisionRecord } from '../models/DecisionRecord.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(DecisionRecord);
const service = new BaseCrudService(repository);
export const decisionRecordController = createCrudController(service);
