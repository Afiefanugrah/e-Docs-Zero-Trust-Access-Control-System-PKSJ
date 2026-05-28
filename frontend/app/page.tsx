// app/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // <--- BARIS KRITIS: Import SweetAlert2
import {
  FiLogOut,
  FiFileText,
  FiList,
  FiSearch,
  FiLoader,
  FiUser,
  FiPlusCircle,
  FiEdit,
  FiSettings,
  FiTrash2,
} from "react-icons/fi";

// --- DEFINISI TIPE ---
interface Document {
  id: number;
  title: string;
  slug: string;
  status: string;
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
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

// --- DEFINISI PERAN YANG DIIZINKAN (RBAC) ---
const EDITOR_ROLES = ["admin", "editor"];

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

  // --- FUNGSI AMBIL DAFTAR DOKUMEN ---
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
      // Menggunakan SweetAlert2 untuk error umum
      Swal.fire({
        icon: "error",
        title: "Gagal Memuat",
        text: "Gagal memuat daftar dokumen dari server.",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  // --- 1. AMBIL DATA USER DAN PROTEKSI ROUTE ---
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

        if (!response.ok) {
          throw new Error("Sesi tidak valid. Harap login ulang.");
        }

        const data = await response.json();
        const fetchedUser = data.data;

        setUserData(fetchedUser);
        localStorage.setItem("userRole", fetchedUser.roleName);

        await fetchDocuments(token);
      } catch (error) {
        console.error("Error validasi sesi:", error);
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        // Menggunakan SweetAlert2 untuk error sesi
        Swal.fire({
          icon: "warning",
          title: "Sesi Kedaluwarsa",
          text: "Sesi Anda telah berakhir. Harap login ulang.",
          confirmButtonText: "OK",
        }).then(() => {
          router.push("/login");
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // --- 2. FUNGSI BARU: DELETE DOKUMEN (Menggunakan SweetAlert2) ---
  const handleDelete = async (slug: string, title: string) => {
    if (!isAdmin) {
      Swal.fire({
        icon: "warning",
        title: "Akses Ditolak",
        text: "Anda tidak memiliki izin untuk menghapus dokumen.",
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }

    // Konfirmasi Penghapusan dengan SweetAlert2
    const result = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: `Apakah Anda yakin ingin menghapus dokumen "${title}"? Aksi ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) {
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) {
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${BASE_URL}/document/slug/${slug}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMessage =
          responseData.message ||
          "Gagal menghapus dokumen karena masalah server/otorisasi.";

        Swal.fire({
          icon: "error",
          title: "Gagal Hapus",
          text: errorMessage,
        });
        console.error("Delete Failed:", response.status, responseData);
      } else {
        // SweetAlert2 untuk Sukses
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: `Dokumen "${title}" berhasil dihapus.`,
          showConfirmButton: false,
          timer: 2000,
        });
        // Refresh daftar dokumen
        await fetchDocuments(token);
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      Swal.fire({
        icon: "error",
        title: "Kesalahan Jaringan",
        text: "Terjadi kesalahan jaringan saat menghapus dokumen.",
      });
    } finally {
      setLoading(false);
    }
  };
  // ------------------------------------

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
  );

  // --- TAMPILAN LOADING SEMENTARA ---
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

  // --- TAMPILAN DOKUMEN GLOBAL UTAMA (Struktur tetap sama) ---
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
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

      <main className="grow p-4 md:p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
          <FiList className="mr-3 text-blue-600" /> Daftar Dokumen yang Dapat
          Diakses
        </h2>

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
                    {/* Tombol Lihat Detail */}
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

                    {/* Tombol Edit */}
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

                    {/* --- Tombol DELETE (HANYA ADMIN) --- */}
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(doc.slug, doc.title)}
                        className="text-red-600 hover:text-red-800 flex items-center justify-end w-full mt-1"
                      >
                        <FiTrash2 className="mr-1" /> Hapus
                      </button>
                    )}
                    {/* ------------------------------------- */}
                  </td>
                </tr>
              ))}
              {filteredDocuments.length === 0 && (
                <tr>
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
