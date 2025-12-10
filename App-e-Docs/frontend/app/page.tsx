// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiLogOut,
  FiFileText,
  FiList,
  FiSearch,
  FiLoader,
  FiCalendar,
  FiUser,
  FiPlusCircle,
  FiEdit,
  FiSettings,
} from "react-icons/fi";

// --- DEFINISI TIPE ---
interface Document {
  id: number;
  title: string;
  slug: string;
  // HILANGKAN description SEMENTARA: Karena backend TIDAK mengirimkannya di /document/all
  // description: string;
  status: string;
  // KRITIS: Version harus string ("1.0"), bukan number
  version: string;
  Creator: {
    username: string;
  };
  updatedAt: string;
}

interface UserData {
  id: number;
  username: string;
  roleName: string;
}

// URL API yang Sesuai dengan Backend Anda
const BASE_URL = "http://localhost:3200/api";

// --- DEFINISI PERAN YANG DIIZINKAN (RBAC) ---
const EDITOR_ROLES = ["admin", "editor"];

// --- FUNGSI HELPER: Memotong Teks (Tetap dipertahankan, tapi tidak dipakai di table) ---
const truncateText = (text: string, maxLength: number = 50) => {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const GlobalDocumentsPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");

  const canCreateOrEdit = userData
    ? EDITOR_ROLES.includes(userData.roleName)
    : false;

  const isAdmin = userData && userData.roleName === "admin";

  // --- 1. AMBIL DATA USER DAN PROTEKSI ROUTE (Tetap Sama) ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        // SANGAT KRITIS: Ini adalah baris yang memicu "Sesi tidak valid."
        if (!response.ok) {
          // Tambahkan logika debug atau pastikan token valid
          const errorData = await response
            .json()
            .catch(() => ({ message: "Gagal parse error response" }));
          console.error("Auth Fetch Failed:", response.status, errorData);
          throw new Error("Sesi tidak valid. Harap login ulang.");
        }

        const data = await response.json();
        const fetchedUser = data.data;

        if (!fetchedUser || !fetchedUser.roleName) {
          throw new Error("Data user atau role tidak ditemukan.");
        }

        setUserData(fetchedUser);
        localStorage.setItem("userRole", fetchedUser.roleName);
        fetchDocuments(token);
      } catch (error) {
        console.error("Error validasi sesi:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        router.push("/login");
      }
    };

    fetchUserData();
  }, [router]);

  // --- 2. AMBIL DAFTAR DOKUMEN (Tetap Sama) ---
  const fetchDocuments = async (token: string) => {
    try {
      const response = await fetch(`${BASE_URL}/document/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Gagal memuat dokumen.");
      }

      const data = await response.json();
      setDocuments(data.data);
    } catch (error) {
      console.error("Error fetching documents:", error);
      alert("Gagal memuat daftar dokumen dari server.");
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIKA LOGOUT (Tetap Sama) ---
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    router.push("/login");
  };

  // --- FILTER DOKUMEN (Tetap Sama) ---
  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.Creator.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.status.toLowerCase().includes(searchTerm.toLowerCase())
    // Menghapus filter berdasarkan description
  );

  // --- TAMPILAN LOADING SEMENTARA (Tetap Sama) ---
  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex items-center text-blue-600">
          <FiLoader className="animate-spin w-6 h-6 mr-3" />
          <span className="text-lg font-medium">
            Memverifikasi sesi dan memuat data...
          </span>
        </div>
      </div>
    );
  }

  // --- TAMPILAN DOKUMEN GLOBAL UTAMA ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* --- HEADER/NAVIGASI ATAS (Tetap Sama) --- */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-blue-600">
            e-Docs{" "}
            <span className="text-gray-500 text-sm font-normal ml-2">
              Dokumen Global
            </span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              <FiSettings className="mr-2" /> Admin Panel
            </button>
          )}

          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-700">
              Hi, {userData.username}
            </p>
            <p
              className={`text-xs font-semibold ${
                canCreateOrEdit ? "text-red-600" : "text-blue-600"
              }`}
            >
              {userData.roleName.toUpperCase()}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <FiLogOut className="mr-2" />
            Logout
          </button>
        </div>
      </header>

      {/* --- KONTEN UTAMA DOKUMEN --- */}
      <main className="grow p-4 md:p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
          <FiList className="mr-3 text-blue-600" /> Daftar Dokumen yang Dapat
          Diakses
        </h2>
        {/* Kontrol dan Pencarian + Tombol CREATE (Tetap Sama) */}
        <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-md">
          <div className="relative w-full max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Cari berdasarkan Judul, Status, atau Pembuat..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {canCreateOrEdit && (
            <button
              onClick={() => router.push("/documents/create")}
              className="ml-4 flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <FiPlusCircle className="mr-2" /> Buat Dokumen Baru
            </button>
          )}
        </div>

        {/* Tabel Dokumen */}
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <TableHead title="Judul Dokumen" />
                {/* Deskripsi Dihapus sementara backend tidak mengirimkannya */}
                {/* <TableHead title="Deskripsi Singkat" /> */}
                <TableHead title="Status" />
                <TableHead title="Pembuat" />
                <TableHead title="Versi" />
                <TableHead title="Update Terakhir" />
                <TableHead title="Aksi" className="text-right" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.map((doc) => (
                <tr
                  key={doc.id}
                  className="hover:bg-gray-50 transition duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doc.title}
                  </td>

                  {/* Deskripsi Dihapus sementara backend tidak mengirimkannya */}
                  {/* <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                    {truncateText(doc.description)}
                  </td> */}

                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <StatusBadge status={doc.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                    <FiUser className="mr-1 w-4 h-4" /> {doc.Creator.username}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doc.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-y-1">
                    <button
                      onClick={() =>
                        router.push(
                          `/documents/${encodeURIComponent(doc.slug)}`
                        )
                      }
                      className="text-blue-600 hover:text-blue-800 flex items-center justify-end w-full"
                    >
                      <FiFileText className="mr-1" /> Lihat Detail
                    </button>

                    {canCreateOrEdit && (
                      <button
                        onClick={() =>
                          router.push(
                            `/documents/edit/${encodeURIComponent(doc.slug)}`
                          )
                        }
                        className="text-yellow-600 hover:text-yellow-800 flex items-center justify-end w-full mt-1"
                      >
                        <FiEdit className="mr-1" /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
                  {/* KRITIS: Kembalikan colSpan ke 6 karena 1 kolom dihapus */}
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    Tidak ada dokumen yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>

      <footer className="p-4 text-center text-sm text-gray-500 border-t bg-white">
        &copy; {new Date().getFullYear()} Aplikasi e-Docs. Semua hak dilindungi.
      </footer>
    </div>
  );
};

export default GlobalDocumentsPage;

// --- KOMPONEN KEPALA TABEL KECIL ---
const TableHead: React.FC<{ title: string; className?: string }> = ({
  title,
  className,
}) => (
  <th
    scope="col"
    className={`px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider ${className}`}
  >
    {title}
  </th>
);

// --- KOMPONEN BADGE STATUS KECIL ---
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const safeStatus = status || "";

  let colorClass = "bg-gray-200 text-gray-800";
  if (safeStatus === "PUBLISHED" || safeStatus === "approved") {
    colorClass = "bg-green-100 text-green-800";
  } else if (safeStatus === "DRAFT") {
    colorClass = "bg-yellow-100 text-yellow-800";
  } else if (safeStatus === "ARCHIVED") {
    colorClass = "bg-red-100 text-red-800";
  }

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {safeStatus.toUpperCase()}
    </span>
  );
};
