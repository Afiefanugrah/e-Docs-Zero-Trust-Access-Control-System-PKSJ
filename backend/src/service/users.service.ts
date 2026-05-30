import Users from "../models/users.model";
import Roles from "../models/roles.model";
import AuditLog from "../models/auditLogs.model";

class UserService {
  public async getAllUsers(actingUserId: number, ipAddress: string): Promise<Users[]> {
    const users = await Users.findAll({
      include: [
        {
          model: Roles,
          as: "role",
          attributes: ["name"],
        },
      ],
      attributes: { exclude: ["password", "updatedAt"] },
    });

    await AuditLog.create({
      userId: actingUserId,
      actionType: "READ_ALL_USERS",
      tableName: "Users",
      recordId: undefined,
      ipAddress: ipAddress,
      details: {
        endpoint: "/api/users/all",
        count: users.length,
      },
    });

    return users;
  }

  public async findByUsername(username: string): Promise<Users | null> {
    return await Users.findOne({ where: { username } });
  }

  public async findById(id: number): Promise<Users | null> {
    return await Users.findByPk(id);
  }

  public async logRegistrationFailed(
    actingUserId: number | null,
    attemptedUsername: string,
    reason: string,
    ipAddress: string
  ): Promise<void> {
    await AuditLog.create({
      userId: actingUserId,
      actionType: "REGISTRATION_FAILED",
      tableName: "Users",
      recordId: undefined,
      ipAddress: ipAddress,
      details: {
        reason,
        attemptedUsername,
      },
    });
  }

  public async registerUser(
    username: string,
    passwordHash: string,
    roleId: number,
    isActive: boolean | undefined,
    actingUserId: number | null,
    ipAddress: string
  ): Promise<Users> {
    const newUser = await Users.create({
      username,
      password: passwordHash,
      roleId,
      isActive,
      failedAttemptCount: 0,
    });

    await AuditLog.create({
      userId: newUser.id,
      actionType: "USER_CREATED",
      tableName: "Users",
      recordId: newUser.id,
      ipAddress: ipAddress,
      details: {
        role: roleId,
        registeredBy: actingUserId || "SYSTEM/EXTERNAL",
      },
    });

    return newUser;
  }

  public async logToggleFailed(
    actingUserId: number,
    targetId: number,
    isActive: boolean,
    reason: string,
    ipAddress: string
  ): Promise<void> {
    await AuditLog.create({
      userId: actingUserId,
      actionType: "USER_TOGGLE_FAILED",
      tableName: "Users",
      recordId: targetId,
      ipAddress: ipAddress,
      details: {
        reason,
        targetId,
        statusAttempt: isActive,
      },
    });
  }

  public async toggleActiveStatus(
    targetId: number,
    isActive: boolean,
    actingUserId: number,
    ipAddress: string
  ): Promise<Users> {
    const user = await Users.findByPk(targetId);
    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    const oldStatus = user.isActive;
    await user.update({ isActive });

    const action = isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED";

    await AuditLog.create({
      userId: actingUserId,
      actionType: action,
      tableName: "Users",
      recordId: user.id,
      ipAddress: ipAddress,
      details: {
        targetUsername: user.username,
        oldStatus: oldStatus,
        newStatus: isActive,
      },
    });

    return user;
  }

  public async deleteUser(
    targetId: number,
    actingUserId: number,
    ipAddress: string
  ): Promise<void> {
    const user = await Users.findByPk(targetId);
    if (!user) {
      await AuditLog.create({
        userId: actingUserId,
        actionType: "DELETE_FAILED",
        tableName: "Users",
        recordId: targetId,
        ipAddress: ipAddress,
        details: { reason: "Pengguna target tidak ditemukan" },
      });
      throw new Error("USER_NOT_FOUND");
    }

    await user.destroy();

    await AuditLog.create({
      userId: actingUserId,
      actionType: "USER_DELETED",
      tableName: "Users",
      recordId: targetId,
      ipAddress: ipAddress,
      details: {
        deletedUsername: user.username,
        deletedRoleId: user.roleId,
      },
    });
  }
}

export default new UserService();
