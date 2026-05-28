import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { authenticateToken, authorizeRole } from "../middleware/auth.middleware";

const router = Router();

router.post("/login", AuthController.postLogin.bind(AuthController));

router.post("/logout", AuthController.postLogout.bind(AuthController));

router.get(
  "/me",
  authenticateToken,
  authorizeRole(["all"]),
  AuthController.getMe.bind(AuthController)
);

export default router;
