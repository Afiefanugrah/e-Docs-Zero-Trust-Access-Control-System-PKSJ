import { Request, Response } from "express";
import { DocumentStatus } from "../models/documents.model";
import documentsService from "../service/documents.service";
import { sendError, sendSuccess } from "../utils/response.utils";
import { sha256 } from "js-sha256";
import { getIpAddress } from "../utils/ipHelper.utils";

interface CreateDocumentBody {
  title: string;
  description?: string;
  markdown_content: string;
  version: string;
}

interface UpdateDocumentBody {
  title?: string;
  description?: string;
  markdown_content?: string;
}

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

class DocumentsController {
  public async getAllDocuments(req: Request, res: Response): Promise<Response> {
    try {
      const actingUser = (req as any).user;
      const ipAddress = getIpAddress(req);

      const documents = await documentsService.getAllDocuments(
        actingUser.id,
        actingUser.roleName,
        ipAddress
      );

      return sendSuccess(
        res,
        documents,
        "Daftar dokumen berhasil diambil.",
        200,
        {
          total: documents.length,
        },
      );
    } catch (error) {
      return sendError(res, "Gagal mengambil daftar dokumen.", 500, error);
    }
  }

  public async getDocumentById(req: Request, res: Response): Promise<Response> {
    const id = parseInt(req.params.id, 10);
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);

    if (isNaN(id)) {
      return sendError(res, "ID dokumen tidak valid.", 400);
    }

