# e-Docs: Zero Trust Access Control & Secure Document Management System

e-Docs adalah platform manajemen dokumen digital berbasis web yang dirancang dengan prinsip **Zero Trust Architecture** dan sistem pengendalian akses berbasis peran (**Role-Based Access Control / RBAC**). Sistem ini berfokus pada pengamanan data sensitif, verifikasi berkelanjutan, dan pencatatan jejak audit secara *real-time* untuk mencegah ancaman kebocoran data dan akses tidak sah.

---

## 🔒 Fitur Keamanan Utama (Pilar Zero Trust)

* **Continuous Authentication & Verification:** Setiap *request* dari pengguna diverifikasi secara ketat melalui lapisan *middleware* untuk memastikan validitas token JWT, keaktifan akun, dan kecocokan hak akses.
* **Role-Based Access Control (RBAC):** Hak akses pengguna diklasifikasikan secara ketat menjadi tiga tingkatan (*enum*) untuk membatasi ruang lingkup kerja:
  * `admin`: Manajemen akun pengguna, kontrol penuh dokumen, dan pemantauan sistem.
  * `editor`: Mengunggah, memperbarui, dan mengelola dokumen spesifik.
  * `viewer`: Hanya diizinkan melihat dokumen yang dibagikan tanpa hak mengubah konfigurasi.
* **Defensive Security & Account Lockout:** Dilengkapi fitur pencatatan kegagalan login (`failedAttemptCount`). Jika terdeteksi percobaan masuk yang salah secara berulang (indikasi *Brute Force*), sistem akan mengunci akun secara otomatis (`isActive = false`).
* **Comprehensive Audit Trail:** Setiap aktivitas di dalam sistem—baik aksi yang sukses maupun gagal (seperti `REGISTRATION_FAILED`)—akan dicatat mendalam di tabel log audit (mencakup data pelaku, jenis aksi, tabel terdampak, alamat IP, hingga detail kegagalan).

---

## 📂 Struktur Repositori (Monorepo Setup)

```text
📦 e-Docs-Zero-Trust-Access-Control-System
 ┣ 📂 backend       --> Aplikasi Server (Node.js, TypeScript, Express, Sequelize MySQL)
 ┣ 📂 frontend      --> Aplikasi Klien (Next.js) [In Development 🛠️]
 ┗ 📜 README.md     --> Dokumentasi Utama Proyek
```


## 🛠️ Teknologi yang Digunakan

### Backend (Server)

* **Runtime & Bahasa:** Node.js & TypeScript
* **Framework:** Express.js
* **ORM & Database:** Sequelize & MySQL / MariaDB
* **Keamanan & Log:** JWT (JSON Web Token), IP-Tracking, `dotenv` untuk manajemen variabel lingkungan.

### Frontend (Client)

* Next.js / React, TypeScript, Tailwind CSS *(Sedang dalam tahap pengembangan & perbaikan komponen)*.

## 🚀 Panduan Memulai (Cara Menjalankan Backend)

### 1. Prasyarat Sistem

* Node.js (Disarankan v20 atau versi terbaru)
* MySQL Server berjalan lokal atau *remote*

### 2. Konfigurasi Variabel Lingkungan (`.env`)

Buat file `.env` di dalam folder `backend/` dan sesuaikan kredensial databasemu:

**Cuplikan kode**

```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=password_kamu
DB_NAME=edocs_zerotrust
DB_DIALECT=mysql
JWT_SECRET=rahasia_super_aman_kamu
```

### 3. Instalasi Dependensi

Masuk ke folder backend dan instal semua *library* yang dibutuhkan:

**Bash**

```
cd backend
npm install
```

### 4. Menjalankan Aplikasi

#### Mode Pengembangan (Development)

Untuk menjalankan server dengan fitur *auto-reload* menggunakan `nodemon` dan `ts-node`:

**Bash**

```
bash
npm run dev
```

#### Mode Produksi (Production Build & Start)

Untuk melakukan kompilasi dari TypeScript ke JavaScript murni yang ringan, lalu menjalankannya dengan aman bersama proteksi pemuatan `.env`:

**Bash**

```
bash
npm run build
npm run start
```

*Perintah `start` telah dioptimalkan menggunakan flag `node -r dotenv/config` untuk menjamin variabel lingkungan disuntikkan dengan sempurna sebelum inisialisasi database.*

## 📈 Pengembangan Selanjutnya (To-Do List Frontend)

* [ ]  Perbaikan komponen UI/UX untuk integrasi halaman Dashboard Admin.
* [ ]  Optimalisasi manajemen *state* saat penanganan token JWT kadaluwarsa.
* [ ]  Pembenahan visualisasi grafik Log Audit untuk Admin.

Dokumentasi ini disusun sebagai bagian dari pemenuhan proyek sistem keamanan perangkat lunak (**PKSJ**).

```

---

Setelah kamu simpan teks di atas ke dalam file `README.md`, kamu tinggal push dengan perintah Git seperti biasa agar halaman depan reponya langsung berubah rapi:

```bash
git add README.md
git commit -m "docs: implement professional README format"
git push origin main
```
