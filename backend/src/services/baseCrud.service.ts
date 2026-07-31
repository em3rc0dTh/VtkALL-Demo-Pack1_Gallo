import { BaseRepository } from '../repositories/base.repository';
import { buildPaginationMeta } from '../utils/pagination';

export class BaseCrudService<T> {
  constructor(private readonly repository: BaseRepository<T>) {}

  async getList(filter: any, page: number, limit: number, sort: any) {
    const [data, total] = await Promise.all([
      this.repository.find(filter, page, limit, sort),
      this.repository.count(filter),
    ]);
    const meta = buildPaginationMeta(total, page, limit);
    return { data, meta };
  }

  async getById(id: string) {
    const data = await this.repository.findById(id);
    if (!data) {
      throw new Error('NOT_FOUND');
    }
    return data;
  }

  async create(data: any) {
    return this.repository.create(data);
  }

  async replace(id: string, data: any) {
    const updated = await this.repository.replace(id, data);
    if (!updated) {
      throw new Error('NOT_FOUND');
    }
    return updated;
  }

  async update(id: string, data: any) {
    const updated = await this.repository.update(id, data);
    if (!updated) {
      throw new Error('NOT_FOUND');
    }
    return updated;
  }

  async delete(id: string) {
    const deleted = await this.repository.delete(id);
    if (!deleted) {
      throw new Error('NOT_FOUND');
    }
    return deleted;
  }
}
