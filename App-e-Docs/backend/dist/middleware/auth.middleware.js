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
exports.authorizeRole = exports.authenticateToken = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const response_utils_1 = require("../utils/response.utils");
const auditLogs_model_1 = __importDefault(require("../models/auditLogs.model"));
const ipHelper_utils_1 = require("../utils/ipHelper.utils");
// KRITIS: Tentukan ID User Sistem/Guest. ASUMSI ID ini ada di tabel Users Anda.
const DEFAULT_SYSTEM_USER_ID = 1;
const roleMap = {
    1: "viewer",
    2: "editor",
    3: "admin",
};
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) {
        // Tidak perlu log audit di sini karena req tidak terautentikasi dan kita tangani di authorizeRole
        return (0, response_utils_1.sendError)(res, "Akses ditolak. Token tidak ditemukan.", 401);
    }
    const SECRET_KEY = process.env.JWT_SECRET || "rahasia_negara_api";
    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            let userIdFromToken = null;
            // Coba ekstrak ID dari token yang expired untuk log yang lebih akurat
            try {
                const decoded = jwt.decode(token);
                userIdFromToken = decoded ? decoded.id : null;
            }
            catch (e) {
                // Gagal decode token (misalnya, format rusak)
            }
            // LOG UTAMA KEGAGALAN AUTENTIKASI: Menggunakan ID dari token atau ID Default (1)
            auditLogs_model_1.default.create({
                userId: userIdFromToken || DEFAULT_SYSTEM_USER_ID,
                actionType: "AUTH_FAILED",
                tableName: "Authentication",
                ipAddress: ipAddress,
                details: {
                    reason: `Autentikasi gagal: ${err.name}`,
                    userAttemptId: userIdFromToken,
                },
            });
            if (err.name === "TokenExpiredError") {
                return (0, response_utils_1.sendError)(res, "Sesi Anda telah berakhir. Silakan login ulang.", 401);
            }
            if (err.name === "JsonWebTokenError") {
                return (0, response_utils_1.sendError)(res, "Token tidak valid. Silakan login ulang.", 401);
            }
            return (0, response_utils_1.sendError)(res, "Autentikasi gagal.", 401);
        }
        const roleId = user.roleId;
        const roleName = roleMap[roleId];
        req.user = {
            id: user.id,
            roleId: roleId,
            roleName: roleName,
        };
        return next();
    });
};
exports.authenticateToken = authenticateToken;
const authorizeRole = (allowedRoles) => {
    return async (req, res, next) => {
        const actingUser = req.user;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        const userRole = actingUser?.roleName;
        // PERBAIKAN KRITIS: Jika user belum terautentikasi (actingUser?.id adalah undefined),
        // gunakan ID 1 untuk mencegah 'notNull Violation'.
        // Ini menangani kasus otorisasi yang gagal.
        const userId = actingUser?.id || DEFAULT_SYSTEM_USER_ID;
        if (!userRole) {
            // Log kegagalan saat user sudah melewati authenticateToken tapi peran hilang
            await auditLogs_model_1.default.create({
                userId: userId, // TIDAK LAGI NULL
                actionType: "AUTHENTICATION_FAILED",
                tableName: "Authorization",
                ipAddress: ipAddress,
                details: {
                    reason: "Informasi peran hilang dari token",
                    endpoint: req.originalUrl,
                },
            });
            return (0, response_utils_1.sendError)(res, "Akses Ditolak: Informasi peran tidak ditemukan.", 403);
        }
        if (allowedRoles.includes("all")) {
            return next();
        }
        if (allowedRoles.includes(userRole)) {
            return next();
        }
        // Akses Ditolak (Peran tidak diizinkan)
        await auditLogs_model_1.default.create({
            userId: userId, // TIDAK LAGI NULL
            actionType: "ACCESS_DENIED",
            tableName: "Authorization",
            ipAddress: ipAddress,
            details: {
                attemptedEndpoint: req.originalUrl,
                userRole: userRole,
                requiredRoles: allowedRoles.join(", "),
            },
        });
        return (0, response_utils_1.sendError)(res, "Akses Ditolak: Peran Anda tidak memiliki izin untuk aksi ini.", 403);
    };
};
exports.authorizeRole = authorizeRole;
