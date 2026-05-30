import { Request, Response } from "express";
import authService from "../service/auth.service";
import { comparePassword } from "../utils/hash.utils";
import { sendSuccess, sendError } from "../utils/response.utils";
import { generateToken } from "../utils/jwt.utils";
import { getIpAddress } from "../utils/ipHelper.utils";

interface LoginBody {
  username: string;
  password: string;
}

const MAX_FAILED_ATTEMPTS = 3;

class AuthController {
  public async postLogin(req: Request, res: Response): Promise<Response> {
    try {
      const { username, password } = req.body as LoginBody;
      const ipAddress = getIpAddress(req);

      // 1. Ambil Data User
      const user = await authService.findUserByUsername(username);

      if (!user) {
        return sendError(res, "Username atau Password salah", 401);
      }

      // 2. Cek Status Aktif
      if (!user.isActive) {
        // Log akses ke akun yang dinonaktifkan
        await authService.logBlockedInactive(user.id, username, ipAddress);
        return sendError(
          res,
          "Akun Anda dinonaktifkan. Silakan hubungi Admin.",
          403
        );
      }

      // 3. Verifikasi Password
      const isMatch = await comparePassword(password, user.password);

      if (!isMatch) {
        const { locked } = await authService.handleFailedLogin(user, MAX_FAILED_ATTEMPTS, ipAddress);

        if (locked) {
          return sendError(
            res,
            `Password salah. Akun dinonaktifkan karena ${MAX_FAILED_ATTEMPTS} kali gagal login.`,
            401
          );
        }

        return sendError(res, "Username atau Password salah", 401);
      }

      // --- LOGIKA BERHASIL LOGIN ---
      const roleName = await authService.handleSuccessfulLogin(user, ipAddress);

      const payload = {
        id: user.id,
        roleId: user.roleId,
        roleName: roleName,
        username: user.username,
      };

      const token = generateToken(payload);

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
      authService.logLogout(userId, ipAddress);
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

      await authService.logSessionCheck(user.id, ipAddress);

      return sendSuccess(res, user, "Token Valid. User sedang login.");
    } catch (error) {
      return sendError(res, "Gagal memuat data user", 500, error);
    }
  }
}

export default new AuthController();
