# e-Docs: Zero Trust Access Control & Secure Document Management System

e-Docs adalah platform manajemen dokumen digital berbasis web yang dirancang dengan prinsip **Zero Trust Architecture** dan sistem pengendalian akses berbasis peran (**Role-Based Access Control / RBAC**). Sistem ini berfokus pada pengamanan data sensitif, verifikasi berkelanjutan, dan pencatatan jejak audit secara *real-time* untuk mencegah ancaman kebocoran data dan akses tidak sah.

---

## 🔒 Fitur Keamanan & Implementasi Zero Trust

* **Continuous Authentication & Client-Side Verification:** 
  * Setiap request diverifikasi oleh middleware token JWT.
  * Dilengkapi pengecekan kedaluwarsa token di sisi klien secara instan ([utils/auth.ts](file:///home/afiefanugrah/Dokumen/Projects/kulia/Pksj/frontend/utils/auth.ts)) untuk mencegah *redirect loop* dan mengarahkan pengguna secara otomatis ke halaman login dengan SweetAlert2 jika sesi berakhir.
* **XSS Mitigation (Secure Storage):**
  * Token otentikasi disimpan dalam `sessionStorage` (bukan `localStorage`) untuk mengurangi masa exposure window dari serangan XSS persisten.
* **Role-Based Access Control (RBAC):** Hak akses pengguna diklasifikasikan secara ketat menjadi tiga tingkatan untuk membatasi ruang lingkup kerja:
  * `admin`: Akses ke Panel Admin, Manajemen Status Aktif Pengguna (Lock/Unlock), Hapus Pengguna, serta audit logs.
  * `editor`: Membuat, mengubah, dan mengunggah konten dokumen.
  * `viewer`: Hanya diizinkan membaca dokumen global.
* **Defensive Security & Account Lockout:** 
  * Percobaan masuk yang salah secara berulang (maksimal 3 kali) akan memicu penguncian akun secara otomatis (`isActive = false`).
* **Mass Assignment Protection:**
  * Endpoint pembaruan dokumen disaring menggunakan whitelist atribut (`title`, `description`, `markdown_content`) sehingga mencegah serangan parameter injection pada *status* dan *version*.
* **Comprehensive Audit Trail & Robust DB Logging:**
  * Setiap aktivitas dicatat mendalam di tabel `auditlogs`. Log kegagalan login dan token palsu dirancang dengan penanganan error database yang tangguh (menggunakan *fallback* nullable `userId`) untuk menghindari kegagalan *foreign key constraint* yang dapat menyebabkan server crash.

---

## 📂 Struktur Repositori (Monorepo Setup)

```text
📦 e-Docs-Zero-Trust-Access-Control-System
 ┣ 📂 backend       --> Aplikasi Server (Node.js, TypeScript, Express, Sequelize MySQL)
 ┣ 📂 frontend      --> Halaman Klien (Next.js App Router, Tailwind CSS, SweetAlert2)
 ┗ 📜 README.md     --> Dokumentasi Utama Proyek
```

---

## 🛠️ Teknologi yang Digunakan

### Backend (Server)
* **Runtime & Bahasa:** Node.js & TypeScript
* **Framework:** Express.js
* **ORM & Database:** Sequelize & MySQL / MariaDB

### Frontend (Client)
* **Framework & Bahasa:** Next.js (App Router) & TypeScript
* **Styling & UI Components:** Tailwind CSS, React Icons, React Markdown (rehype-raw)
* **Popups & Alerts:** SweetAlert2

---

## 🚀 Panduan Memulai (Setup & Run)

### 1. Prasyarat Sistem
* Node.js (v18 atau lebih baru)
* MySQL / MariaDB Server berjalan aktif

### 2. Menjalankan Backend

1. Buka folder `backend`:
   ```bash
   cd backend
   ```
2. Buat file `.env` di dalam folder `backend/` dan sesuaikan kredensial databasemu:
   ```env
   PORT=3200
   DB_HOST=localhost
   DB_USER=root
   DB_PASS=password_kamu
   DB_NAME=db_e-Docs
   DB_DIALECT=mysql
   JWT_SECRET=rahasia_super_aman_bebas_tulis_apa_aja
   JWT_EXPIRES_IN=10m
   ```
3. Instal dependensi:
   ```bash
   npm install
   ```
4. Jalankan server dalam mode pengembangan:
   ```bash
   npm run dev
   ```

### 3. Menjalankan Frontend

1. Buka folder `frontend`:
   ```bash
   cd frontend
   ```
2. Buat file `.env.local` di dalam folder `frontend/`:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:3200/api
   ```
3. Instal dependensi:
   ```bash
   npm install
   ```
4. Jalankan aplikasi frontend dalam mode pengembangan:
   ```bash
   npm run dev
   ```
5. Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

---

## 🧪 Skrip Pengujian Otomatis (Automated Tests)

Platform ini dilengkapi dengan pengujian otomatis untuk memvalidasi keamanan dan ketangguhan sistem:

* **Security Integration Test:**
  * Menguji perlindungan endpoint publik, deteksi token palsu, kontrol akses RBAC, pencegahan eksploitasi parameter (Mass Assignment), dan logging.
  * Jalankan di folder `backend`:
    ```bash
    npx ts-node -r dotenv/config src/security-test.ts
    ```
* **UI Session Expiration Test (Puppeteer):**
  * Menguji skenario login otomatis, menunggu waktu kedaluwarsa sesi secara presisi, deteksi pop-up peringatan, dan pengalihan kembali ke login secara otomatis.
  * Jalankan di folder `frontend/scratch` atau dari root menggunakan node:
    ```bash
    node scratch/test-session.js
    ```

---

## 📈 Perkembangan Status Proyek (To-Do List)

* [x] Perbaikan komponen UI/UX untuk integrasi halaman Dashboard Admin (Premium Sidebar & Indikator Zero Trust).
* [x] Optimalisasi manajemen state dan client-side check saat penanganan token JWT kedaluwarsa.
* [x] Pembenahan visualisasi tabel data dan integrasi Audit Log terperinci untuk Admin.
* [x] Penambahan modul tes keamanan otomatis terpadu (Mass Assignment, RBAC, dan Session Expirations).

Dokumentasi ini disusun sebagai bagian dari pemenuhan proyek sistem keamanan perangkat lunak (**PKSJ**).
