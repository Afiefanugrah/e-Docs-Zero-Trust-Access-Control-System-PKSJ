"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const documents_model_1 = __importStar(require("../models/documents.model"));
const response_utils_1 = require("../utils/response.utils");
const js_sha256_1 = require("js-sha256");
const ipHelper_utils_1 = require("../utils/ipHelper.utils");
const auditLogs_model_1 = __importDefault(require("../models/auditLogs.model"));
const users_model_1 = __importDefault(require("../models/users.model"));
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/[\s-]+/g, "-")
        .replace(/^-+|-+$/g, "");
};
class DocumentsController {
    async getAllDocuments(req, res) {
        try {
            const actingUser = req.user;
            const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
            const documents = await documents_model_1.default.findAll({
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
                        model: users_model_1.default,
                        as: "Creator",
                        attributes: ["username"],
                    },
                ],
                order: [["updatedAt", "DESC"]],
            });
            await auditLogs_model_1.default.create({
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
            return (0, response_utils_1.sendSuccess)(res, documents, "Daftar dokumen berhasil diambil.", 200, {
                total: documents.length,
            });
        }
        catch (error) {
            // console.error("Error saat mengambil daftar dokumen:", error);
            return (0, response_utils_1.sendError)(res, "Gagal mengambil daftar dokumen.", 500, error);
        }
    }
    async getDocumentById(req, res) {
        const id = parseInt(req.params.id, 10);
        const actingUser = req.user;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        if (isNaN(id)) {
            return (0, response_utils_1.sendError)(res, "ID dokumen tidak valid.", 400);
        }
        try {
            const document = await documents_model_1.default.findByPk(id, {
                include: [
                    { model: users_model_1.default, as: "Creator", attributes: ["username"] },
                    { model: users_model_1.default, as: "Updater", attributes: ["username"] },
                ],
            });
            if (!document) {
                // CATAT LOG GAGAL: Mencoba membaca dokumen yang tidak ada
                await auditLogs_model_1.default.create({
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
                return (0, response_utils_1.sendError)(res, "Dokumen tidak ditemukan.", 404);
            }
            await auditLogs_model_1.default.create({
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
            return (0, response_utils_1.sendSuccess)(res, document, "Detail dokumen berhasil diambil.", 200);
        }
        catch (error) {
            console.error(`Error saat mengambil dokumen ID ${req.params.id}:`, error);
            return (0, response_utils_1.sendError)(res, "Gagal mengambil dokumen.", 500, error);
        }
    }
    // Pastikan Anda mengimpor Users dan AuditLog, serta getIpAddress
    async getDocumentBySlug(req, res) {
        // Ambil slug dari parameter URL (misalnya, req.params.slug)
        const slug = req.params.slug;
        // Asumsi endpoint ini dilindungi (terotentikasi)
        const actingUser = req.user;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        // Cek slug yang tidak valid atau hilang
        if (!slug) {
            return (0, response_utils_1.sendError)(res, "Slug dokumen tidak diberikan.", 400);
        }
        try {
            // 1. Cari dokumen menggunakan slug
            const document = await documents_model_1.default.findOne({
                where: { slug }, // <--- Perubahan di sini
                include: [
                    { model: users_model_1.default, as: "Creator", attributes: ["username"] },
                    { model: users_model_1.default, as: "Updater", attributes: ["username"] },
                ],
            });
            // --- 2. Dokumen Tidak Ditemukan (404) ---
            if (!document) {
                // CATAT LOG GAGAL
                await auditLogs_model_1.default.create({
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
                return (0, response_utils_1.sendError)(res, "Dokumen tidak ditemukan.", 404);
            }
            // --- 3. Akses Berhasil (200) ---
            await auditLogs_model_1.default.create({
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
            return (0, response_utils_1.sendSuccess)(res, document, "Detail dokumen berhasil diambil.", 200);
        }
        catch (error) {
            console.error(`Error saat mengambil dokumen (Slug: ${slug}):`, error);
            // --- 4. Gagal Karena Server Error (500) ---
            await auditLogs_model_1.default.create({
                userId: actingUser.id,
                actionType: "READ_DOCUMENT_ERROR",
                tableName: "Documents",
                recordId: null,
                ipAddress: ipAddress,
                details: {
                    error: error.message,
                    searchParam: `Slug: ${slug}`,
                    userRole: actingUser.roleName,
                },
            });
            return (0, response_utils_1.sendError)(res, "Gagal mengambil dokumen.", 500, error);
        }
    }
    // --- POST / CREATE Document ---
    async createDocument(req, res) {
        const actingUser = req.user;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        const userId = actingUser.id;
        try {
            const { title, description, markdown_content } = req.body;
            if (!title || !markdown_content) {
                await auditLogs_model_1.default.create({
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
                return (0, response_utils_1.sendError)(res, "Judul dan konten Markdown wajib diisi.", 400);
            }
            const slug = generateSlug(title);
            const existingDocument = await documents_model_1.default.findOne({ where: { slug } });
            if (existingDocument) {
                await auditLogs_model_1.default.create({
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
                return (0, response_utils_1.sendError)(res, "Judul dokumen sudah ada. Ubah judul sedikit.", 409);
            }
            const checksum = (0, js_sha256_1.sha256)(markdown_content);
            // 2. Buat dokumen baru di database
            const newDocument = await documents_model_1.default.create({
                title,
                slug,
                description: description || null,
                markdown_content,
                // Status diambil dari enum yang diimpor dari model
                status: documents_model_1.DocumentStatus.Draft,
                version: "1.0",
                checksum,
                created_by: userId,
                updated_by: userId,
            });
            await auditLogs_model_1.default.create({
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
            return (0, response_utils_1.sendSuccess)(res, responseData, "Dokumen berhasil dibuat dan disimpan sebagai Draft.", 201);
        }
        catch (error) {
            console.error("Error saat membuat dokumen:", error);
            return (0, response_utils_1.sendError)(res, "Gagal membuat dokumen.", 500, error);
        }
    }
    // --- PUT / UPDATE Document ---
    async updateDocument(req, res) {
        try {
            const docId = parseInt(req.params.id, 10);
            // ID pengguna yang sedang login (penting untuk kepemilikan dan updated_by)
            const currentUserId = req.user.id;
            const updateData = req.body;
            if (Object.keys(updateData).length === 0) {
                return (0, response_utils_1.sendError)(res, "Tidak ada data yang dikirim untuk pembaruan.", 400);
            }
            // 1. Ambil Dokumen yang Ada
            const document = await documents_model_1.default.findByPk(docId);
            if (!document) {
                return (0, response_utils_1.sendError)(res, "Dokumen tidak ditemukan.", 404);
            }
            // --- 2. LOGIKA OTORISASI KHUSUS (MINGGU 3) ---
            // Contoh Otorisasi: Hanya pencipta yang boleh mengedit jika status masih DRAFT
            if (document.status !== documents_model_1.DocumentStatus.Draft &&
                document.created_by !== currentUserId) {
                // ASUMSI: Middleware authorizeRole sudah memfilter Admin, Editor di route
                return (0, response_utils_1.sendError)(res, "Dokumen sudah disetujui (Approved) dan tidak dapat diedit.", 403);
            }
            // Tambahkan cek kepemilikan jika diperlukan (e.g., Editor hanya boleh edit milik sendiri)
            // if (document.created_by !== currentUserId) { ... }
            let newChecksum = document.checksum;
            let newSlug = document.slug;
            // 3. Perhitungan dan Pembaruan Data
            // Jika konten Markdown diubah, hitung ulang checksum
            if (updateData.markdown_content &&
                updateData.markdown_content !== document.markdown_content) {
                newChecksum = (0, js_sha256_1.sha256)(updateData.markdown_content);
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
            return (0, response_utils_1.sendSuccess)(res, responseData, "Dokumen berhasil diperbarui.", 200);
        }
        catch (error) {
            console.error(`Error saat mengupdate dokumen ID ${req.params.id}:`, error);
            return (0, response_utils_1.sendError)(res, "Gagal memperbarui dokumen.", 500, error);
        }
    }
    async updateDocumentBySlug(req, res) {
        const actingUser = req.user;
        const ipAddress = (0, ipHelper_utils_1.getIpAddress)(req);
        // Kita asumsikan user sudah diautentikasi (melalui middleware)
        const userId = actingUser.id;
        try {
            const slugToUpdate = req.params.slug;
            // Ambil SEMUA data dari body, menggunakan interface UpdateDocumentBody
            const updateData = req.body;
            if (Object.keys(updateData).length === 0) {
                return (0, response_utils_1.sendError)(res, "Tidak ada data yang dikirim untuk pembaruan.", 400);
            }
            // Destructuring untuk pengecekan dan perhitungan
            const { title, markdown_content } = updateData;
            // 1. Ambil Dokumen yang Ada berdasarkan SLUG
            const document = await documents_model_1.default.findOne({
                where: { slug: slugToUpdate },
            });
            if (!document) {
                return (0, response_utils_1.sendError)(res, "Dokumen tidak ditemukan.", 404);
            }
            // --- 2. LOGIKA OTORISASI ---
            // Hanya izinkan edit jika dokumen masih Draft ATAU user adalah pembuatnya
            if (document.status !== documents_model_1.DocumentStatus.Draft &&
                document.created_by !== userId) {
                // Log Audit untuk penolakan akses
                await auditLogs_model_1.default.create({
                    userId: userId,
                    actionType: "UPDATE_DOCUMENT_FAILED",
                    details: {
                        reason: "Dokumen Approved, akses ditolak",
                        slug: slugToUpdate,
                    },
                });
                return (0, response_utils_1.sendError)(res, "Dokumen sudah disetujui (Approved) dan tidak dapat diedit oleh Anda.", 403);
            }
            let newChecksum = document.checksum;
            let newSlug = document.slug;
            // 3. Perhitungan Slug dan Checksum
            // Jika konten Markdown diubah, hitung ulang checksum
            if (markdown_content && markdown_content !== document.markdown_content) {
                newChecksum = (0, js_sha256_1.sha256)(markdown_content);
            }
            // Jika judul diubah, hitung ulang slug dan cek duplikasi
            if (title && title !== document.title) {
                newSlug = generateSlug(title);
                // Pengecekan duplikasi slug baru (KRITIS)
                const existingDocumentWithNewSlug = await documents_model_1.default.findOne({
                    where: { slug: newSlug },
                });
                if (existingDocumentWithNewSlug &&
                    existingDocumentWithNewSlug.id !== document.id) {
                    return (0, response_utils_1.sendError)(res, `Judul baru menghasilkan slug (${newSlug}) yang sudah digunakan oleh dokumen lain. Ubah judul sedikit.`, 409);
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
            await auditLogs_model_1.default.create({
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
            return (0, response_utils_1.sendSuccess)(res, responseData, "Dokumen berhasil diperbarui.", 200);
        }
        catch (error) {
            console.error(`Error saat mengupdate dokumen slug ${req.params.slug}:`, error);
            // Log Audit untuk error 500
            await auditLogs_model_1.default.create({
                userId: userId,
                actionType: "UPDATE_DOCUMENT_ERROR",
                tableName: "Documents",
                recordId: null,
                ipAddress: ipAddress,
                details: { reason: "Gagal memproses update", error: error.message },
            });
            return (0, response_utils_1.sendError)(res, "Gagal memperbarui dokumen.", 500, error);
        }
    }
}
exports.default = new DocumentsController();
