import Roles, { UserRole } from "../models/roles.model";


export async function seedRoles(): Promise<void> {
  const rolesToSeed = [
    { name: UserRole.Viewer },
    { name: UserRole.Editor },
    { name: UserRole.Admin },
  ];

  for (const role of rolesToSeed) {
    await Roles.findOrCreate({
      where: { name: role.name },
      defaults: role,
    });
  }

  console.log("✅ Data Roles (viewer, editor, admin) berhasil dipastikan ada.");
}
