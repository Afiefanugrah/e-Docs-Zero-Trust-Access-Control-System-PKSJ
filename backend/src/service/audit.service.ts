import AuditLog from "../models/auditLogs.model";
import Users from "../models/users.model";

class AuditService {
  public async getAllAuditLogs(actingUserId: number, ipAddress: string): Promise<AuditLog[]> {
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

    await AuditLog.create({
      userId: actingUserId,
      actionType: "VIEW_AUDIT_LOGS",
      tableName: "AuditLogs",
      recordId: undefined,
      ipAddress: ipAddress,
      details: {
        endpoint: "/api/audit/all",
        recordsViewed: auditLogs.length,
      },
    });

    return auditLogs;
  }
}

export default new AuditService();
