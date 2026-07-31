import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { Notification } from '../models/Notification.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(Notification);
const service = new BaseCrudService(repository);
export const notificationController = createCrudController(service);
