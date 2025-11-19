import { Request, Response } from "express";
import Users from "../models/users.model";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";
import { sendSuccess, sendError } from "../utils/response.utits";

interface LoginBody {
  username: string;
  password: string;
}

class AuthController {
  public async postLogin(req: Request, res: Response): Promise<Response> {
    try {
      const { username, password } = req.body as LoginBody;

      const user = await Users.findOne({ where: { username } });
      if (!user) {
        return sendError(res, "Username atau Password salah", 401);
      }

      if (!user.isActive) {
        return sendError(
          res,
          "Akun Anda dinonaktifkan. Silakan hubungi Admin.",
          403
        );
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return sendError(res, "Username atau Password salah", 401);
      }

      const payload = {
        id: user.id,
        roleId: user.roleId,
        username: user.username,
      };

      const SECRET_KEY = process.env.JWT_SECRET || "rahasia_negara_api";

      const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });

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
}

export default new AuthController();
