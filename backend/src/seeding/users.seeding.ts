import Users from "../models/users.model";
import Roles from "../models/roles.model";
import { hashPassword } from "../utils/hash.utils";

export async function seedUsers(): Promise<void> {
  // Cek apakah tabel users sudah memiliki data
  const userCount = await Users.count();
  if (userCount > 0) {
    console.log("ℹ️ Tabel Users sudah terisi. Seeder pengguna dilewati.");
    return;
  }

  console.log("🚀 Tabel Users kosong. Memulai seeding pengguna default...");

  // Ambil semua role dari database untuk mencocokkan ID secara dinamis
  const roles = await Roles.findAll();
  const getRoleIdByName = (name: string): number => {
    const role = roles.find((r) => r.name === name);
    return role ? role.id : 1; // default to viewer
  };

  const usersToSeed = [
    {
      username: "Admin",
      password: "Admin123!",
      roleName: "admin",
      isActive: true,
    },
    {
      username: "Editor",
      password: "Editor123!",
      roleName: "editor",
      isActive: true,
    },
    {
      username: "Viewer",
      password: "Viewer123!",
      roleName: "viewer",
      isActive: true,
    },
  ];

  for (const user of usersToSeed) {
    const roleId = getRoleIdByName(user.roleName);
    const passwordHash = await hashPassword(user.password);

    await Users.create({
      username: user.username,
      password: passwordHash,
      roleId,
      isActive: user.isActive,
      failedAttemptCount: 0,
    });
    console.log(`👤 User '${user.username}' (${user.roleName}) berhasil di-seed.`);
  }
}
