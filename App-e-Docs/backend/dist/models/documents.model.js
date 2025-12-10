"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentStatus = void 0;
const sequelize_1 = require("sequelize");
const db_config_1 = __importDefault(require("../config/db.config"));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["Draft"] = "draft";
    DocumentStatus["Approved"] = "approved";
    DocumentStatus["Archived"] = "archived";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
// --- 3. Kelas Model Document ---
class Document extends sequelize_1.Model {
}
Document.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: false,
    },
    slug: {
        type: sequelize_1.DataTypes.STRING(255),
        unique: true,
        allowNull: false,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    markdown_content: {
        // Gunakan LONGTEXT karena konten bisa sangat panjang
        type: sequelize_1.DataTypes.TEXT("long"),
        allowNull: false,
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(DocumentStatus)),
        allowNull: false,
        defaultValue: DocumentStatus.Draft,
    },
    version: {
        type: sequelize_1.DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "1.0",
    },
    checksum: {
        type: sequelize_1.DataTypes.STRING(64), // SHA256 memiliki panjang 64 karakter heksadesimal
        allowNull: false,
    },
    pdf_path: {
        type: sequelize_1.DataTypes.STRING(255),
        allowNull: true,
    },
    created_by: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
    updated_by: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        references: {
            model: "users",
            key: "id",
        },
    },
}, {
    sequelize: db_config_1.default,
    modelName: "Documents",
    tableName: "documents",
    timestamps: true,
    underscored: true,
    paranoid: false,
});
exports.default = Document;
