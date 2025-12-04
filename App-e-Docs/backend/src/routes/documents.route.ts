import { Router } from "express";
import documentsController from "../controllers/documents.controller";
import {
  authenticateToken,
  authorizeRole,
} from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/",
  authenticateToken,
  documentsController.getAllDocuments.bind(documentsController)
);

router.get(
  "/:id",
  authenticateToken,
  documentsController.getDocumentById.bind(documentsController)
);

router.post(
  "/create",
  authenticateToken,
  authorizeRole(["admin", "editor"]),
  documentsController.createDocument.bind(documentsController)
);

router.put(
  "/:id",
  authorizeRole(["admin", "editor"]),
  documentsController.updateDocument.bind(documentsController)
);

export default router;
