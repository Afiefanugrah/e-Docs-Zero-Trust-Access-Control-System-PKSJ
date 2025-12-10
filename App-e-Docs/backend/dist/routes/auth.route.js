"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = __importDefault(require("../controllers/auth.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.post("/login", auth_controller_1.default.postLogin.bind(auth_controller_1.default));
router.post("/logout", auth_controller_1.default.postLogout.bind(auth_controller_1.default));
router.get("/me", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["all"]), auth_controller_1.default.getMe.bind(auth_controller_1.default));
exports.default = router;
