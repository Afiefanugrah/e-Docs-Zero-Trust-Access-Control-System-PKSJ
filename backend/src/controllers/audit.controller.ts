import { Request, Response } from "express";
import AuditLog from "../models/auditLogs.model";
import Users from "../models/users.model";
import { sendSuccess, sendError } from "../utils/response.utils";
import { getIpAddress } from "../utils/ipHelper.utils";

class AuditController {
  public async getAllAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const auditLogs = await AuditLog.findAll({
        include: [
          {
            model: Users,
            as: "user",
            attributes: ["id", "username", "roleId"],
          },
        ],
        attributes: { exclude: ["updatedAt"] },
        order: [["createdAt", "DESC"]],
        limit: 100,
      });

      const actingUser = (req as any).user;
      const ipAddress = getIpAddress(req);

      await AuditLog.create({
        userId: actingUser.id,
        actionType: "VIEW_AUDIT_LOGS",
        tableName: "AuditLogs",
        recordId: undefined,
        ipAddress: ipAddress,
        details: {
          endpoint: "/api/audit/all",
          recordsViewed: auditLogs.length,
        },
      });

      return sendSuccess(
        res,
        auditLogs,
        "Daftar log audit berhasil diambil.",
        200,
        { total: auditLogs.length }
      );
    } catch (error) {
      console.error("Error saat mengambil log audit:", error);
      return sendError(res, "Gagal mengambil log audit.", 500, error);
    }
  }
}

export default new AuditController();
