import { Model } from 'mongoose';

export class BaseRepository<T> {
  constructor(private readonly model: Model<T>) {}

  async find(filter: any, page: number, limit: number, sort: any): Promise<T[]> {
    const skip = (page - 1) * limit;
    return this.model.find(filter).sort(sort).skip(skip).limit(limit).exec();
  }

  async count(filter: any): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findById(id).exec();
  }

  async create(data: any): Promise<T> {
    const entity = new this.model(data);
    return (await entity.save()) as unknown as T;
  }

  async replace(id: string, data: any): Promise<T | null> {
    return this.model.findOneAndReplace({ _id: id }, data, { new: true }).exec();
  }

  async update(id: string, data: any): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async delete(id: string): Promise<T | null> {
    return this.model.findByIdAndDelete(id).exec();
  }
}
