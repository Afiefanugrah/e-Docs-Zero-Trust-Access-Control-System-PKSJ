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
const jwt_utils_1 = require("../utils/jwt.utils");
const ipHelper_utils_1 = require("../utils/ipHelper.utils");
const MAX_FAILED_ATTEMPTS = 3;
class AuthController {
    // public async postLogin(req: Request, res: Response): Promise<Response> {
    //   try {
    //     const { username, password } = req.body as LoginBody;
    //     const ipAddress = getIpAddress(req);
    //     const user = await Users.findOne({ where: { username } });
    //     if (!user) {
    //       return sendError(res, "Username atau Password salah", 401);
    //     }
    //     if (!user.isActive) {
    //       return sendError(
    //         res,
    //         "Akun Anda dinonaktifkan. Silakan hubungi Admin.",
    //         403
    //       );
    //     }
    //     const isMatch = await bcrypt.compare(password, user.password);
    //     if (!isMatch) {
    //       await AuditLog.create({
    //         userId: user.id,
    //         actionType: "LOGIN_FAILED",
    //         tableName: "Users",
    //         recordId: user.id,
    //         ipAddress: ipAddress,
    //         details: { reason: "Incorrect Password Attempt" },
    //       });
    //       return sendError(res, "Username atau Password salah", 401);
    //     }
    //     const role = await Roles.findByPk(user.roleId);
    //     const roleName = role ? (role.name as string).toLowerCase() : "viewer";
    //     const payload = {
    //       id: user.id,
    //       roleId: user.roleId,
    //       roleName: roleName,
    //       username: user.username,
    //     };
    //     const token = generateToken(payload);
    //     await AuditLog.create({
    //       userId: user.id,
    //       actionType: "USER_LOGIN",
    //       tableName: "Users",
    //       recordId: user.id,
    //       ipAddress: ipAddress,
    //       details: { username: user.username, role: roleName },
    //     });
    //     return sendSuccess(
    //       res,
    //       {
    //         token: token,
    //         user: {
    //           id: user.id,
    //           username: user.username,
    //           roleId: user.roleId,
    //         },
    //       },
    //       "Login Berhasil"
    //     );
    //   } catch (error) {
    //     return sendError(res, "Gagal Login", 500, error);
    //   }
    // }
    async postLogin(req, res) {
        try {
            const { username, password } = req.body;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            // 1. Ambil Data User
            // Pastikan di model Users, password diakses sebagai user.password (bukan user.passwordHash seperti contoh sebelumnya)
            const user = await users_model_1.default.findOne({ where: { username } });
            if (!user) {
                return (0, response_utils_1.sendError)(res, "Username atau Password salah", 401);
            }
            // 2. Cek Status Aktif
            if (!user.isActive) {
                // Log akses ke akun yang dinonaktifkan
                await auditLogs_model_1.default.create({
                    userId: user.id,
                    actionType: "LOGIN_BLOCKED_INACTIVE",
                    tableName: "Users",
                    recordId: user.id,
                    ipAddress: ipAddress,
                    details: { username, reason: "Akun dinonaktifkan (terkunci)." },
                });
                return (0, response_utils_1.sendError)(res, "Akun Anda dinonaktifkan. Silakan hubungi Admin.", 403);
            }
            // 3. Verifikasi Password
            const isMatch = await bcrypt.compare(password, user.password); // Asumsi field adalah user.password
            if (!isMatch) {
                // --- LOGIKA GAGAL LOGIN DENGAN PENGUNCIAN ---
                // Naikkan hitungan gagal
                user.failedAttemptCount = (user.failedAttemptCount || 0) + 1;
                const attemptCount = user.failedAttemptCount;
                if (attemptCount >= MAX_FAILED_ATTEMPTS) {
                    // Kunci Akun
                    user.isActive = false;
                    // Log Penguncian Akun
                    await auditLogs_model_1.default.create({
                        userId: user.id,
                        actionType: "ACCOUNT_LOCKED",
                        tableName: "Users",
                        recordId: user.id,
                        ipAddress: ipAddress,
                        details: {
                            username: user.username,
                            attempts: attemptCount,
                            status: "LOCKED",
                        },
                    });
                    // Simpan status baru (isActive=false)
                    await user.save();
                    return (0, response_utils_1.sendError)(res, `Password salah. Akun dinonaktifkan karena ${MAX_FAILED_ATTEMPTS} kali gagal login.`, 401);
                }
                // Hanya Simpan Hitungan Gagal
                await user.save();
                // Log Upaya Gagal
                await auditLogs_model_1.default.create({
                    userId: user.id,
                    actionType: "LOGIN_FAILED",
                    tableName: "Users",
                    recordId: user.id,
                    ipAddress: ipAddress,
                    details: {
                        reason: "Incorrect Password Attempt",
                        attemptCount: attemptCount,
                    },
                });
                return (0, response_utils_1.sendError)(res, "Username atau Password salah", 401);
            }
            // --- LOGIKA BERHASIL LOGIN ---
            // 4. Reset Hitungan Gagal
            if (user.failedAttemptCount && user.failedAttemptCount > 0) {
                user.failedAttemptCount = 0;
                await user.save();
            }
            const role = await roles_model_1.default.findByPk(user.roleId);
            const roleName = role ? role.name.toLowerCase() : "viewer";
            const payload = {
                id: user.id,
                roleId: user.roleId,
                roleName: roleName,
                username: user.username,
            };
            const token = (0, jwt_utils_1.generateToken)(payload);
            await auditLogs_model_1.default.create({
                userId: user.id,
                actionType: "USER_LOGIN",
                tableName: "Users",
                recordId: user.id,
                ipAddress: ipAddress,
                details: { username: user.username, role: roleName },
            });
            return (0, response_utils_1.sendSuccess)(res, {
                token: token,
                user: {
                    id: user.id,
                    username: user.username,
                    roleId: user.roleId,
                },
            }, "Login Berhasil");
        }
        catch (error) {
            return (0, response_utils_1.sendError)(res, "Gagal Login", 500, error);
        }
    }
    postLogout(req, res) {
        const userId = req.user?.id || 0;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        if (userId) {
            auditLogs_model_1.default.create({
                userId: userId,
                actionType: "USER_LOGOUT",
                ipAddress: ipAddress,
                details: { detail: "Manual logout from client" },
            });
        }
        return (0, response_utils_1.sendSuccess)(res, null, "Logout Berhasil. Silakan hapus token di sisi client.");
    }
    async getMe(req, res) {
        try {
            const user = req.user;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            await auditLogs_model_1.default.create({
                userId: user.id,
                actionType: "SESSION_CHECK",
                tableName: "Users",
                recordId: user.id,
                ipAddress: ipAddress,
                details: { endpoint: "/api/auth/me" },
            });
            return (0, response_utils_1.sendSuccess)(res, user, "Token Valid. User sedang login.");
        }
        catch (error) {
            return (0, response_utils_1.sendError)(res, "Gagal memuat data user", 500, error);
        }
    }
}
exports.default = new AuthController();
