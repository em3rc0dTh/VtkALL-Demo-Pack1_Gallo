"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPaginationMeta = void 0;
const buildPaginationMeta = (total, page, limit) => {
    return {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
    };
};
exports.buildPaginationMeta = buildPaginationMeta;
