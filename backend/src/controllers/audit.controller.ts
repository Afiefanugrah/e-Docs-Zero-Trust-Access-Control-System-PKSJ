import { Request, Response } from "express";
import auditService from "../service/audit.service";
import { sendSuccess, sendError } from "../utils/response.utils";
import { getIpAddress } from "../utils/ipHelper.utils";

class AuditController {
  public async getAllAuditLogs(req: Request, res: Response): Promise<Response> {
    try {
      const actingUser = (req as any).user;
      const ipAddress = getIpAddress(req);

      const auditLogs = await auditService.getAllAuditLogs(actingUser.id, ipAddress);

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
