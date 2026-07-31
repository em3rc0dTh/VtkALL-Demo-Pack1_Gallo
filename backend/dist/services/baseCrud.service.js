"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseCrudService = void 0;
const pagination_1 = require("../utils/pagination");
class BaseCrudService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    async getList(filter, page, limit, sort) {
        const [data, total] = await Promise.all([
            this.repository.find(filter, page, limit, sort),
            this.repository.count(filter),
        ]);
        const meta = (0, pagination_1.buildPaginationMeta)(total, page, limit);
        return { data, meta };
    }
    async getById(id) {
        const data = await this.repository.findById(id);
        if (!data) {
            throw new Error('NOT_FOUND');
        }
        return data;
    }
    async create(data) {
        return this.repository.create(data);
    }
    async replace(id, data) {
        const updated = await this.repository.replace(id, data);
        if (!updated) {
            throw new Error('NOT_FOUND');
        }
        return updated;
    }
    async update(id, data) {
        const updated = await this.repository.update(id, data);
        if (!updated) {
            throw new Error('NOT_FOUND');
        }
        return updated;
    }
    async delete(id) {
        const deleted = await this.repository.delete(id);
        if (!deleted) {
            throw new Error('NOT_FOUND');
        }
        return deleted;
    }
}
exports.BaseCrudService = BaseCrudService;
