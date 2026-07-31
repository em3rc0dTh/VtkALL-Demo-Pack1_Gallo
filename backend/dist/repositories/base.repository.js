"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async find(filter, page, limit, sort) {
        const skip = (page - 1) * limit;
        return this.model.find(filter).sort(sort).skip(skip).limit(limit).exec();
    }
    async count(filter) {
        return this.model.countDocuments(filter).exec();
    }
    async findById(id) {
        return this.model.findById(id).exec();
    }
    async create(data) {
        const entity = new this.model(data);
        return (await entity.save());
    }
    async replace(id, data) {
        return this.model.findOneAndReplace({ _id: id }, data, { new: true }).exec();
    }
    async update(id, data) {
        return this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    }
    async delete(id) {
        return this.model.findByIdAndDelete(id).exec();
    }
}
exports.BaseRepository = BaseRepository;
