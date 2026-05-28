import sequelize from "../config/db.config"; // Import ini tidak diperlukan jika menggunakan fungsi init
import { DataTypes, Model, Optional, Sequelize } from "sequelize";

// 1. Interface untuk Atribut Model AuditLog
export interface AuditLogAttributes {
  id: number;
  userId: number;
  actionType: string;
  tableName?: string;
  recordId?: number;
  ipAddress?: string;
  details?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuditLogCreationAttributes
  extends Optional<AuditLogAttributes, "id" | "createdAt" | "updatedAt"> {}

// 3. Definisi Kelas Model
class AuditLog
  extends Model<AuditLogAttributes, AuditLogCreationAttributes>
  implements AuditLogAttributes
{
  public id!: number;
  public userId!: number;
  public actionType!: string;
  public tableName?: string;
  public recordId?: number;
  public ipAddress?: string;
  public details?: object;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    actionType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    tableName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    recordId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    details: {
      type: DataTypes.JSON,
      allowNull: true,
    },
  },
  {
    sequelize, // Gunakan instance yang dilewatkan
    modelName: "AuditLog",
    tableName: "auditlogs",
    timestamps: true,
    paranoid: false,
  }
);

export default AuditLog; // Export Model Class
