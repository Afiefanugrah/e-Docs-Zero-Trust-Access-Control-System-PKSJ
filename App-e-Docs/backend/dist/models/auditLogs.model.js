"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_config_1 = __importDefault(require("../config/db.config")); // Import ini tidak diperlukan jika menggunakan fungsi init
const sequelize_1 = require("sequelize");
// 3. Definisi Kelas Model
class AuditLog extends sequelize_1.Model {
}
AuditLog.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    actionType: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: false,
    },
    tableName: {
        type: sequelize_1.DataTypes.STRING(50),
        allowNull: true,
    },
    recordId: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
    },
    ipAddress: {
        type: sequelize_1.DataTypes.STRING(45),
        allowNull: true,
    },
    details: {
        type: sequelize_1.DataTypes.JSON,
        allowNull: true,
    },
}, {
    sequelize: db_config_1.default, // Gunakan instance yang dilewatkan
    modelName: "AuditLog",
    tableName: "auditlogs",
    timestamps: true,
    paranoid: false,
});
exports.default = AuditLog; // Export Model Class
