"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data = null, message = "Success", statusCode = 200, metadata = null) => {
    const response = {
        success: true,
        message,
    };
    if (data !== null)
        response.data = data;
    if (metadata !== null)
        response.metadata = metadata;
    return res.status(statusCode).json(response);
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = "Internal Server Error", statusCode = 500, errorRaw // Opsional: untuk debugging error asli (console log)
) => {
    if (errorRaw) {
        console.error(`[ERROR]: ${message}`, errorRaw);
    }
    return res.status(statusCode).json({
        success: false,
        message,
    });
};
exports.sendError = sendError;
