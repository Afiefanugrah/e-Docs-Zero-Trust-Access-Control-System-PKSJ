import { Request, Response } from "express";
import Users from "../models/users.model";
import Roles from "../models/roles.model";
import * as bcrypt from "bcrypt";

import { sendSuccess, sendError } from "../utils/response.utits";
import { validatePassword } from "../utils/validatePassword.utlis";
import { validateUsername } from "../utils/validators.utils";

interface createUserBody {
  username: string;
  password: string;
  roleId: number;
  isActive?: boolean;
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
        attributes: { exclude: ["passwordHash", "updatedAt"] },
      });

      return sendSuccess(
        res,
        users,
        "Berhasil mengambil data pengunjung",
        200,
        {
          total: users.length,
        }
      );
    } catch (error) {
      return sendError(res, "Gagal Mengambil data pengguna", 500, error);
    }
  }

  public async postRegisterUsers(
    req: Request,
    res: Response
  ): Promise<Response> {
    try {
      const { username, password, roleId, isActive } =
        req.body as createUserBody;

      if (!username || !password || !roleId) {
        return sendError(res, "Mohon isi username, password, dan role,", 400);
      }

      const cekUsername = await Users.findOne({ where: { username } });

      if (cekUsername) {
        return sendError(
          res,
          "Username sudah digunakan. Silakan pilih yang lain.",
          409
        );
      }

      const usernameCheck = validateUsername(username);
      if (!usernameCheck.isValid) {
        return sendError(res, usernameCheck.message!, 400);
      }

      const passwordCheck = validatePassword(password);
      if (!passwordCheck.valid) {
        return sendError(res, passwordCheck.message || "Password lemah", 400);
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const newUser = await Users.create({
        username,
        password: passwordHash,
        roleId,
        isActive,
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
}

export default new UserController();
