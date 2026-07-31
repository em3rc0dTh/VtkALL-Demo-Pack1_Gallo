import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { Attachment } from '../models/Attachment.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(Attachment);
const service = new BaseCrudService(repository);
export const attachmentController = createCrudController(service);
