// src/controllers/document.controller.ts

import { Request, Response } from "express";
// Import Documents dan DocumentStatus
import Documents, { DocumentStatus } from "../models/documents.model";
import { sendError, sendSuccess } from "../utils/response.utils";
import { sha256 } from "js-sha256"; // Menggunakan library yang sudah diinstal

interface CreateDocumentBody {
  title: string;
  description?: string;
  markdown_content: string;
}

interface UpdateDocumentBody {
  title?: string;
  description?: string;
  markdown_content?: string;
  // Status dan Versi mungkin hanya diubah melalui controller yang berbeda (workflow)
  // Untuk edit biasa, kita hanya ubah konten, title, dan description.
}

const generateSlug = (title: string): string => {
  return (
    title
      .toLowerCase()
      // Ganti karakter non-alfanumerik dengan strip (kecuali spasi dan strip)
      .replace(/[^a-z0-9\s-]/g, "")
      // Ganti spasi/strip berulang dengan strip tunggal
      .replace(/[\s-]+/g, "-")
      // Hapus strip di awal dan akhir
      .replace(/^-+|-+$/g, "")
  );
};

class DocumentsController {
  // --- GET All Documents ---
  public async getAllDocuments(req: Request, res: Response): Promise<Response> {
    try {
      const documents = await Documents.findAll({
        attributes: [
          "id",
          "title",
          "slug",
          "description",
          "status",
          "version",
          "created_by",
          "updatedAt",
        ],
        order: [["updatedAt", "DESC"]],
      });

      return sendSuccess(
        res,
        documents,
        "Daftar dokumen berhasil diambil.",
        200,
        {
          total: documents.length,
        }
      );
    } catch (error) {
      console.error("Error saat mengambil daftar dokumen:", error);
      return sendError(res, "Gagal mengambil daftar dokumen.", 500, error);
    }
  }

  public async getDocumentById(req: Request, res: Response): Promise<Response> {
    try {
      const id = parseInt(req.params.id, 10);

      const document = await Documents.findByPk(id);

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      return sendSuccess(
        res,
        document,
        "Detail dokumen berhasil diambil.",
        200
      );
    } catch (error) {
      console.error(`Error saat mengambil dokumen ID ${req.params.id}:`, error);
      return sendError(res, "Gagal mengambil dokumen.", 500, error);
    }
  }

  // --- POST / CREATE Document ---
  public async createDocument(req: Request, res: Response): Promise<Response> {
    try {
      const userId = (req as any).user.id;

      const { title, description, markdown_content } =
        req.body as CreateDocumentBody;

      if (!title || !markdown_content) {
        return sendError(res, "Judul dan konten Markdown wajib diisi.", 400);
      }

      const slug = generateSlug(title);

      const checksum = sha256(markdown_content);

      // 2. Buat dokumen baru di database
      const newDocument = await Documents.create({
        title,
        slug,
        description: description || null,
        markdown_content,
        // Status diambil dari enum yang diimpor dari model
        status: DocumentStatus.Draft,
        version: "1.0",
        checksum,
        created_by: userId,
        updated_by: userId,
        // pdf_path akan default ke null
      });

      // Siapkan response data
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
        201
      );
    } catch (error) {
      console.error("Error saat membuat dokumen:", error);
      return sendError(res, "Gagal membuat dokumen.", 500, error);
    }
  }

  // --- PUT / UPDATE Document ---
  public async updateDocument(req: Request, res: Response): Promise<Response> {
    try {
      const docId = parseInt(req.params.id, 10);
      // ID pengguna yang sedang login (penting untuk kepemilikan dan updated_by)
      const currentUserId = (req as any).user.id;

      const updateData = req.body as UpdateDocumentBody;

      if (Object.keys(updateData).length === 0) {
        return sendError(
          res,
          "Tidak ada data yang dikirim untuk pembaruan.",
          400
        );
      }

      // 1. Ambil Dokumen yang Ada
      const document = await Documents.findByPk(docId);

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      // --- 2. LOGIKA OTORISASI KHUSUS (MINGGU 3) ---

      // Contoh Otorisasi: Hanya pencipta yang boleh mengedit jika status masih DRAFT
      if (
        document.status !== DocumentStatus.Draft &&
        document.created_by !== currentUserId
      ) {
        // ASUMSI: Middleware authorizeRole sudah memfilter Admin, Editor di route
        return sendError(
          res,
          "Dokumen sudah disetujui (Approved) dan tidak dapat diedit.",
          403
        );
      }
      // Tambahkan cek kepemilikan jika diperlukan (e.g., Editor hanya boleh edit milik sendiri)
      // if (document.created_by !== currentUserId) { ... }

      let newChecksum = document.checksum;
      let newSlug = document.slug;

      // 3. Perhitungan dan Pembaruan Data

      // Jika konten Markdown diubah, hitung ulang checksum
      if (
        updateData.markdown_content &&
        updateData.markdown_content !== document.markdown_content
      ) {
        newChecksum = sha256(updateData.markdown_content);
      }

      // Jika judul diubah, hitung ulang slug
      if (updateData.title && updateData.title !== document.title) {
        newSlug = generateSlug(updateData.title);
      }

      // Simpan data yang diperbarui
      const updatedDocument = await document.update({
        ...updateData,
        slug: newSlug,
        checksum: newChecksum,
        updated_by: currentUserId, // Perbarui siapa yang terakhir mengubah
        // Catatan: version dan status TIDAK diubah di sini; itu melalui workflow controller
      });

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
        200
      );
    } catch (error) {
      console.error(
        `Error saat mengupdate dokumen ID ${req.params.id}:`,
        error
      );
      return sendError(res, "Gagal memperbarui dokumen.", 500, error);
    }
  }
}

export default new DocumentsController();
