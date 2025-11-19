import express from "express";
const PORT = process.env.PORT;

// Db connettion
import sequelize from "./config/db.config";
import "./models/roles.model";
import "./models/users.model";
import { setupAssociations } from "./models/associations.model";

// ambil file di routes
import usersEndpoint from "./routes/users.route";
import authEndpoint from "./routes/auth.route";

// Middleware
const app = express();
app.use(express.json());

app.use("/api/users", usersEndpoint);
app.use("/api/auth", authEndpoint);

async function initializeServer() {
  try {
    // 3a. Tes Koneksi
    await sequelize.authenticate();
    console.log("✅ Koneksi database berhasil.");

    // 3b. SETUP ASOSIASI (DIPERLUKAN)
    setupAssociations();

    // 3c. SINKRONISASI SKEMA (W A J I B)
    await sequelize.sync({ alter: true });
    console.log("✅ Database disinkronkan. Tabel siap.");

    // 3d. Jalankan Server Express HANYA jika DB siap
    app.listen(PORT, () => {
      console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Gagal memulai server atau inisialisasi database:", error);
    // Hentikan proses jika ada kesalahan fatal
    process.exit(1);
  }
}

// Mulai proses inisialisasi
initializeServer();
