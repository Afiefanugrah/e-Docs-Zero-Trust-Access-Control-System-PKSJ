"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIpAddress = getIpAddress;
function getIpAddress(req) {
    const xForwardedFor = req.headers["x-forwarded-for"];
    if (xForwardedFor) {
        return xForwardedFor.split(",").shift()?.trim() || "";
    }
    return req.socket.remoteAddress || "";
}
