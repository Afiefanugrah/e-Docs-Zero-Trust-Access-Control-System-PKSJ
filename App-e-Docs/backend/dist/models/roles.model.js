"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = void 0;
const db_config_1 = __importDefault(require("../config/db.config"));
const sequelize_1 = require("sequelize");
var UserRole;
(function (UserRole) {
    UserRole["Viewer"] = "viewer";
    UserRole["Editor"] = "editor";
    UserRole["Admin"] = "admin";
})(UserRole || (exports.UserRole = UserRole = {}));
class Roles extends sequelize_1.Model {
}
Roles.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    name: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(UserRole)),
        allowNull: false,
        unique: true,
    },
}, {
    sequelize: db_config_1.default,
    modelName: "Roles",
    tableName: "roles",
    timestamps: true,
    underscored: true,
});
exports.default = Roles;