    try {
      const document = await documentsService.getDocumentById(
        id,
        actingUser.id,
        actingUser.roleName,
        ipAddress
      );

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      return sendSuccess(
        res,
        document,
        "Detail dokumen berhasil diambil.",
        200,
      );
    } catch (error) {
      console.error(`Error saat mengambil dokumen ID ${req.params.id}:`, error);
      return sendError(res, "Gagal mengambil dokumen.", 500, error);
    }
  }

  public async getDocumentBySlug(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const slug = req.params.slug;
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);

    if (!slug) {
      return sendError(res, "Slug dokumen tidak diberikan.", 400);
    }

    try {
      const document = await documentsService.getDocumentBySlug(
        slug,
        actingUser.id,
        actingUser.roleName,
        ipAddress
      );

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      return sendSuccess(
        res,
        document,
        "Detail dokumen berhasil diambil.",
        200,
      );
    } catch (error) {
      console.error(`Error saat mengambil dokumen (Slug: ${slug}):`, error);
      return sendError(res, "Gagal mengambil dokumen.", 500, error);
    }
  }

  public async createDocument(req: Request, res: Response): Promise<Response> {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);
    const userId = actingUser.id;

    try {
      const { title, description, markdown_content } =
        req.body as CreateDocumentBody;

      if (!title || !markdown_content) {
        await documentsService.logCreateDocumentFailed(
          userId,
          title,
          "Judul atau konten kosong",
          ipAddress
        );
        return sendError(res, "Judul dan konten Markdown wajib diisi.", 400);
      }

      const slug = generateSlug(title);

      const existingDocument = await documentsService.findBySlugOnly(slug);
      if (existingDocument) {
        await documentsService.logCreateDocumentFailed(
          userId,
          title,
          "Slug sudah digunakan",
          ipAddress,
          slug
        );
        return sendError(
          res,
          "Judul dokumen sudah ada. Ubah judul sedikit.",
          409,
        );
      }

      const checksum = sha256(markdown_content);

      const newDocument = await documentsService.createDocument(
        title,
        slug,
        description || "",
        markdown_content,
        checksum,
        userId,
        actingUser.roleName,
        ipAddress
      );

      const responseData = {
        id: newDocument.id,
        title: newDocument.title,
        slug: newDocument.slug,
        status: newDocument.status,
        version: newDocument.version,
        checksum: newDocument.checksum,
        created_by: newDocument.created_by,
        createdAt: newDocument.createdAt,
      };

      return sendSuccess(
        res,
        responseData,
        "Dokumen berhasil dibuat dan disimpan sebagai Draft.",
        201,
      );
    } catch (error) {
      console.error("Error saat membuat dokumen:", error);
      return sendError(res, "Gagal membuat dokumen.", 500, error);
    }
  }

  public async updateDocument(req: Request, res: Response): Promise<Response> {
    try {
      const docId = parseInt(req.params.id, 10);
      const currentUserId = (req as any).user.id;
      const updateData = req.body as UpdateDocumentBody;

      if (Object.keys(updateData).length === 0) {
        return sendError(
          res,
          "Tidak ada data yang dikirim untuk pembaruan.",
          400,
        );
      }

      const document = await documentsService.findByIdOnly(docId);

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      if (
        document.status !== DocumentStatus.Draft &&
        document.created_by !== currentUserId
      ) {
        return sendError(
          res,
          "Dokumen sudah disetujui (Approved) dan tidak dapat diedit.",
          403,
        );
      }

      let newChecksum = document.checksum;
      let newSlug = document.slug;

      if (
        updateData.markdown_content &&
        updateData.markdown_content !== document.markdown_content
      ) {
        newChecksum = sha256(updateData.markdown_content);
      }

      if (updateData.title && updateData.title !== document.title) {
        newSlug = generateSlug(updateData.title);
      }

      const updatedDocument = await documentsService.updateDocumentById(
        document,
        {
          title: updateData.title !== undefined ? updateData.title : document.title,
          description: updateData.description !== undefined ? updateData.description : document.description,
          markdown_content: updateData.markdown_content !== undefined ? updateData.markdown_content : document.markdown_content,
          slug: newSlug,
          checksum: newChecksum,
        },
        currentUserId
      );

      const responseData = {
        id: updatedDocument.id,
        title: updatedDocument.title,
        slug: updatedDocument.slug,
        checksum: updatedDocument.checksum,
        updatedAt: updatedDocument.updatedAt,
      };

      return sendSuccess(
        res,
        responseData,
        "Dokumen berhasil diperbarui.",
        200,
      );
    } catch (error) {
      console.error(
        `Error saat mengupdate dokumen ID ${req.params.id}:`,
        error,
      );
      return sendError(res, "Gagal memperbarui dokumen.", 500, error);
    }
  }

  public async updateDocumentBySlug(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);
    const userId = actingUser.id;

    try {
      const slugToUpdate = req.params.slug;
      const updateData = req.body as UpdateDocumentBody;

      if (Object.keys(updateData).length === 0) {
        return sendError(
          res,
          "Tidak ada data yang dikirim untuk pembaruan.",
          400,
        );
      }

      const { title, markdown_content } = updateData;

      const document = await documentsService.findBySlugOnly(slugToUpdate);

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      if (
        document.status !== DocumentStatus.Draft &&
        document.created_by !== userId
      ) {
        await documentsService.logUpdateFailed(
          userId,
          slugToUpdate,
          "Dokumen Approved, akses ditolak"
        );
        return sendError(
          res,
          "Dokumen sudah disetujui (Approved) dan tidak dapat diedit oleh Anda.",
          403,
        );
      }

      let newChecksum = document.checksum;
      let newSlug = document.slug;

      if (markdown_content && markdown_content !== document.markdown_content) {
        newChecksum = sha256(markdown_content);
      }

      if (title && title !== document.title) {
        newSlug = generateSlug(title);

        const existingDocumentWithNewSlug = await documentsService.findBySlugOnly(newSlug);

        if (
          existingDocumentWithNewSlug &&
          existingDocumentWithNewSlug.id !== document.id
        ) {
          return sendError(
            res,
            `Judul baru menghasilkan slug (${newSlug}) yang sudah digunakan oleh dokumen lain. Ubah judul sedikit.`,
            409,
          );
        }
      }

      const updatedDocument = await documentsService.updateDocumentBySlug(
        document,
        {
          title: updateData.title !== undefined ? updateData.title : document.title,
          description: updateData.description !== undefined ? updateData.description : document.description,
          markdown_content: updateData.markdown_content !== undefined ? updateData.markdown_content : document.markdown_content,
          slug: newSlug,
          checksum: newChecksum,
        },
        userId,
        actingUser.roleName,
        ipAddress
      );

      const responseData = {
        id: updatedDocument.id,
        title: updatedDocument.title,
        slug: updatedDocument.slug,
        checksum: updatedDocument.checksum,
        updatedAt: updatedDocument.updatedAt,
      };

      return sendSuccess(
        res,
        responseData,
        "Dokumen berhasil diperbarui.",
        200,
      );
    } catch (error) {
      console.error(
        `Error saat mengupdate dokumen slug ${req.params.slug}:`,
        error,
      );
      await documentsService.logUpdateError(
        userId,
        ipAddress,
        "Gagal memproses update",
        (error as Error).message
      );
      return sendError(res, "Gagal memperbarui dokumen.", 500, error);
    }
  }

  public async deleteDocumentBySlug(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);
    const userId = actingUser.id;
    const slugToDelete = req.params.slug;

    if (!slugToDelete) {
      return sendError(res, "Slug dokumen tidak diberikan.", 400);
    }

    try {
      const document = await documentsService.findBySlugOnly(slugToDelete);

      if (!document) {
        await documentsService.logDeleteFailed(
          userId,
          slugToDelete,
          actingUser.roleName,
          ipAddress
        );
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      const documentTitle = document.title;
      await documentsService.deleteDocumentBySlug(
        document,
        slugToDelete,
        userId,
        actingUser.roleName,
        ipAddress
      );

      return sendSuccess(
        res,
        null,
        `Dokumen "${documentTitle}" berhasil dihapus.`,
        200,
      );
    } catch (error) {
      return sendError(res, "Gagal menghapus dokumen.", 500, error);
    }
  }
}

export default new DocumentsController();
