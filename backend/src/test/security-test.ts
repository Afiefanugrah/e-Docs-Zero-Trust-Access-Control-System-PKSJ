import sequelize from "../config/db.config";
import Users from "../models/users.model";
import Roles from "../models/roles.model";
import Documents from "../models/documents.model";
import { setupAssociations } from "../models/associations.model";
import { hashPassword } from "../utils/hash.utils";

const BACKEND_URL = "http://localhost:3200";

async function runTests() {
  console.log("🔍 Memulai Security & Configuration Test Suite...");

  try {
    // 1. Inisialisasi Database
    await sequelize.authenticate();
    setupAssociations();

    // Clean up data uji lama jika ada
    await Documents.destroy({ where: { slug: ["test-doc-title", "updated-doc-title"] } });
    await Users.destroy({ where: { username: ["Test_Viewer_User", "Test_Admin_User"] } });

    // 2. Buat Test Users
    const passwordHash = await hashPassword("Password123!");
    const viewerUser = await Users.create({
      username: "Test_Viewer_User",
      password: passwordHash,
      roleId: 1, // viewer
      isActive: true,
      failedAttemptCount: 0,
    });

    const adminUser = await Users.create({
      username: "Test_Admin_User",
      password: passwordHash,
      roleId: 3, // admin
      isActive: true,
      failedAttemptCount: 0,
    });

    console.log("✅ Data uji (Test Users) berhasil disiapkan di database.");

    let viewerToken = "";
    let adminToken = "";

    // TEST 1: Endpoint Proteksi Tanpa Token
    console.log("\n--- TEST 1: Proteksi Endpoint Publik ---");
    const resUsersNoToken = await fetch(`${BACKEND_URL}/api/users/all`);
    console.log(`GET /api/users/all (Tanpa Token): ${resUsersNoToken.status} (Expected: 401)`);
    if (resUsersNoToken.status !== 401) throw new Error("Gagal: Endpoint tidak terproteksi!");

    const resAuditNoToken = await fetch(`${BACKEND_URL}/api/audit/all`);
    console.log(`GET /api/audit/all (Tanpa Token): ${resAuditNoToken.status} (Expected: 401)`);
    if (resAuditNoToken.status !== 401) throw new Error("Gagal: Endpoint tidak terproteksi!");

    // TEST 2: Otentikasi Gagal dengan Token Palsu
    console.log("\n--- TEST 2: Deteksi Token Palsu ---");
    const resFakeToken = await fetch(`${BACKEND_URL}/api/users/all`, {
      headers: { Authorization: "Bearer token_palsu_123" }
    });
    console.log(`GET /api/users/all (Token Palsu): ${resFakeToken.status} (Expected: 401)`);
    if (resFakeToken.status !== 401) throw new Error("Gagal: Token palsu tidak terdeteksi!");

    // TEST 3: Login & Perolehan JWT Token
    console.log("\n--- TEST 3: Login Pengguna & JWT Issue ---");
    const loginViewerRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Test_Viewer_User", password: "Password123!" })
    });
    const loginViewerData = await loginViewerRes.json();
    viewerToken = loginViewerData.data?.token;
    console.log(`Login Viewer: ${loginViewerRes.status} (Expected: 200)`);
    if (!viewerToken) throw new Error("Gagal: Token viewer tidak didapatkan!");

    const loginAdminRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Test_Admin_User", password: "Password123!" })
    });
    const loginAdminData = await loginAdminRes.json();
    adminToken = loginAdminData.data?.token;
    console.log(`Login Admin: ${loginAdminRes.status} (Expected: 200)`);
    if (!adminToken) throw new Error("Gagal: Token admin tidak didapatkan!");

    // TEST 4: RBAC (Role-Based Access Control)
    console.log("\n--- TEST 4: Pengujian RBAC (Access Control) ---");
    const resUsersViewer = await fetch(`${BACKEND_URL}/api/users/all`, {
      headers: { Authorization: `Bearer ${viewerToken}` }
    });
    console.log(`Viewer mengakses /api/users/all: ${resUsersViewer.status} (Expected: 403)`);
    if (resUsersViewer.status !== 403) throw new Error("Gagal: Viewer diizinkan mengakses data user!");

    const resUsersAdmin = await fetch(`${BACKEND_URL}/api/users/all`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Admin mengakses /api/users/all: ${resUsersAdmin.status} (Expected: 200)`);
    if (resUsersAdmin.status !== 200) throw new Error("Gagal: Admin tidak bisa mengakses data user!");

    const resAuditViewer = await fetch(`${BACKEND_URL}/api/audit/all`, {
      headers: { Authorization: `Bearer ${viewerToken}` }
    });
    console.log(`Viewer mengakses /api/audit/all: ${resAuditViewer.status} (Expected: 403)`);
    if (resAuditViewer.status !== 403) throw new Error("Gagal: Viewer diizinkan mengakses audit logs!");

    // TEST 5: Proteksi Pembuatan Dokumen
    console.log("\n--- TEST 5: Proteksi Pembuatan Dokumen ---");
    const createDocViewerRes = await fetch(`${BACKEND_URL}/api/document/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${viewerToken}`
      },
      body: JSON.stringify({ title: "Test Doc Title", markdown_content: "# Test Content" })
    });
    console.log(`Viewer membuat dokumen: ${createDocViewerRes.status} (Expected: 403)`);
    if (createDocViewerRes.status !== 403) throw new Error("Gagal: Viewer diizinkan membuat dokumen!");

    const createDocAdminRes = await fetch(`${BACKEND_URL}/api/document/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ title: "Test Doc Title", markdown_content: "# Test Content" })
    });
    console.log(`Admin membuat dokumen: ${createDocAdminRes.status} (Expected: 201)`);
    if (createDocAdminRes.status !== 201) throw new Error("Gagal: Admin tidak bisa membuat dokumen!");
    const createDocAdminData = await createDocAdminRes.json();
    const createdSlug = createDocAdminData.data?.slug;

    // TEST 6: Proteksi Mass Assignment (Pencegahan Parameter Injection)
    console.log("\n--- TEST 6: Proteksi Mass Assignment (Parameter Injection) ---");
    // Coba kirim data update dengan field 'status' = 'Approved' dan 'version' = '99.0' yang diproteksi
    const updateDocRes = await fetch(`${BACKEND_URL}/api/document/update/${createdSlug}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: "Updated Doc Title",
        markdown_content: "# Updated Content",
        status: "Approved", // ⚠️ Terlarang (Hanya lewat workflow)
        version: "99.0" // ⚠️ Terlarang (Hanya lewat versioning)
      })
    });
    console.log(`Admin mengupdate dokumen: ${updateDocRes.status} (Expected: 200)`);
    if (updateDocRes.status !== 200) throw new Error("Gagal mengupdate dokumen!");

    // Ambil detail dokumen setelah diupdate untuk memverifikasi proteksi mass assignment
    const verifyDocRes = await fetch(`${BACKEND_URL}/api/document/slug/updated-doc-title`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifyDocData = await verifyDocRes.json();
    const docAfterUpdate = verifyDocData.data;

    console.log(`Verify Title setelah Update: "${docAfterUpdate.title}" (Expected: "Updated Doc Title")`);
    console.log(`Verify Status setelah Update: "${docAfterUpdate.status}" (Expected: "draft")`);
    console.log(`Verify Version setelah Update: "${docAfterUpdate.version}" (Expected: "1.0")`);

    if (docAfterUpdate.title !== "Updated Doc Title") throw new Error("Gagal: Judul tidak terupdate!");
    if (docAfterUpdate.status === "Approved") throw new Error("🚨 SECURITY BREACH: Celah Mass Assignment Masih Ada! Status berhasil dimanipulasi!");
    if (docAfterUpdate.version === "99.0") throw new Error("🚨 SECURITY BREACH: Celah Mass Assignment Masih Ada! Versi berhasil dimanipulasi!");
    
    console.log("🛡️ PROTEKSI MASS ASSIGNMENT SUKSES! Parameter 'status' dan 'version' ditolak dan disaring dengan aman.");

    // TEST 7: User Toggle Active Status (PUT /api/users/toggle-active/:id)
    console.log("\n--- TEST 7: Pengujian Toggle Status Aktif User ---");
    // Admin menonaktifkan viewer
    const toggleViewerRes = await fetch(`${BACKEND_URL}/api/users/toggle-active/${viewerUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false })
    });
    console.log(`Admin toggle status viewer menjadi nonaktif: ${toggleViewerRes.status} (Expected: 200)`);
    if (toggleViewerRes.status !== 200) throw new Error("Gagal: Admin tidak dapat mengubah status pengguna!");

    // Coba viewer mengakses endpoint (seharusnya gagal karena dinonaktifkan)
    const loginViewerAgainRes = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "Test_Viewer_User", password: "Password123!" })
    });
    console.log(`Viewer login setelah dinonaktifkan: ${loginViewerAgainRes.status} (Expected: 403)`);
    if (loginViewerAgainRes.status !== 403) throw new Error("Gagal: User nonaktif masih bisa login!");

    // Kembalikan viewer menjadi aktif agar test cleanup/delete berjalan bersih
    const toggleViewerBackRes = await fetch(`${BACKEND_URL}/api/users/toggle-active/${viewerUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: true })
    });
    console.log(`Admin mengembalikan status viewer menjadi aktif: ${toggleViewerBackRes.status} (Expected: 200)`);

    // Admin mencoba menonaktifkan dirinya sendiri (Proteksi Keamanan)
    const toggleSelfRes = await fetch(`${BACKEND_URL}/api/users/toggle-active/${adminUser.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ isActive: false })
    });
    console.log(`Admin mencoba menonaktifkan diri sendiri: ${toggleSelfRes.status} (Expected: 403)`);
    if (toggleSelfRes.status !== 403) throw new Error("🚨 SECURITY BREACH: Admin diizinkan menonaktifkan dirinya sendiri!");

    // TEST 8: Document Deletion (DELETE /api/document/slug/:slug)
    console.log("\n--- TEST 8: Pengujian Hapus Dokumen ---");
    // Viewer mencoba menghapus dokumen
    const deleteDocViewerRes = await fetch(`${BACKEND_URL}/api/document/slug/updated-doc-title`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${viewerToken}` }
    });
    console.log(`Viewer mencoba menghapus dokumen: ${deleteDocViewerRes.status} (Expected: 403)`);
    if (deleteDocViewerRes.status !== 403) throw new Error("🚨 SECURITY BREACH: Viewer diizinkan menghapus dokumen!");

    // Admin menghapus dokumen
    const deleteDocAdminRes = await fetch(`${BACKEND_URL}/api/document/slug/updated-doc-title`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Admin menghapus dokumen: ${deleteDocAdminRes.status} (Expected: 200)`);
    if (deleteDocAdminRes.status !== 200) throw new Error("Gagal: Admin tidak bisa menghapus dokumen!");

    // Verifikasi dokumen sudah terhapus (seharusnya 404)
    const verifyDocDeletedRes = await fetch(`${BACKEND_URL}/api/document/slug/updated-doc-title`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Verifikasi dokumen terhapus: ${verifyDocDeletedRes.status} (Expected: 404)`);
    if (verifyDocDeletedRes.status !== 404) throw new Error("Gagal: Dokumen masih ada di database setelah dihapus!");

    // TEST 9: User Deletion (DELETE /api/users/delete/:id)
    console.log("\n--- TEST 9: Pengujian Hapus Pengguna (User Deletion) ---");
    // Viewer mencoba menghapus viewer user
    const deleteUserViewerRes = await fetch(`${BACKEND_URL}/api/users/delete/${viewerUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${viewerToken}` }
    });
    console.log(`Viewer mencoba menghapus user: ${deleteUserViewerRes.status} (Expected: 403)`);
    if (deleteUserViewerRes.status !== 403) throw new Error("🚨 SECURITY BREACH: Viewer diizinkan menghapus user!");

    // Admin menghapus viewer user
    const deleteUserAdminRes = await fetch(`${BACKEND_URL}/api/users/delete/${viewerUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`Admin menghapus user: ${deleteUserAdminRes.status} (Expected: 200)`);
    if (deleteUserAdminRes.status !== 200) throw new Error("Gagal: Admin tidak bisa menghapus user!");

    // Verifikasi user terhapus dengan mencari di database
    const findDeletedUser = await Users.findByPk(viewerUser.id);
    console.log(`Verifikasi user terhapus di DB: ${findDeletedUser === null ? "Tidak ditemukan" : "Masih ada"} (Expected: Tidak ditemukan)`);
    if (findDeletedUser !== null) throw new Error("Gagal: User masih ada di database setelah dihapus!");

  } catch (error) {
    console.error("\n❌ UJI KEAMANAN GAGAL:", error);
    process.exit(1);
  } finally {
    // 7. Bersihkan Data Test
    console.log("\n--- CLEAN UP ---");
    await Documents.destroy({ where: { slug: ["test-doc-title", "updated-doc-title"] } });
    await Users.destroy({ where: { username: ["Test_Viewer_User", "Test_Admin_User"] } });
    console.log("🧹 Data uji berhasil dibersihkan dari database.");
    await sequelize.close();
  }

  console.log("\n🎉 SELURUH SKENARIO SECURITY TEST SELESAI DENGAN SUKSES! SISTEM 100% AMAN.");
}

runTests();
