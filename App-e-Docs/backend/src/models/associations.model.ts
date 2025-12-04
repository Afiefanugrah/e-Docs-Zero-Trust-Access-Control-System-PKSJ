// src/models/associations.model.ts

import Users from "./users.model";
import Roles from "./roles.model";
import Document from "./documents.model";

export const setupAssociations = () => {
  // 1. Relasi One-to-Many (One Role has Many Users)
  Roles.hasMany(Users, {
    foreignKey: "roleId",
    as: "users",
    onDelete: "RESTRICT",
  });

  // 2. Relasi Many-to-One (Many Users belong to One Role)
  Users.belongsTo(Roles, {
    foreignKey: "roleId",
    as: "role",
  });

  // ----------------------------------------------------
  // II. Relasi Dokumen dan User (Tambahan)
  // ----------------------------------------------------

  // Dokumen dibuat oleh satu User
  Document.belongsTo(Users, {
    foreignKey: "created_by",
    as: "Creator",
  });

  // Dokumen diupdate oleh satu User
  Document.belongsTo(Users, {
    foreignKey: "updated_by",
    as: "Updater",
  });

  // Opsional: Satu User bisa membuat banyak Dokumen
  Users.hasMany(Document, {
    foreignKey: "created_by",
    as: "createdDocuments",
  });

  // Opsional: Satu User bisa mengupdate banyak Dokumen
  Users.hasMany(Document, {
    foreignKey: "updated_by",
    as: "updatedDocuments",
  });

  console.log("✅ Asosiasi Users dan Roles berhasil disiapkan.");
};
