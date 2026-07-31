import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { WorkTeamScheduleOverride } from '../models/WorkTeamScheduleOverride.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(WorkTeamScheduleOverride);
const service = new BaseCrudService(repository);
export const workTeamScheduleOverrideController = createCrudController(service);
