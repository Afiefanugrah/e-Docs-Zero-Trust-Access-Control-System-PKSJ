import { Request } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; roleName: string; roleId: number };
    }
  }
}
