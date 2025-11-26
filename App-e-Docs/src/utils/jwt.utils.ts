// utils/jwt.utils.ts

import * as jwt from "jsonwebtoken";

interface JWTPayload {
  id: number;
  roleId: number;
  username: string;
}

export function generateToken(payload: JWTPayload): string {
  const SECRET_KEY_STRING = process.env.JWT_SECRET || "rahasia_negara_api";
  const expiresIn = process.env.JWT_EXPIRES_IN || "1d";

  const secretKey = Buffer.from(SECRET_KEY_STRING, "utf8");

  const expiry: string = expiresIn;

  return jwt.sign(payload, secretKey, {
    expiresIn: expiry as jwt.SignOptions["expiresIn"],
  });
}
