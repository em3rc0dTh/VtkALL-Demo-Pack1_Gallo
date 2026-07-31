import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { WorkTeamScheduleRule } from '../models/WorkTeamScheduleRule.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(WorkTeamScheduleRule);
const service = new BaseCrudService(repository);
export const workTeamScheduleRuleController = createCrudController(service);
