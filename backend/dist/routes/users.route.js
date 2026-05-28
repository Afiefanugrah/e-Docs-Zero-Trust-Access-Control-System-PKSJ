"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const users_controller_1 = __importDefault(require("../controllers/users.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/all", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin"]), users_controller_1.default.getAllUsers.bind(users_controller_1.default));
router.post("/register", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin"]), users_controller_1.default.postRegisterUsers.bind(users_controller_1.default));
router.put("/toggle-active/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin"]), users_controller_1.default.toggleActiveStatus.bind(users_controller_1.default));
router.delete("/delete/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin"]), users_controller_1.default.deleteUsers.bind(users_controller_1.default));
exports.default = router;
