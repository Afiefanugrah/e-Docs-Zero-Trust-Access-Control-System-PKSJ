import { Router } from "express";
import AuthController from "../controllers/auth.controller";

const router = Router();

router.post("/login", AuthController.postLogin.bind(AuthController));

export default router;
