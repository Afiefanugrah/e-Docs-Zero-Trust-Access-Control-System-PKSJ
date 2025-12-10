"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const documents_controller_1 = __importDefault(require("../controllers/documents.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
router.get("/all", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["all"]), documents_controller_1.default.getAllDocuments.bind(documents_controller_1.default));
router.get("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["all"]), documents_controller_1.default.getDocumentById.bind(documents_controller_1.default));
router.get("/slug/:slug", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["all"]), documents_controller_1.default.getDocumentBySlug.bind(documents_controller_1.default));
router.post("/create", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin", "editor"]), documents_controller_1.default.createDocument.bind(documents_controller_1.default));
router.put("/:id", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin", "editor"]), documents_controller_1.default.updateDocument.bind(documents_controller_1.default));
router.put("/update/:slug", auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRole)(["admin", "editor"]), documents_controller_1.default.updateDocumentBySlug.bind(documents_controller_1.default));
exports.default = router;
