import sequelize from "./config/db.config";
import { setupAssociations } from "./models/associations.model";
import { seedRoles } from "./seeding/roles.seeding";
import { seedUsers } from "./seeding/users.seeding";
import Users from "./models/users.model";

async function runExplicitSeed() {
  console.log("🔄 Memulai manual database reset & seeding...");
  try {
    await sequelize.authenticate();
    setupAssociations();

    // Kosongkan tabel users agar seeder pasti berjalan
    console.log("🧹 Mengosongkan tabel Users...");
    await Users.destroy({ where: {}, force: true });

    // Jalankan seeding
    await seedRoles();
    await seedUsers();

    console.log("🎉 Database seeding selesai dengan sukses!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal menjalankan manual seed:", error);
    process.exit(1);
  }
}

runExplicitSeed();
