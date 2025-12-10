"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const auditLogs_model_1 = __importDefault(require("../models/auditLogs.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const response_utils_1 = require("../utils/response.utils");
const ipHelper_utils_1 = require("../utils/ipHelper.utils");
class AuditController {
    async getAllAuditLogs(req, res) {
        try {
            const auditLogs = await auditLogs_model_1.default.findAll({
                include: [
                    {
                        model: users_model_1.default,
                        as: "user",
                        attributes: ["id", "username", "roleId"],
                    },
                ],
                attributes: { exclude: ["updatedAt"] },
                order: [["createdAt", "DESC"]],
                limit: 100,
            });
            const actingUser = req.user;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            await auditLogs_model_1.default.create({
                userId: actingUser.id,
                actionType: "VIEW_AUDIT_LOGS",
                tableName: "AuditLogs",
                recordId: null,
                ipAddress: ipAddress,
                details: {
                    endpoint: "/api/audit/all",
                    recordsViewed: auditLogs.length,
                },
            });
            return (0, response_utils_1.sendSuccess)(res, auditLogs, "Daftar log audit berhasil diambil.", 200, { total: auditLogs.length });
        }
        catch (error) {
            console.error("Error saat mengambil log audit:", error);
            return (0, response_utils_1.sendError)(res, "Gagal mengambil log audit.", 500, error);
        }
    }
}
exports.default = new AuditController();
