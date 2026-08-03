import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { CustomerInteraction } from '../models/CustomerInteraction.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(CustomerInteraction);
const service = new BaseCrudService(repository);
export const customerInteractionController = createCrudController(service);
