import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { WorkTeam } from '../models/WorkTeam.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(WorkTeam);
const service = new BaseCrudService(repository);
export const workTeamController = createCrudController(service);
