import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { sendError } from "../utils/response.utils";

// Mapping role berdasarkan roleId
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
    return sendError(res, "Akses ditolak. Token tidak ditemukan.", 401);
  }

  const SECRET_KEY = process.env.JWT_SECRET || "rahasia_negara_api";

  jwt.verify(token, SECRET_KEY, (err: any, user: any) => {
    if (err) {
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
      roleName: roleName, // admin/editor/viewer
    };

    return next();
  });
};

export const authorizeRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.roleName;

    if (!userRole) {
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

    return sendError(
      res,
      "Akses Ditolak: Peran Anda tidak memiliki izin untuk aksi ini.",
      403
    );
  };
};
