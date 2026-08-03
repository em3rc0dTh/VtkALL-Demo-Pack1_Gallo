import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { ManagedEntity } from '../models/ManagedEntity.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(ManagedEntity);
const service = new BaseCrudService(repository);
export const managedEntityController = createCrudController(service);
