# e-Docs Backend: REST API Server

Dokumentasi ini menjelaskan konfigurasi, model database, endpoint REST API, dan fitur-fitur keamanan yang diimplementasikan pada server **e-Docs** yang dibangun menggunakan **Node.js, TypeScript, Express, Sequelize ORM, dan MySQL / MariaDB**.

---

## 🔒 Fitur Keamanan Utama (Backend Security)

1.  **Proteksi Bruteforce & Account Lockout**:
    *   Setiap kali pengguna gagal login, kolom `failedAttemptCount` pada tabel `users` akan bertambah.
    *   Jika jumlah kegagalan login mencapai **3 kali** (`MAX_FAILED_ATTEMPTS = 3`), status akun otomatis dinonaktifkan (`isActive = false`). Akun harus diaktifkan kembali oleh Admin melalui Panel Admin.
2.  **Keamanan Jejak Audit Tangguh (Constraint Safety)**:
    *   Semua aktivitas dicatat di tabel `auditlogs` dengan relasi kunci asing (*foreign key*) yang aman ke tabel `users`.
    *   Middleware autentikasi menggunakan penanganan kesalahan log khusus yang menangkap `SequelizeForeignKeyConstraintError` dan melakukan *retry* otomatis dengan `userId = null` jika token palsu atau user tidak dikenal memicu pelanggaran integritas kunci asing.
3.  **Proteksi Mass Assignment**:
    *   Proses pembaruan dokumen menyaring properti request secara defensif dengan hanya mengizinkan *whitelist* field (`title`, `description`, `markdown_content`, `version`), sehingga mencegah penyerang mengubah *status* persetujuan secara ilegal melalui injeksi body request.
4.  **Middleware Autentikasi & Otorisasi Peran (RBAC)**:
    *   [auth.middleware.ts](file:///home/afiefanugrah/Dokumen/Projects/kulia/Pksj/backend/src/middleware/auth.middleware.ts) memverifikasi tanda tangan token JWT menggunakan `process.env.JWT_SECRET` dan melakukan pengecekan otoritas tingkat lanjut sebelum memberikan akses ke endpoint yang dilindungi.

---

## 📂 Struktur Database & Model (Sequelize ORM)

Platform ini mengelola empat model utama dengan asosiasi berikut:
*   `Roles` (id, name): Memetakan 3 peran utama (`admin`, `editor`, `viewer`).
*   `Users` (id, username, password, roleId, failedAttemptCount, isActive): Mengelola data akun dan status login.
*   `Documents` (id, title, slug, description, markdown_content, status, version, creatorId): Dokumen yang dibuat oleh editor/admin.
*   `AuditLogs` (id, userId, actionType, tableName, recordId, ipAddress, details): Log audit aktivitas.

---

## 🔗 Daftar API Endpoints

### 1. Autentikasi (`/api/auth`)
*   `POST /api/auth/login`: Masuk ke sistem dan mendapatkan JWT token.
*   `POST /api/auth/logout`: Keluar sistem dan mencatat log audit logout.
*   `GET /api/auth/me`: Memverifikasi token aktif dan mengambil data profil pengguna.

### 2. Manajemen Pengguna (`/api/users`) - *Hanya Admin*
*   `GET /api/users/all`: Mengambil daftar seluruh pengguna terdaftar.
*   `POST /api/users/register`: Membuat/mendaftarkan akun pengguna baru dengan peran tertentu.
*   `PUT /api/users/toggle-active/:id`: Mengaktifkan (`isActive = true`) atau mengunci akses akun pengguna.
*   `DELETE /api/users/delete/:id`: Menghapus data akun pengguna (kecuali akun diri sendiri).

### 3. Manajemen Dokumen (`/api/document`)
*   `GET /api/document/all`: Mengambil daftar seluruh dokumen global yang tersedia. (Akses: Semua)
*   `POST /api/document/create`: Membuat dokumen draft baru. (Akses: Admin, Editor)
*   `GET /api/document/slug/:slug`: Mengambil detail konten dokumen lengkap dalam format Markdown. (Akses: Semua)
*   `PUT /api/document/update/:slug`: Memperbarui judul, versi, deskripsi, dan konten utama dokumen. (Akses: Admin, Editor)
*   `DELETE /api/document/slug/:slug`: Menghapus dokumen dari database secara permanen. (Akses: Admin)

### 4. Audit Trail (`/api/audit`) - *Hanya Admin*
*   `GET /api/audit/all`: Mengambil rekaman log jejak aktivitas sistem secara kronologis.

---

## 🧪 Cara Menjalankan Uji Keamanan Otomatis

Untuk memvalidasi kekokohan pertahanan backend Anda dari celah kebocoran data, jalankan rangkaian tes integrasi di folder `backend`:
```bash
npx ts-node -r dotenv/config src/security-test.ts
```
Rangkaian tes ini secara otomatis menguji endpoint publik, penolakan token palsu, kegagalan otorisasi RBAC, penolakan Mass Assignment parameter, serta validitas database logging.
