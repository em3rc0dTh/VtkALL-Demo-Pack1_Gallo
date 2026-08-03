import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { TimelineEvent } from '../models/TimelineEvent.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(TimelineEvent);
const service = new BaseCrudService(repository);
export const timelineEventController = createCrudController(service);
