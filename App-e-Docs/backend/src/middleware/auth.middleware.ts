import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { sendError } from "../utils/response.utils";
import AuditLog from "../models/auditLogs.model";
import { getIpAddress } from "../utils/ipHelper.utils";

// KRITIS: Tentukan ID User Sistem/Guest. ASUMSI ID ini ada di tabel Users Anda.
const DEFAULT_SYSTEM_USER_ID = 1;

const roleMap: Record<number, string> = {
  1: "viewer",
  2: "editor",
  3: "admin",
};

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; roleName: string; roleId: number };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    // Tidak perlu log audit di sini karena req tidak terautentikasi dan kita tangani di authorizeRole
    return sendError(res, "Akses ditolak. Token tidak ditemukan.", 401);
  }

  const SECRET_KEY = process.env.JWT_SECRET || "rahasia_negara_api";

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
      const ipAddress = getIpAddress(req);
      let userIdFromToken: number | null = null;

      // Coba ekstrak ID dari token yang expired untuk log yang lebih akurat
      try {
        const decoded = jwt.decode(token) as { id: number };
        userIdFromToken = decoded ? decoded.id : null;
      } catch (e) {
        // Gagal decode token (misalnya, format rusak)
      }

      // LOG UTAMA KEGAGALAN AUTENTIKASI: Menggunakan ID dari token atau ID Default (1)
      AuditLog.create({
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
        return sendError(
          res,
          "Sesi Anda telah berakhir. Silakan login ulang.",
          401
        );
      }

      if (err.name === "JsonWebTokenError") {
        return sendError(res, "Token tidak valid. Silakan login ulang.", 401);
      }

      return sendError(res, "Autentikasi gagal.", 401);
    }

    const roleId = user.roleId;
    const roleName = roleMap[roleId];

    (req as any).user = {
      id: user.id,
      roleId: roleId,
      roleName: roleName,
    };

    return next();
  });
};

export const authorizeRole = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);

    const userRole = actingUser?.roleName;

    // PERBAIKAN KRITIS: Jika user belum terautentikasi (actingUser?.id adalah undefined),
    // gunakan ID 1 untuk mencegah 'notNull Violation'.
    // Ini menangani kasus otorisasi yang gagal.
    const userId = actingUser?.id || DEFAULT_SYSTEM_USER_ID;

    if (!userRole) {
      // Log kegagalan saat user sudah melewati authenticateToken tapi peran hilang
      await AuditLog.create({
        userId: userId, // TIDAK LAGI NULL
        actionType: "AUTHENTICATION_FAILED",
        tableName: "Authorization",
        ipAddress: ipAddress,
        details: {
          reason: "Informasi peran hilang dari token",
          endpoint: req.originalUrl,
        },
      });
      return sendError(
        res,
        "Akses Ditolak: Informasi peran tidak ditemukan.",
        403
      );
    }

    if (allowedRoles.includes("all")) {
      return next();
    }

    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Akses Ditolak (Peran tidak diizinkan)
    await AuditLog.create({
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

    return sendError(
      res,
      "Akses Ditolak: Peran Anda tidak memiliki izin untuk aksi ini.",
      403
    );
  };
};
