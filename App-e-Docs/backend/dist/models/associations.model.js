"use strict";
// src/models/associations.model.ts
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAssociations = void 0;
const users_model_1 = __importDefault(require("./users.model"));
const roles_model_1 = __importDefault(require("./roles.model"));
const documents_model_1 = __importDefault(require("./documents.model"));
const auditLogs_model_1 = __importDefault(require("./auditLogs.model"));
const setupAssociations = () => {
    // 1. Relasi One-to-Many (One Role has Many Users)
    roles_model_1.default.hasMany(users_model_1.default, {
        foreignKey: "roleId",
        as: "users",
        onDelete: "RESTRICT",
    });
    // 2. Relasi Many-to-One (Many Users belong to One Role)
    users_model_1.default.belongsTo(roles_model_1.default, {
        foreignKey: "roleId",
        as: "role",
    });
    // ----------------------------------------------------
    // II. Relasi Dokumen dan User (Tambahan)
    // ----------------------------------------------------
    // Dokumen dibuat oleh satu User
    documents_model_1.default.belongsTo(users_model_1.default, {
        foreignKey: "created_by",
        as: "Creator",
    });
    // Dokumen diupdate oleh satu User
    documents_model_1.default.belongsTo(users_model_1.default, {
        foreignKey: "updated_by",
        as: "Updater",
    });
    // Opsional: Satu User bisa membuat banyak Dokumen
    users_model_1.default.hasMany(documents_model_1.default, {
        foreignKey: "created_by",
        as: "createdDocuments",
    });
    // Opsional: Satu User bisa mengupdate banyak Dokumen
    users_model_1.default.hasMany(documents_model_1.default, {
        foreignKey: "updated_by",
        as: "updatedDocuments",
    });
    // ----------------------------------------------------
    // III. Relasi AUDIT LOG dan User  // <-- PENAMBAHAN BARU
    // ----------------------------------------------------
    // 3. Relasi Many-to-One (Banyak AuditLog dimiliki oleh Satu User)
    auditLogs_model_1.default.belongsTo(users_model_1.default, {
        foreignKey: "userId", // Sesuai dengan kolom di AuditLog.ts
        as: "user",
    });
    // 4. Relasi One-to-Many (Satu User bisa memiliki banyak AuditLog)
    users_model_1.default.hasMany(auditLogs_model_1.default, {
        foreignKey: "userId",
        as: "auditLogs",
    });
    console.log("✅ Asosiasi Users dan Roles berhasil disiapkan.");
};
exports.setupAssociations = setupAssociations;
