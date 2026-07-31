"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseQuery = void 0;
const parseQuery = (query) => {
    const { page, limit, sort, ...filters } = query;
    const filterObj = {};
    for (const key of Object.keys(filters)) {
        if (filters[key] !== undefined && filters[key] !== '') {
            if (filters[key] === 'true') {
                filterObj[key] = true;
            }
            else if (filters[key] === 'false') {
                filterObj[key] = false;
            }
            else {
                filterObj[key] = filters[key];
            }
        }
    }
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    let sortObj = {};
    if (sort) {
        const sortParts = sort.split(',');
        sortParts.forEach((part) => {
            const isDesc = part.startsWith('-');
            const field = isDesc ? part.substring(1) : part;
            sortObj[field] = isDesc ? -1 : 1;
        });
    }
    else {
        sortObj = { createdAt: -1 };
    }
    return { filterObj, pageNum, limitNum, sortObj };
};
exports.parseQuery = parseQuery;
