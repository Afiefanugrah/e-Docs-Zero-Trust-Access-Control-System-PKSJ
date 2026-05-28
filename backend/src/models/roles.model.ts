import sequelize from "../config/db.config";
import { Model, DataTypes, Optional, Sequelize } from "sequelize";

export enum UserRole {
  Viewer = "viewer",
  Editor = "editor",
  Admin = "admin",
}

interface RoleAttributes {
  id: number;
  name: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

interface RoleCreationAttributes
  extends Optional<RoleAttributes, "id" | "createdAt" | "updatedAt"> {}

class Roles
  extends Model<RoleAttributes, RoleCreationAttributes>
  implements RoleAttributes
{
  public id!: number;
  public name!: UserRole;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Roles.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.ENUM(...Object.values(UserRole)),
      allowNull: false,
      unique: true,
    },
  },
  {
    sequelize,
    modelName: "Roles",
    tableName: "roles",
    timestamps: true,
    underscored: true,
  }
);

export default Roles;
