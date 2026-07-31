import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { ResourceReservation } from '../models/ResourceReservation.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(ResourceReservation);
const service = new BaseCrudService(repository);
export const resourceReservationController = createCrudController(service);
