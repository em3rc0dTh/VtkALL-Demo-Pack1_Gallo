"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendErrorResponse = exports.sendSingleResponse = exports.sendListResponse = void 0;
const sendListResponse = (res, data, meta) => {
    res.status(200).json({ data, meta });
};
exports.sendListResponse = sendListResponse;
const sendSingleResponse = (res, data, statusCode = 200) => {
    res.status(statusCode).json({ data });
};
exports.sendSingleResponse = sendSingleResponse;
const sendErrorResponse = (res, code, message, details = {}, statusCode = 400) => {
    res.status(statusCode).json({
        error: {
            code,
            message,
            details,
        },
    });
};
exports.sendErrorResponse = sendErrorResponse;
