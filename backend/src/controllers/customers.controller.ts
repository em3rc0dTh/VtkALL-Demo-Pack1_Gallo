import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { Customer } from '../models/Customer.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(Customer);
const service = new BaseCrudService(repository);
export const customerController = createCrudController(service);
