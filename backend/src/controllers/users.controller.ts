import { Request, Response } from "express";
import Users from "../models/users.model";
import Roles from "../models/roles.model";
import AuditLog from "../models/auditLogs.model";
import * as bcrypt from "bcrypt";
import { sendSuccess, sendError } from "../utils/response.utils";
import { validateUsername, validatePassword } from "../utils/validators.utils";
import { getIpAddress } from "../utils/ipHelper.utils";

const MAX_FAILED_ATTEMPTS = 3;

interface createUserBody {
  username: string;
  password: string;
  roleId: number;
  isActive?: boolean;
}

interface ToggleActiveBody {
  isActive: boolean; // Status yang ingin ditetapkan
}

class UserController {
  public async getAllUsers(req: Request, res: Response): Promise<Response> {
    try {
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

      const actingUser = (req as any).user;
      const ipAddress = getIpAddress(req);

      await AuditLog.create({
        userId: actingUser.id,
        actionType: "READ_ALL_USERS",
        tableName: "Users",
        recordId: undefined,
        ipAddress: ipAddress,
        details: {
          endpoint: "/api/users/all",
          count: users.length,
        },
      });

      return sendSuccess(
        res,
        users,
        "Berhasil mengambil data pengunjung",
        200,
        {
          total: users.length,
        },
      );
    } catch (error) {
      return sendError(res, "Gagal Mengambil data pengguna", 500, error);
    }
  }

  public async postRegisterUsers(
    req: Request,
    res: Response,
  ): Promise<Response> {
    try {
      const { username, password, roleId, isActive } =
        req.body as createUserBody;

      const ipAddress = getIpAddress(req);

      if (!username || !password || !roleId) {
        return sendError(res, "Mohon isi username, password, dan role,", 400);
      }

      const cekUsername = await Users.findOne({ where: { username } });

      if (cekUsername) {
        await AuditLog.create({
          userId: cekUsername.id,
          actionType: "REGISTRATION_FAILED",
          tableName: "Users",
          recordId: undefined,
          ipAddress: ipAddress,
          details: {
            reason: "Username sudah digunakan",
            attemptedUsername: username,
          },
        });

        return sendError(
          res,
          "Username sudah digunakan. Silakan pilih yang lain.",
          409,
        );
      }

      const usernameCheck = validateUsername(username);
      if (!usernameCheck.isValid) {
        await AuditLog.create({
          userId: 0,
          actionType: "REGISTRATION_FAILED",
          tableName: "Users",
          recordId: undefined,
          ipAddress: ipAddress,
          details: {
            reason: usernameCheck.message || "Password lemah",
            attemptedUsername: username,
          },
        });
        return sendError(res, usernameCheck.message!, 400);
      }

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) {
        const ipAddress = getIpAddress(req);

        await AuditLog.create({
          userId: 0,
          actionType: "REGISTRATION_FAILED",
          tableName: "Users",
          recordId: undefined,
          ipAddress: ipAddress,
          details: {
            reason: passwordCheck.message || "Password lemah",
            attemptedUsername: username,
          },
        });
        return sendError(res, passwordCheck.message || "Password lemah", 400);
      }

      const passwordHash = await bcrypt.hash(password, 12);

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
          registeredBy: (req as any).user?.id || "SYSTEM/EXTERNAL",
        },
      });

      const responseData = {
        id: newUser.id,
        username: newUser.username,
        roleId: newUser.roleId,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
      };

      return sendSuccess(res, responseData, "Pengguna berhasil dibuat.", 201);
    } catch (error) {
      return sendError(res, "Gagal membuat pengguna", 500, error);
    }
  }

  public async toggleActiveStatus(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);
    const targetId = parseInt(req.params.id, 10);
    const { isActive } = req.body as ToggleActiveBody;

    if (isNaN(targetId)) {
      return sendError(res, "ID pengguna tidak valid.", 400);
    }

    // 1. Cek Pencegahan: Admin tidak boleh menonaktifkan dirinya sendiri
    if (actingUser.id === targetId) {
      await AuditLog.create({
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
      return sendError(
        res,
        "Anda tidak dapat menonaktifkan akun Admin Anda sendiri.",
        403,
      );
    }

    try {
      const user = await Users.findByPk(targetId);

      if (!user) {
        return sendError(res, "Pengguna tidak ditemukan.", 404);
      }

      // 2. Lakukan Update Status
      const oldStatus = user.isActive;
      const newStatus = isActive;

      await user.update({ isActive: newStatus });

      const action = newStatus ? "USER_ACTIVATED" : "USER_DEACTIVATED";

      // 3. Catat Log Audit
      await AuditLog.create({
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

      return sendSuccess(
        res,
        { id: user.id, isActive: newStatus },
        `Status pengguna ${user.username} berhasil diubah menjadi ${
          newStatus ? "Aktif" : "Nonaktif"
        }.`,
        200,
      );
    } catch (error) {
      console.error("Error saat toggle active status:", error);
      return sendError(res, "Gagal mengubah status pengguna.", 500, error);
    }
  }

  public async deleteUsers(req: Request, res: Response): Promise<Response> {
    try {
      const userId = parseInt(req.params.id, 10);

      const actingUser = (req as any).user;
      const ipAddress = getIpAddress(req);

      if (isNaN(userId)) {
        return sendError(res, "ID pengguna tidak valid.", 400);
      }

      const user = await Users.findByPk(userId);
      if (!user) {
        await AuditLog.create({
          userId: actingUser.id,
          actionType: "DELETE_FAILED",
          tableName: "Users",
          recordId: userId,
          ipAddress: ipAddress,
          details: { reason: "Pengguna target tidak ditemukan" },
        });
        return sendError(res, "Pengguna tidak ditemukan.", 404);
      }

      await user.destroy();

      await AuditLog.create({
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

      return sendSuccess(res, null, "Pengguna berhasil dihapus.");
    } catch (error) {
      return sendError(res, "Gagal membuat pengguna", 500, error);
    }
  }
}

export default new UserController();
