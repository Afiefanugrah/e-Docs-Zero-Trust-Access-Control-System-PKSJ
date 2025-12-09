import { Request, Response } from "express";
import Documents, { DocumentStatus } from "../models/documents.model";
import { sendError, sendSuccess } from "../utils/response.utils";
import { sha256 } from "js-sha256";
import { getIpAddress } from "../utils/ipHelper.utils";
import AuditLog from "../models/auditLogs.model";
import Users from "../models/users.model";

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
        include: [
          {
            model: Users,
            as: "Creator",
            attributes: ["username"],
          },
        ],
        order: [["updatedAt", "DESC"]],
      });

      await AuditLog.create({
        userId: actingUser.id,
        actionType: "READ_ALL_DOCUMENTS",
        tableName: "Documents",
        recordId: null,
        ipAddress: ipAddress,
        details: {
          endpoint: "/api/documents/all",
          count: documents.length,
          userRole: actingUser.roleName,
        },
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
      // console.error("Error saat mengambil daftar dokumen:", error);
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
      const document = await Documents.findByPk(id, {
        include: [
          { model: Users, as: "Creator", attributes: ["username"] },
          { model: Users, as: "Updater", attributes: ["username"] },
        ],
      });

      if (!document) {
        // CATAT LOG GAGAL: Mencoba membaca dokumen yang tidak ada
        await AuditLog.create({
          userId: actingUser.id,
          actionType: "READ_DOCUMENT_FAILED",
          tableName: "Documents",
          recordId: id,
          ipAddress: ipAddress,
          details: {
            reason: "Dokumen tidak ditemukan (404)",
            userRole: actingUser.roleName,
          },
        });

        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      await AuditLog.create({
        userId: actingUser.id,
        actionType: "READ_DOCUMENT_SUCCESS",
        tableName: "Documents",
        recordId: id,
        ipAddress: ipAddress,
        details: {
          title: document.title,
          status: document.status,
          userRole: actingUser.roleName,
        },
      });

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

  // Pastikan Anda mengimpor Users dan AuditLog, serta getIpAddress

  public async getDocumentBySlug(
    req: Request,
    res: Response
  ): Promise<Response> {
    // Ambil slug dari parameter URL (misalnya, req.params.slug)
    const slug = req.params.slug;

    // Asumsi endpoint ini dilindungi (terotentikasi)
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);

    // Cek slug yang tidak valid atau hilang
    if (!slug) {
      return sendError(res, "Slug dokumen tidak diberikan.", 400);
    }

    try {
      // 1. Cari dokumen menggunakan slug
      const document = await Documents.findOne({
        where: { slug }, // <--- Perubahan di sini
        include: [
          { model: Users, as: "Creator", attributes: ["username"] },
          { model: Users, as: "Updater", attributes: ["username"] },
        ],
      });

      // --- 2. Dokumen Tidak Ditemukan (404) ---
      if (!document) {
        // CATAT LOG GAGAL
        await AuditLog.create({
          userId: actingUser.id,
          actionType: "READ_DOCUMENT_FAILED",
          tableName: "Documents",
          recordId: null,
          ipAddress: ipAddress,
          details: {
            reason: "Dokumen tidak ditemukan (404)",
            searchParam: `Slug: ${slug}`,
            userRole: actingUser.roleName,
          },
        });

        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      // --- 3. Akses Berhasil (200) ---
      await AuditLog.create({
        userId: actingUser.id,
        actionType: "READ_DOCUMENT_SUCCESS",
        tableName: "Documents",
        recordId: document.id, // Gunakan ID dokumen yang ditemukan
        ipAddress: ipAddress,
        details: {
          title: document.title,
          status: document.status,
          searchParam: `Slug: ${slug}`,
          userRole: actingUser.roleName,
        },
      });

      return sendSuccess(
        res,
        document,
        "Detail dokumen berhasil diambil.",
        200
      );
    } catch (error) {
      console.error(`Error saat mengambil dokumen (Slug: ${slug}):`, error);

      // --- 4. Gagal Karena Server Error (500) ---
      await AuditLog.create({
        userId: actingUser.id,
        actionType: "READ_DOCUMENT_ERROR",
        tableName: "Documents",
        recordId: null,
        ipAddress: ipAddress,
        details: {
          error: (error as Error).message,
          searchParam: `Slug: ${slug}`,
          userRole: actingUser.roleName,
        },
      });

      return sendError(res, "Gagal mengambil dokumen.", 500, error);
    }
  }

  // --- POST / CREATE Document ---
  public async createDocument(req: Request, res: Response): Promise<Response> {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);
    const userId = actingUser.id;

    try {
      const { title, description, markdown_content } =
        req.body as CreateDocumentBody;

      if (!title || !markdown_content) {
        await AuditLog.create({
          userId: userId,
          actionType: "CREATE_DOCUMENT_FAILED",
          tableName: "Documents",
          recordId: null,
          ipAddress: ipAddress,
          details: {
            reason: "Judul atau konten kosong",
            attemptedTitle: title,
          },
        });
        return sendError(res, "Judul dan konten Markdown wajib diisi.", 400);
      }

      const slug = generateSlug(title);

      const existingDocument = await Documents.findOne({ where: { slug } });
      if (existingDocument) {
        await AuditLog.create({
          userId: userId,
          actionType: "CREATE_DOCUMENT_FAILED",
          tableName: "Documents",
          recordId: null,
          ipAddress: ipAddress,
          details: {
            reason: "Slug sudah digunakan",
            attemptedTitle: title,
            generatedSlug: slug,
          },
        });
        return sendError(
          res,
          "Judul dokumen sudah ada. Ubah judul sedikit.",
          409
        );
      }

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
      });

      await AuditLog.create({
        userId: userId,
        actionType: "DOCUMENT_CREATED",
        tableName: "Documents",
        recordId: newDocument.id,
        ipAddress: ipAddress,
        details: {
          title: newDocument.title,
          status: newDocument.status,
          userRole: actingUser.roleName,
        },
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

  public async updateDocumentBySlug(
    req: Request,
    res: Response
  ): Promise<Response> {
    const actingUser = (req as any).user;
    const ipAddress = getIpAddress(req);
    // Kita asumsikan user sudah diautentikasi (melalui middleware)
    const userId = actingUser.id;

    try {
      const slugToUpdate = req.params.slug;

      // Ambil SEMUA data dari body, menggunakan interface UpdateDocumentBody
      const updateData = req.body as UpdateDocumentBody;

      if (Object.keys(updateData).length === 0) {
        return sendError(
          res,
          "Tidak ada data yang dikirim untuk pembaruan.",
          400
        );
      }

      // Destructuring untuk pengecekan dan perhitungan
      const { title, markdown_content } = updateData;

      // 1. Ambil Dokumen yang Ada berdasarkan SLUG
      const document = await Documents.findOne({
        where: { slug: slugToUpdate },
      });

      if (!document) {
        return sendError(res, "Dokumen tidak ditemukan.", 404);
      }

      // --- 2. LOGIKA OTORISASI ---
      // Hanya izinkan edit jika dokumen masih Draft ATAU user adalah pembuatnya
      if (
        document.status !== DocumentStatus.Draft &&
        document.created_by !== userId
      ) {
        // Log Audit untuk penolakan akses
        await AuditLog.create({
          userId: userId,
          actionType: "UPDATE_DOCUMENT_FAILED",
          details: {
            reason: "Dokumen Approved, akses ditolak",
            slug: slugToUpdate,
          },
        });
        return sendError(
          res,
          "Dokumen sudah disetujui (Approved) dan tidak dapat diedit oleh Anda.",
          403
        );
      }

      let newChecksum = document.checksum;
      let newSlug = document.slug;

      // 3. Perhitungan Slug dan Checksum

      // Jika konten Markdown diubah, hitung ulang checksum
      if (markdown_content && markdown_content !== document.markdown_content) {
        newChecksum = sha256(markdown_content);
      }

      // Jika judul diubah, hitung ulang slug dan cek duplikasi
      if (title && title !== document.title) {
        newSlug = generateSlug(title);

        // Pengecekan duplikasi slug baru (KRITIS)
        const existingDocumentWithNewSlug = await Documents.findOne({
          where: { slug: newSlug },
        });

        if (
          existingDocumentWithNewSlug &&
          existingDocumentWithNewSlug.id !== document.id
        ) {
          return sendError(
            res,
            `Judul baru menghasilkan slug (${newSlug}) yang sudah digunakan oleh dokumen lain. Ubah judul sedikit.`,
            409
          );
        }
      }

      // 4. Simpan data yang diperbarui
      const updatedDocument = await document.update({
        // Menggunakan spread operator untuk menerapkan semua field dari updateData
        ...updateData,
        slug: newSlug,
        checksum: newChecksum,
        updated_by: userId,
      });

      // Catat Log Audit
      await AuditLog.create({
        userId: userId,
        actionType: "DOCUMENT_UPDATED_BY_SLUG",
        tableName: "Documents",
        recordId: updatedDocument.id,
        ipAddress: ipAddress,
        details: {
          title: updatedDocument.title,
          slug_updated: newSlug !== document.slug,
          userRole: actingUser.roleName,
        },
      });

      // 5. Siapkan Response
      const responseData = {
        id: updatedDocument.id,
        title: updatedDocument.title,
        // Penting: Mengembalikan slug baru jika ada perubahan, untuk redirect frontend
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
        `Error saat mengupdate dokumen slug ${req.params.slug}:`,
        error
      );
      // Log Audit untuk error 500
      await AuditLog.create({
        userId: userId,
        actionType: "UPDATE_DOCUMENT_ERROR",
        tableName: "Documents",
        recordId: null,
        ipAddress: ipAddress,
        details: { reason: "Gagal memproses update", error: error.message },
      });
      return sendError(res, "Gagal memperbarui dokumen.", 500, error);
    }
  }
}

export default new DocumentsController();
