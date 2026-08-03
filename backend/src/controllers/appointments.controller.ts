import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { Appointment } from '../models/Appointment.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(Appointment);
const service = new BaseCrudService(repository);
export const appointmentController = createCrudController(service);
