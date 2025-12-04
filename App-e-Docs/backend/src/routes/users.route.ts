import { Router } from "express";
import UserController from "../controllers/users.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  UserController.getAllUsers.bind(UserController)
);

router.post("/register", UserController.postRegisterUsers.bind(UserController));

router.delete(
  "/delete/:id",
  authenticateToken,
  UserController.deleteUsers.bind(UserController)
);

export default router;
