import { Router } from "express";
import UserController from "../controllers/users.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/all",
  authenticateToken,
  authorizeRole(["admin"]),
  UserController.getAllUsers.bind(UserController),
);

router.post(
  "/register",
  authenticateToken,
  authorizeRole(["admin"]),
  UserController.postRegisterUsers.bind(UserController),
);

router.put(
  "/toggle-active/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  UserController.toggleActiveStatus.bind(UserController),
);

router.delete(
  "/delete/:id",
  authenticateToken,
  authorizeRole(["admin"]),
  UserController.deleteUsers.bind(UserController),
);

export default router;
