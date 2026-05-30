import Users from "../models/users.model";
import Roles from "../models/roles.model";
import AuditLog from "../models/auditLogs.model";

class AuthService {
  public async findUserByUsername(username: string): Promise<Users | null> {
    return await Users.findOne({ where: { username } });
  }

  public async logBlockedInactive(userId: number, username: string, ipAddress: string): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "LOGIN_BLOCKED_INACTIVE",
      tableName: "Users",
      recordId: userId,
      ipAddress: ipAddress,
      details: { username, reason: "Akun dinonaktifkan (terkunci)." },
    });
  }

  public async handleFailedLogin(
    user: Users,
    maxAttempts: number,
    ipAddress: string
  ): Promise<{ locked: boolean; attempts: number }> {
    user.failedAttemptCount = (user.failedAttemptCount || 0) + 1;
    const attemptCount = user.failedAttemptCount;

    if (attemptCount >= maxAttempts) {
      user.isActive = false;

      await AuditLog.create({
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

      await user.save();
      return { locked: true, attempts: attemptCount };
    }

    await user.save();

    await AuditLog.create({
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

    return { locked: false, attempts: attemptCount };
  }

  public async handleSuccessfulLogin(user: Users, ipAddress: string): Promise<string> {
    if (user.failedAttemptCount && user.failedAttemptCount > 0) {
      user.failedAttemptCount = 0;
      await user.save();
    }

    const role = await Roles.findByPk(user.roleId);
    const roleName = role ? (role.name as string).toLowerCase() : "viewer";

    await AuditLog.create({
      userId: user.id,
      actionType: "USER_LOGIN",
      tableName: "Users",
      recordId: user.id,
      ipAddress: ipAddress,
      details: { username: user.username, role: roleName },
    });

    return roleName;
  }

  public async logLogout(userId: number, ipAddress: string): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "USER_LOGOUT",
      ipAddress: ipAddress,
      details: { detail: "Manual logout from client" },
    });
  }

  public async logSessionCheck(userId: number, ipAddress: string): Promise<void> {
    await AuditLog.create({
      userId: userId,
      actionType: "SESSION_CHECK",
      tableName: "Users",
      recordId: userId,
      ipAddress: ipAddress,
      details: { endpoint: "/api/auth/me" },
    });
  }
}

export default new AuthService();
