"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCrudController = void 0;
const queryParser_1 = require("../utils/queryParser");
const response_1 = require("../utils/response");
const createCrudController = (service) => {
    return {
        list: async (req, res) => {
            try {
                const { filterObj, pageNum, limitNum, sortObj } = (0, queryParser_1.parseQuery)(req.query);
                const result = await service.getList(filterObj, pageNum, limitNum, sortObj);
                (0, response_1.sendListResponse)(res, result.data, result.meta);
            }
            catch (error) {
                (0, response_1.sendErrorResponse)(res, 'INTERNAL_ERROR', error.message, {}, 500);
            }
        },
        getById: async (req, res) => {
            try {
                const data = await service.getById(req.params.id);
                (0, response_1.sendSingleResponse)(res, data);
            }
            catch (error) {
                if (error.message === 'NOT_FOUND') {
                    return (0, response_1.sendErrorResponse)(res, 'NOT_FOUND', 'Resource not found', {}, 404);
                }
                (0, response_1.sendErrorResponse)(res, 'INTERNAL_ERROR', error.message, {}, 500);
            }
        },
        create: async (req, res) => {
            try {
                const data = await service.create(req.body);
                (0, response_1.sendSingleResponse)(res, data, 201);
            }
            catch (error) {
                (0, response_1.sendErrorResponse)(res, 'BAD_REQUEST', error.message, {}, 400);
            }
        },
        replace: async (req, res) => {
            try {
                const data = await service.replace(req.params.id, req.body);
                (0, response_1.sendSingleResponse)(res, data);
            }
            catch (error) {
                if (error.message === 'NOT_FOUND') {
                    return (0, response_1.sendErrorResponse)(res, 'NOT_FOUND', 'Resource not found', {}, 404);
                }
                (0, response_1.sendErrorResponse)(res, 'BAD_REQUEST', error.message, {}, 400);
            }
        },
        update: async (req, res) => {
            try {
                const data = await service.update(req.params.id, req.body);
                (0, response_1.sendSingleResponse)(res, data);
            }
            catch (error) {
                if (error.message === 'NOT_FOUND') {
                    return (0, response_1.sendErrorResponse)(res, 'NOT_FOUND', 'Resource not found', {}, 404);
                }
                (0, response_1.sendErrorResponse)(res, 'BAD_REQUEST', error.message, {}, 400);
            }
        },
        delete: async (req, res) => {
            try {
                await service.delete(req.params.id);
                res.status(204).send();
            }
            catch (error) {
                if (error.message === 'NOT_FOUND') {
                    return (0, response_1.sendErrorResponse)(res, 'NOT_FOUND', 'Resource not found', {}, 404);
                }
                (0, response_1.sendErrorResponse)(res, 'INTERNAL_ERROR', error.message, {}, 500);
            }
        },
    };
};
exports.createCrudController = createCrudController;
