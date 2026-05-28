import { Router } from "express";
import AuditController from "../controllers/audit.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/all",
  authenticateToken,
  authorizeRole(["admin"]),
  AuditController.getAllAuditLogs.bind(AuditController)
);

export default router;
