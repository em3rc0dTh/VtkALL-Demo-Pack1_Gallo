import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { AvailabilitySlot } from '../models/AvailabilitySlot.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(AvailabilitySlot);
const service = new BaseCrudService(repository);
export const availabilitySlotController = createCrudController(service);
