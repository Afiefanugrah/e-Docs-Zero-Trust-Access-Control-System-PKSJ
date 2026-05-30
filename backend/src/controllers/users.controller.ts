import { Request, Response } from "express";
import userService from "../service/users.service";
import { hashPassword } from "../utils/hash.utils";
import { sendSuccess, sendError } from "../utils/response.utils";
import { validateUsername, validatePassword } from "../utils/validators.utils";
import { getIpAddress } from "../utils/ipHelper.utils";

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
      const actingUser = (req as any).user;
      const ipAddress = getIpAddress(req);

      const users = await userService.getAllUsers(actingUser.id, ipAddress);

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
      const actingUserId = (req as any).user?.id || null;

      if (!username || !password || !roleId) {
        return sendError(res, "Mohon isi username, password, dan role,", 400);
      }

      const cekUsername = await userService.findByUsername(username);

      if (cekUsername) {
        await userService.logRegistrationFailed(
          actingUserId,
          username,
          "Username sudah digunakan",
          ipAddress
        );

        return sendError(
          res,
          "Username sudah digunakan. Silakan pilih yang lain.",
          409,
        );
      }

      const usernameCheck = validateUsername(username);
      if (!usernameCheck.isValid) {
        await userService.logRegistrationFailed(
          actingUserId,
          username,
          usernameCheck.message || "Username tidak valid",
          ipAddress
        );
        return sendError(res, usernameCheck.message!, 400);
      }

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) {
        await userService.logRegistrationFailed(
          actingUserId,
          username,
          passwordCheck.message || "Password lemah",
          ipAddress
        );
        return sendError(res, passwordCheck.message || "Password lemah", 400);
      }

      const passwordHash = await hashPassword(password);

      const newUser = await userService.registerUser(
        username,
        passwordHash,
        roleId,
        isActive,
        actingUserId,
        ipAddress
      );

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
      await userService.logToggleFailed(
        actingUser.id,
        targetId,
        isActive,
        "Mencoba menonaktifkan diri sendiri",
        ipAddress
      );
      return sendError(
        res,
        "Anda tidak dapat menonaktifkan akun Admin Anda sendiri.",
        403,
      );
    }

    try {
      const user = await userService.toggleActiveStatus(
        targetId,
        isActive,
        actingUser.id,
        ipAddress
      );

      return sendSuccess(
        res,
        { id: user.id, isActive: user.isActive },
        `Status pengguna ${user.username} berhasil diubah menjadi ${
          user.isActive ? "Aktif" : "Nonaktif"
        }.`,
        200,
      );
    } catch (error: any) {
      console.error("Error saat toggle active status:", error);
      if (error.message === "USER_NOT_FOUND") {
        return sendError(res, "Pengguna tidak ditemukan.", 404);
      }
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

      await userService.deleteUser(userId, actingUser.id, ipAddress);

      return sendSuccess(res, null, "Pengguna berhasil dihapus.");
    } catch (error: any) {
      if (error.message === "USER_NOT_FOUND") {
        return sendError(res, "Pengguna tidak ditemukan.", 404);
      }
      return sendError(res, "Gagal membuat pengguna", 500, error);
    }
  }
}

export default new UserController();
