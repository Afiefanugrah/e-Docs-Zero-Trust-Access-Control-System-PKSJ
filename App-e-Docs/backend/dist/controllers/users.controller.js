"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const users_model_1 = __importDefault(require("../models/users.model"));
const roles_model_1 = __importDefault(require("../models/roles.model"));
const auditLogs_model_1 = __importDefault(require("../models/auditLogs.model"));
const bcrypt = __importStar(require("bcrypt"));
const response_utils_1 = require("../utils/response.utils");
const validators_utils_1 = require("../utils/validators.utils");
const ipHelper_utils_1 = require("../utils/ipHelper.utils");
const MAX_FAILED_ATTEMPTS = 3;
class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await users_model_1.default.findAll({
                include: [
                    {
                        model: roles_model_1.default,
                        as: "role",
                        attributes: ["name"],
                    },
                ],
                attributes: { exclude: ["password", "updatedAt"] },
            });
            const actingUser = req.user;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            await auditLogs_model_1.default.create({
                userId: actingUser.id,
                actionType: "READ_ALL_USERS",
                tableName: "Users",
                recordId: null,
                ipAddress: ipAddress,
                details: {
                    endpoint: "/api/users/all",
                    count: users.length,
                },
            });
            return (0, response_utils_1.sendSuccess)(res, users, "Berhasil mengambil data pengunjung", 200, {
                total: users.length,
            });
        }
        catch (error) {
            return (0, response_utils_1.sendError)(res, "Gagal Mengambil data pengguna", 500, error);
        }
    }
    async postRegisterUsers(req, res) {
        try {
            const { username, password, roleId, isActive } = req.body;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            if (!username || !password || !roleId) {
                return (0, response_utils_1.sendError)(res, "Mohon isi username, password, dan role,", 400);
            }
            const cekUsername = await users_model_1.default.findOne({ where: { username } });
            if (cekUsername) {
                await auditLogs_model_1.default.create({
                    userId: null,
                    actionType: "REGISTRATION_FAILED",
                    tableName: "Users",
                    recordId: null,
                    ipAddress: ipAddress,
                    details: {
                        reason: "Username sudah digunakan",
                        attemptedUsername: username,
                    },
                });
                return (0, response_utils_1.sendError)(res, "Username sudah digunakan. Silakan pilih yang lain.", 409);
            }
            const usernameCheck = (0, validators_utils_1.validateUsername)(username);
            if (!usernameCheck.isValid) {
                await auditLogs_model_1.default.create({
                    userId: null,
                    actionType: "REGISTRATION_FAILED",
                    tableName: "Users",
                    recordId: null,
                    ipAddress: ipAddress,
                    details: {
                        reason: usernameCheck.message || "Password lemah",
                        attemptedUsername: username,
                    },
                });
                return (0, response_utils_1.sendError)(res, usernameCheck.message, 400);
            }
            const passwordCheck = (0, validators_utils_1.validatePassword)(password);
            if (!passwordCheck.isValid) {
                const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
                await auditLogs_model_1.default.create({
                    userId: null,
                    actionType: "REGISTRATION_FAILED",
                    tableName: "Users",
                    recordId: null,
                    ipAddress: ipAddress,
                    details: {
                        reason: passwordCheck.message || "Password lemah",
                        attemptedUsername: username,
                    },
                });
                return (0, response_utils_1.sendError)(res, passwordCheck.message || "Password lemah", 400);
            }
            const passwordHash = await bcrypt.hash(password, 12);
            const newUser = await users_model_1.default.create({
                username,
                password: passwordHash,
                roleId,
                isActive,
            });
            await auditLogs_model_1.default.create({
                userId: newUser.id,
                actionType: "USER_CREATED",
                tableName: "Users",
                recordId: newUser.id,
                ipAddress: ipAddress,
                details: {
                    role: roleId,
                    registeredBy: req.user?.id || "SYSTEM/EXTERNAL",
                },
            });
            const responseData = {
                id: newUser.id,
                username: newUser.username,
                roleId: newUser.roleId,
                isActive: newUser.isActive,
                createdAt: newUser.createdAt,
            };
            return (0, response_utils_1.sendSuccess)(res, responseData, "Pengguna berhasil dibuat.", 201);
        }
        catch (error) {
            return (0, response_utils_1.sendError)(res, "Gagal membuat pengguna", 500, error);
        }
    }
    async toggleActiveStatus(req, res) {
        const actingUser = req.user;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        const targetId = parseInt(req.params.id, 10);
        const { isActive } = req.body;
        if (isNaN(targetId)) {
            return (0, response_utils_1.sendError)(res, "ID pengguna tidak valid.", 400);
        }
        // 1. Cek Pencegahan: Admin tidak boleh menonaktifkan dirinya sendiri
        if (actingUser.id === targetId) {
            await auditLogs_model_1.default.create({
                userId: actingUser.id,
                actionType: "USER_TOGGLE_FAILED",
                tableName: "Users",
                recordId: targetId,
                ipAddress: ipAddress,
                details: {
                    reason: "Mencoba menonaktifkan diri sendiri",
                    targetId: targetId,
                    statusAttempt: isActive,
                },
            });
            return (0, response_utils_1.sendError)(res, "Anda tidak dapat menonaktifkan akun Admin Anda sendiri.", 403);
        }
        try {
            const user = await users_model_1.default.findByPk(targetId);
            if (!user) {
                return (0, response_utils_1.sendError)(res, "Pengguna tidak ditemukan.", 404);
            }
            // 2. Lakukan Update Status
            const oldStatus = user.isActive;
            const newStatus = isActive;
            await user.update({ isActive: newStatus });
            const action = newStatus ? "USER_ACTIVATED" : "USER_DEACTIVATED";
            // 3. Catat Log Audit
            await auditLogs_model_1.default.create({
                userId: actingUser.id,
                actionType: action,
                tableName: "Users",
                recordId: user.id,
                ipAddress: ipAddress,
                details: {
                    targetUsername: user.username,
                    oldStatus: oldStatus,
                    newStatus: newStatus,
                },
            });
            return (0, response_utils_1.sendSuccess)(res, { id: user.id, isActive: newStatus }, `Status pengguna ${user.username} berhasil diubah menjadi ${newStatus ? "Aktif" : "Nonaktif"}.`, 200);
        }
        catch (error) {
            console.error("Error saat toggle active status:", error);
            return (0, response_utils_1.sendError)(res, "Gagal mengubah status pengguna.", 500, error);
        }
    }
    async deleteUsers(req, res) {
        try {
            const userId = parseInt(req.params.id, 10);
            const actingUser = req.user;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            if (isNaN(userId)) {
                return (0, response_utils_1.sendError)(res, "ID pengguna tidak valid.", 400);
            }
            const user = await users_model_1.default.findByPk(userId);
            if (!user) {
                await auditLogs_model_1.default.create({
                    userId: actingUser.id,
                    actionType: "DELETE_FAILED",
                    tableName: "Users",
                    recordId: userId,
                    ipAddress: ipAddress,
                    details: { reason: "Pengguna target tidak ditemukan" },
                });
                return (0, response_utils_1.sendError)(res, "Pengguna tidak ditemukan.", 404);
            }
            await user.destroy();
            await auditLogs_model_1.default.create({
                userId: actingUser.id,
                actionType: "USER_DELETED",
                tableName: "Users",
                recordId: userId,
                ipAddress: ipAddress,
                details: {
                    deletedUsername: user.username,
                    deletedRoleId: user.roleId,
                },
            });
            return (0, response_utils_1.sendSuccess)(res, null, "Pengguna berhasil dihapus.");
        }
        catch (error) {
            return (0, response_utils_1.sendError)(res, "Gagal membuat pengguna", 500, error);
        }
    }
}
exports.default = new UserController();
