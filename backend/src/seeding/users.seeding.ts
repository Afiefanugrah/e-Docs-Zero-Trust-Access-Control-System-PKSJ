import Users from "../models/users.model";
import Roles from "../models/roles.model";
import { hashPassword } from "../utils/hash.utils";

export async function seedUsers(): Promise<void> {
  // Ambil semua role dari database untuk mencocokkan ID secara dinamis
  const roles = await Roles.findAll();
  const getRoleIdByName = (name: string): number => {
    const role = roles.find((r) => r.name === name);
    return role ? role.id : 1; // default to viewer
  };

  const usersToSeed = [
    {
      username: "admin",
      password: "Admin123!",
      roleName: "admin",
      isActive: true,
    },
    {
      username: "editor",
      password: "Editor123!",
      roleName: "editor",
      isActive: true,
    },
    {
      username: "viewer",
      password: "Viewer123!",
      roleName: "viewer",
      isActive: true,
    },
  ];

  for (const user of usersToSeed) {
    const roleId = getRoleIdByName(user.roleName);
    const passwordHash = await hashPassword(user.password);

    // Cari apakah user sudah ada
    const existingUser = await Users.findOne({ where: { username: user.username } });
    if (!existingUser) {
      await Users.create({
        username: user.username,
        password: passwordHash,
        roleId,
        isActive: user.isActive,
        failedAttemptCount: 0,
      });
      console.log(`👤 User '${user.username}' (${user.roleName}) berhasil di-seed.`);
    } else {
      console.log(`👤 User '${user.username}' sudah ada.`);
    }
  }
}
