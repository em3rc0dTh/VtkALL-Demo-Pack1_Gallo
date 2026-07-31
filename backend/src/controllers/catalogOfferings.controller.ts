import { BaseCrudService } from '../services/baseCrud.service';
import { BaseRepository } from '../repositories/base.repository';
import { CatalogOffering } from '../models/CatalogOffering.model';
import { createCrudController } from './crud.factory';

const repository = new BaseRepository(CatalogOffering);
const service = new BaseCrudService(repository);
export const catalogOfferingController = createCrudController(service);
