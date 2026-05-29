# e-Docs Frontend: Next.js Client Application

Halaman ini berisi dokumentasi spesifik untuk aplikasi klien **e-Docs** yang dibangun menggunakan **Next.js 16 (App Router)**, **TypeScript**, **Tailwind CSS**, dan **SweetAlert2**.

---

## 🔒 Implementasi Keamanan & Zero Trust (Frontend)

1.  **Session Storage (Anti-Persistent XSS)**:
    *   Token otentikasi disimpan di `sessionStorage` daripada `localStorage` untuk membatasi ketersediaan token hanya pada tab aktif, mencegah serangan pencurian token jangka panjang.
2.  **Client-side JWT Expiration Checking**:
    *   Setiap halaman melakukan validasi waktu kedaluwarsa token secara lokal menggunakan utility [isTokenExpired](file:///home/afiefanugrah/Dokumen/Projects/kulia/Pksj/frontend/utils/auth.ts) sebelum memuat data halaman atau melakukan pengalihan. Ini mencegah *redirect loops* dan memberikan navigasi yang mulus.
3.  **Graceful Session Termination**:
    *   Jika request ke API backend mengembalikan status `401 Unauthorized` (Token kedaluwarsa atau dimanipulasi), klien akan langsung memanggil helper [handleSessionExpired](file:///home/afiefanugrah/Dokumen/Projects/kulia/Pksj/frontend/utils/auth.ts). Ini akan membersihkan seluruh storage, menampilkan peringatan SweetAlert2 yang ramah pengguna, dan mengalihkan pengguna kembali ke halaman `/login`.
4.  **Defensive UI & Role Checks (RBAC)**:
    *   Halaman membatasi render tombol aksi berdasarkan hak akses pengguna (`userRole`). Pengguna dengan peran `viewer` tidak akan melihat tombol edit/buat/hapus dokumen. Pengecekan ini divalidasi ganda di sisi backend.

---

## 📂 Struktur Direktori & Rute Halaman

```text
frontend/
 ┣ 📂 app/
 ┃ ┣ 📂 admin/
 ┃ ┃ ┣ 📂 create-user/    --> Halaman Registrasi User baru (Akses: Admin)
 ┃ ┃ ┣ 📂 settings/       --> Halaman Pengaturan Aplikasi (Akses: Admin)
 ┃ ┃ ┗ 📜 page.tsx        --> Panel Dashboard Admin (Manajemen User & Audit Logs)
 ┃ ┣ 📂 documents/
 ┃ ┃ ┣ 📂 [slug]/         --> Detail Dokumen & Pembaca Markdown (Akses: Semua)
 ┃ ┃ ┣ 📂 create/         --> Form Pembuatan Dokumen Baru (Akses: Admin, Editor)
 ┃ ┃ ┗ 📂 edit/[slug]/    --> Form Penyuntingan Dokumen (Akses: Admin, Editor)
 ┃ ┣ 📂 login/            --> Halaman Login dengan Fitur Password Toggle
 ┃ ┣ 📜 layout.tsx        --> Tata letak utama dengan Hydration Warning bypass
 ┃ ┗ 📜 page.tsx          --> Halaman Utama (Daftar Dokumen Global)
 ┣ 📂 public/             --> Aset gambar statis
 ┣ 📂 utils/
 ┃ ┗ 📜 auth.ts           --> Utilitas validasi token, dekode JWT, dan pembersihan sesi
 ┣ 📜 package.json
 ┗ 📜 tsconfig.json
```

---

## 🚀 Cara Menjalankan Aplikasi Klien

### 1. Konfigurasi Variabel Lingkungan
Pastikan Anda memiliki berkas `.env.local` di dalam direktori `frontend/` dengan isi:
```env
NEXT_PUBLIC_BASE_URL=http://localhost:3200/api
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Jalankan Mode Pengembangan
```bash
npm run dev
```
Aplikasi akan aktif di [http://localhost:3000](http://localhost:3000).

---

## 🧪 Skrip Pengujian Sesi Otomatis (Puppeteer)
Anda dapat memvalidasi alur pengalihan sesi kadaluwarsa secara otomatis dengan menjalankan skrip uji browser headless:
```bash
node scratch/test-session.js
```
Skrip ini akan mensimulasikan login user `Piann`, mendiamkan browser selama 5 menit hingga token kedaluwarsa, memicu reload, memverifikasi popup SweetAlert2, dan memastikan pengalihan ke halaman `/login` berhasil.
