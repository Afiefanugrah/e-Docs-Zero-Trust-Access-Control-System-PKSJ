// src/test.ts

import * as dotenv from "dotenv";
dotenv.config();

import sequelize from "./config/db.config";
import Roles, { UserRole } from "./models/roles.model";
import Users from "./models/users.model";
import { setupAssociations } from "./models/associations.model";
// Pastikan path ke file associations.model sudah benar

async function seedRoles() {
  try {
    // 1. Tes Koneksi
    await sequelize.authenticate();
    console.log("✅ Koneksi database berhasil.");

    // 2. Setup Asosiasi (Harus dipanggil sebelum sync)
    setupAssociations();

    // 3. Sinkronisasi Database (Membuat atau mengupdate semua tabel)
    await sequelize.sync({ alter: true });
    console.log("✅ Database disinkronkan. Tabel Roles dan Users siap.");

    // 4. Seeding: Membuat data Roles jika belum ada
    const roleCount = await Roles.count();
    if (roleCount === 0) {
      await Roles.bulkCreate([
        { name: UserRole.Admin },
        { name: UserRole.Editor },
        { name: UserRole.Viewer },
      ]);
      console.log(
        "🎉 3 Peran default (Admin, Editor, Viewer) berhasil ditambahkan."
      );
    } else {
      console.log(
        `ℹ️ Tabel Roles sudah berisi ${roleCount} data. Seeding dilewati.`
      );
    }

    // Contoh Seeding User Pertama (Opsional: hanya untuk testing)
    const userCount = await Users.count();
    if (userCount === 0) {
      // Asumsi: Admin adalah roleId = 1 (jika PK dimulai dari 1)
      await Users.create({
        username: "admin.utama",
        passwordHash: "$2a$10$XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Ganti dengan hash bcrypt sungguhan!
        roleId: 1,
        isActive: true,
      });
      console.log("🎉 Pengguna Admin pertama berhasil ditambahkan. Role ID 1.");
    }
  } catch (error) {
    console.error("❌ Gagal menjalankan seeding/test:", error);
    process.exit(1);
  } finally {
    // Hentikan proses setelah selesai
    process.exit(0);
  }
}

seedRoles();
