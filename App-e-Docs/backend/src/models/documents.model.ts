import { DataTypes, Model, Optional, Options } from "sequelize";
import sequelize from "../config/db.config";

export enum DocumentStatus {
  Draft = "draft",
  Approved = "approved",
  Archived = "archived",
}

export interface DocumentAttributes {
  id: number;
  title: string;
  slug: string;
  description: string;

  // --- Konten Aktif & Workflow ---
  markdown_content: string; // Konten utama yang dapat diedit (di-render ke HTML di frontend).
  status: DocumentStatus; // Status dokumen saat ini (Draft, Approved, Archived).
  version: string; // Nomor versi dokumen (e.g., "1.0", "1.1").

  // --- Audit & File ---
  checksum: string; // Hash konten (SHA256) untuk integritas.
  pdf_path: string | null; // Lokasi file PDF arsip. Bisa null jika status masih Draft.

  // --- Relasi Audit (Foreign Keys) ---
  created_by: number;
  updated_by: number;

  // --- Timestamp ---
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DocumentCreationAttributes
  extends Optional<DocumentAttributes, "id" | "createdAt" | "updatedAt"> {}

// --- 3. Kelas Model Document ---
class Document
  extends Model<DocumentAttributes, DocumentCreationAttributes>
  implements DocumentAttributes
{
  // Implementasi Atribut
  public id!: number;
  public title!: string;
  public slug!: string;
  public description!: string;

  public markdown_content!: string;
  public status!: DocumentStatus;
  public version!: string;

  public checksum!: string;
  public pdf_path!: string | null;

  public created_by!: number;
  public updated_by!: number;

  // Timestamp
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Document.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    markdown_content: {
      // Gunakan LONGTEXT karena konten bisa sangat panjang
      type: DataTypes.TEXT("long"),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...Object.values(DocumentStatus)),
      allowNull: false,
      defaultValue: DocumentStatus.Draft,
    },
    version: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: "1.0",
    },
    checksum: {
      type: DataTypes.STRING(64), // SHA256 memiliki panjang 64 karakter heksadesimal
      allowNull: false,
    },
    pdf_path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    updated_by: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    sequelize,
    modelName: "Documents",
    tableName: "documents",
    timestamps: true,
    underscored: true,
    paranoid: false,
  }
);

export default Document;
