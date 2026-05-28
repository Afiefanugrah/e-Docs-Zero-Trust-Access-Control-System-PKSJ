import { Request, Response } from "express";
import Users from "../models/users.model";
import Roles from "../models/roles.model";
import AuditLog from "../models/auditLogs.model";
import * as bcrypt from "bcrypt";
import { sendSuccess, sendError } from "../utils/response.utils";
import { generateToken } from "../utils/jwt.utils";
import { getIpAddress } from "../utils/ipHelper.utils";

interface LoginBody {
  username: string;
  password: string;
}

const MAX_FAILED_ATTEMPTS = 3;

class AuthController {
  // public async postLogin(req: Request, res: Response): Promise<Response> {
  //   try {
  //     const { username, password } = req.body as LoginBody;
  //     const ipAddress = getIpAddress(req);

  //     const user = await Users.findOne({ where: { username } });
  //     if (!user) {
  //       return sendError(res, "Username atau Password salah", 401);
  //     }

  //     if (!user.isActive) {
  //       return sendError(
  //         res,
  //         "Akun Anda dinonaktifkan. Silakan hubungi Admin.",
  //         403
  //       );
  //     }

  //     const isMatch = await bcrypt.compare(password, user.password);
  //     if (!isMatch) {
  //       await AuditLog.create({
  //         userId: user.id,
  //         actionType: "LOGIN_FAILED",
  //         tableName: "Users",
  //         recordId: user.id,
  //         ipAddress: ipAddress,
  //         details: { reason: "Incorrect Password Attempt" },
  //       });

  //       return sendError(res, "Username atau Password salah", 401);
  //     }

  //     const role = await Roles.findByPk(user.roleId);
  //     const roleName = role ? (role.name as string).toLowerCase() : "viewer";

  //     const payload = {
  //       id: user.id,
  //       roleId: user.roleId,
  //       roleName: roleName,
  //       username: user.username,
  //     };

  //     const token = generateToken(payload);

  //     await AuditLog.create({
  //       userId: user.id,
  //       actionType: "USER_LOGIN",
  //       tableName: "Users",
  //       recordId: user.id,
  //       ipAddress: ipAddress,
  //       details: { username: user.username, role: roleName },
  //     });

  //     return sendSuccess(
  //       res,
  //       {
  //         token: token,
  //         user: {
  //           id: user.id,
  //           username: user.username,
  //           roleId: user.roleId,
  //         },
  //       },
  //       "Login Berhasil"
  //     );
  //   } catch (error) {
  //     return sendError(res, "Gagal Login", 500, error);
  //   }
  // }

  public async postLogin(req: Request, res: Response): Promise<Response> {
    try {
      const { username, password } = req.body as LoginBody;
      const ipAddress = getIpAddress(req);

      // 1. Ambil Data User
      // Pastikan di model Users, password diakses sebagai user.password (bukan user.passwordHash seperti contoh sebelumnya)
      const user = await Users.findOne({ where: { username } });

      if (!user) {
        return sendError(res, "Username atau Password salah", 401);
      }

      // 2. Cek Status Aktif
      if (!user.isActive) {
        // Log akses ke akun yang dinonaktifkan
        await AuditLog.create({
          userId: user.id,
          actionType: "LOGIN_BLOCKED_INACTIVE",
          tableName: "Users",
          recordId: user.id,
          ipAddress: ipAddress,
          details: { username, reason: "Akun dinonaktifkan (terkunci)." },
        });
        return sendError(
          res,
          "Akun Anda dinonaktifkan. Silakan hubungi Admin.",
          403
        );
      }

      // 3. Verifikasi Password
      const isMatch = await bcrypt.compare(password, user.password); // Asumsi field adalah user.password

      if (!isMatch) {
        // --- LOGIKA GAGAL LOGIN DENGAN PENGUNCIAN ---

        // Naikkan hitungan gagal
        user.failedAttemptCount = (user.failedAttemptCount || 0) + 1;

        const attemptCount = user.failedAttemptCount;

        if (attemptCount >= MAX_FAILED_ATTEMPTS) {
          // Kunci Akun
          user.isActive = false;

          // Log Penguncian Akun
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

          // Simpan status baru (isActive=false)
          await user.save();

          return sendError(
            res,
            `Password salah. Akun dinonaktifkan karena ${MAX_FAILED_ATTEMPTS} kali gagal login.`,
            401
          );
        }

        // Hanya Simpan Hitungan Gagal
        await user.save();

        // Log Upaya Gagal
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

        return sendError(res, "Username atau Password salah", 401);
      }

      // --- LOGIKA BERHASIL LOGIN ---

      // 4. Reset Hitungan Gagal
      if (user.failedAttemptCount && user.failedAttemptCount > 0) {
        user.failedAttemptCount = 0;
        await user.save();
      }

      const role = await Roles.findByPk(user.roleId);
      const roleName = role ? (role.name as string).toLowerCase() : "viewer";

      const payload = {
        id: user.id,
        roleId: user.roleId,
        roleName: roleName,
        username: user.username,
      };

      const token = generateToken(payload);

      await AuditLog.create({
        userId: user.id,
        actionType: "USER_LOGIN",
        tableName: "Users",
        recordId: user.id,
        ipAddress: ipAddress,
        details: { username: user.username, role: roleName },
      });

      return sendSuccess(
        res,
        {
          token: token,
          user: {
            id: user.id,
            username: user.username,
            roleId: user.roleId,
          },
        },
        "Login Berhasil"
      );
    } catch (error) {
      return sendError(res, "Gagal Login", 500, error);
    }
  }

  public postLogout(req: Request, res: Response): Response {
    const userId = (req as any).user?.id || 0;
    const ipAddress = getIpAddress(req);

    if (userId) {
      AuditLog.create({
        userId: userId,
        actionType: "USER_LOGOUT",
        ipAddress: ipAddress,
        details: { detail: "Manual logout from client" },
      });
    }

    return sendSuccess(
      res,
      null,
      "Logout Berhasil. Silakan hapus token di sisi client."
    );
  }

  public async getMe(req: Request, res: Response): Promise<Response> {
    try {
      const user = (req as any).user;
      const ipAddress = getIpAddress(req);

      await AuditLog.create({
        userId: user.id,
        actionType: "SESSION_CHECK",
        tableName: "Users",
        recordId: user.id,
        ipAddress: ipAddress,
        details: { endpoint: "/api/auth/me" },
      });

      return sendSuccess(res, user, "Token Valid. User sedang login.");
    } catch (error) {
      return sendError(res, "Gagal memuat data user", 500, error);
    }
  }
}

export default new AuthController();
