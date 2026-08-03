import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { BusinessProfile } from '../models/BusinessProfile.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(BusinessProfile);
const service = new BaseCrudService(repository);
export const businessProfileController = createCrudController(service);
