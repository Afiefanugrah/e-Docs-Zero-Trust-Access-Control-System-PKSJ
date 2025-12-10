"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const audit_controller_1 = __importDefault(require("../controllers/audit.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/all", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin"]), audit_controller_1.default.getAllAuditLogs.bind(audit_controller_1.default));
exports.default = router;
