import { Router } from "express";
import documentsController from "../controllers/documents.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/all",
  authenticateToken,
  authorizeRole(["all"]),
  documentsController.getAllDocuments.bind(documentsController)
);

router.post(
  "/create",
  authenticateToken,
  authorizeRole(["admin", "editor"]),
  documentsController.createDocument.bind(documentsController)
);

router.get(
  "/:id",
  authenticateToken,
  authorizeRole(["all"]),
  documentsController.getDocumentById.bind(documentsController)
);

router.get(
  "/slug/:slug",
  authenticateToken,
  authorizeRole(["all"]),
  documentsController.getDocumentBySlug.bind(documentsController)
);

router.put(
  "/:id",
  authenticateToken,
  authorizeRole(["admin", "editor"]),
  documentsController.updateDocument.bind(documentsController)
);

router.put(
  "/update/:slug",
  authenticateToken,
  authorizeRole(["admin", "editor"]),
  documentsController.updateDocumentBySlug.bind(documentsController)
);

router.delete(
  "/slug/:slug",
  authenticateToken,
  authorizeRole(["admin"]), // <-- HANYA ADMIN BISA HAPUS
  documentsController.deleteDocumentBySlug.bind(documentsController)
);

export default router;
