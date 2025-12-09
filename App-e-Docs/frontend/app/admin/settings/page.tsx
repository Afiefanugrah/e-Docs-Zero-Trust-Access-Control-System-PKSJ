"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiSave,
  FiLoader,
  FiSettings,
  FiAlertTriangle,
  FiFileText,
} from "react-icons/fi";

// URL API yang Sesuai dengan Backend Anda
const BASE_URL = "http://localhost:3200/api";
const ADMIN_ROLE_NAME = "admin";

// --- DEFINISI TIPE FORM ---
interface SettingsForm {
  app_name: string;
  footer_text: string;
  disclaimer_content: string; // Input teks panjang
  terms_of_service: string; // Input teks panjang
}

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsForm>({
    app_name: "e-Docs Management",
    footer_text: "Hak Cipta © 2025 e-Docs. Semua hak dilindungi.",
    disclaimer_content:
      "Disclaimer ini menyatakan bahwa semua dokumen yang terdapat dalam sistem ini bersifat internal dan rahasia. Penggunaan atau penyebaran tanpa izin tertulis dari Administrasi adalah dilarang keras. Harap selalu merujuk pada versi dokumen yang telah disetujui (Approved). [Ini adalah teks yang sangat panjang untuk diuji].",
    terms_of_service:
      "Syarat dan ketentuan layanan kami: 1. Penggunaan aplikasi ini terbatas pada karyawan atau pihak yang berwenang. 2. Dilarang melakukan modifikasi data tanpa otorisasi. 3. Pelanggaran dapat mengakibatkan sanksi administrasi atau hukum. [Teks ini dapat terus diperpanjang untuk menguji kapasitas input].",
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [canAccess, setCanAccess] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // --- PROTEKSI ROLE (RBAC) ---
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userRole =
      typeof window !== "undefined" ? localStorage.getItem("userRole") : null;

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (userRole !== ADMIN_ROLE_NAME) {
      alert(
        `Akses Ditolak! Halaman ini hanya untuk peran ${ADMIN_ROLE_NAME.toUpperCase()}.`
      );
      router.push("/");
      return;
    }

    // --- DI SINI: Fetch data settings yang sudah ada dari Backend (Jika ada) ---
    // fetchSettings(authToken);
    // Untuk demo, kita langsung set loading ke false:
    setToken(authToken);
    setCanAccess(true);
    setLoading(false);
  }, [router]);

  // --- HANDLE INPUT CHANGE ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // --- HANDLE SUBMIT (Simulasi Save Settings) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmitting(true);
    setMessage(null);

    // --- SIMULASI API POST UNTUK SETTING ---
    // Endpoint yang seharusnya Anda buat di backend: /api/settings/update
    // try {
    //     const response = await fetch(`${BASE_URL}/settings/update`, {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //             'Authorization': `Bearer ${token}`
    //         },
    //         body: JSON.stringify(formData),
    //     });

    //     if (response.ok) {
    //         setMessage({ type: 'success', text: "Pengaturan berhasil disimpan!" });
    //     } else {
    //         setMessage({ type: 'error', text: "Gagal menyimpan pengaturan." });
    //     }
    // } catch (error) {
    //     setMessage({ type: 'error', text: "Terjadi kesalahan jaringan." });
    // } finally {
    //     setIsSubmitting(false);
    // }

    // --- SIMULASI SUKSES TANPA API CALL SEBENARNYA ---
    setTimeout(() => {
      setIsSubmitting(false);
      setMessage({
        type: "success",
        text: "Pengaturan berhasil disimpan! (Simulasi)",
      });
      console.log("Data Pengaturan yang Disimpan:", formData);
    }, 1000);
  };

  // --- TAMPILAN LOADING/AKSES DITOLAK ---
  if (loading || !canAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <FiLoader className="animate-spin w-8 h-8 text-red-600 mr-3" />
        <span className="text-xl font-medium text-gray-700">
          Memverifikasi akses Admin...
        </span>
      </div>
    );
  }

  // --- TAMPILAN FORM UTAMA ---
  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center text-gray-600 hover:text-gray-800 transition font-medium"
          >
            <FiArrowLeft className="mr-2" /> Kembali ke Admin Dashboard
          </button>
          <h1 className="text-3xl font-extrabold text-gray-800">
            <FiSettings className="mr-2 inline-block text-red-600" /> Pengaturan
            Aplikasi
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-2xl space-y-6"
        >
          {/* --- BAGIAN UMUM --- */}
          <h2 className="text-xl font-bold border-b pb-2 text-gray-800">
            Pengaturan Dasar
          </h2>

          <div>
            <Label htmlFor="app_name">Nama Aplikasi</Label>
            <Input
              id="app_name"
              name="app_name"
              value={formData.app_name}
              onChange={handleChange}
              placeholder="e-Docs System"
            />
          </div>

          <div>
            <Label htmlFor="footer_text">Teks Footer Singkat</Label>
            <Input
              id="footer_text"
              name="footer_text"
              value={formData.footer_text}
              onChange={handleChange}
              placeholder="Hak Cipta..."
            />
          </div>

          {/* --- BAGIAN INPUT TEKS PANJANG (KRITIS) --- */}
          <h2 className="text-xl font-bold border-b pb-2 pt-4 text-gray-800 flex items-center">
            <FiFileText className="mr-2 w-5 h-5" /> Konten Legalitas & Kebijakan
          </h2>

          <div>
            <Label htmlFor="disclaimer_content">
              Disclaimer/Pernyataan Privasi
            </Label>
            <TextArea
              id="disclaimer_content"
              name="disclaimer_content"
              value={formData.disclaimer_content}
              onChange={handleChange}
              // Menggunakan rows yang besar (15) untuk menunjukkan input teks panjang
              rows={15}
              placeholder="Masukkan seluruh konten disclaimer di sini..."
            />
          </div>

          <div>
            <Label htmlFor="terms_of_service">
              Syarat & Ketentuan Layanan (ToS)
            </Label>
            <TextArea
              id="terms_of_service"
              name="terms_of_service"
              value={formData.terms_of_service}
              onChange={handleChange}
              // Menggunakan rows yang lebih besar (20)
              rows={20}
              placeholder="Masukkan teks Syarat & Ketentuan lengkap di sini..."
            />
          </div>

          {/* Pesan Status */}
          {message && (
            <div
              className={`p-3 rounded-lg border text-sm flex items-center ${
                message.type === "success"
                  ? "bg-green-100 border-green-400 text-green-700"
                  : "bg-red-100 border-red-400 text-red-700"
              }`}
            >
              <FiAlertTriangle className="mr-2 w-5 h-5" />
              {message.text}
            </div>
          )}

          {/* Tombol Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition duration-300 disabled:bg-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin mr-2 w-5 h-5" />
                Menyimpan Pengaturan...
              </>
            ) : (
              <>
                <FiSave className="mr-2 w-5 h-5" />
                Simpan Pengaturan
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;

// --- Komponen Styling Reusable ---

const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({
  children,
  ...props
}) => (
  <label {...props} className="block text-sm font-semibold text-gray-700 mb-2">
    {children}
  </label>
);

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (
  props
) => (
  <input
    {...props}
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-gray-900"
  />
);

const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (
  props
) => (
  <textarea
    {...props}
    // Menggunakan resize-y agar hanya bisa resize vertikal
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 resize-y text-gray-900"
  />
);
