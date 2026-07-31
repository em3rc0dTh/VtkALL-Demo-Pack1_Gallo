import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { Case } from '../models/Case.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(Case);
const service = new BaseCrudService(repository);
export const caseController = createCrudController(service);
