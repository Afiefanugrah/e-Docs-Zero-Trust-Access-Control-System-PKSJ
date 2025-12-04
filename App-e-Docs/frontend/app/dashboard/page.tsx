"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.log("Token tidak ditemukan. Mengalihkan ke Login.");
      setIsAuthenticated(false);
      router.replace("/login");
      // 2. Token Ditemukan. (Di sini Anda bisa menambahkan VALIDASI ke backend)
      // Lakukan panggilan ke endpoint /api/auth/me untuk memastikan token belum kadaluarsa.
      // Untuk SEMENTARA, kita asumsikan token yang ada valid:
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    router.replace("/login");
  };

  if (isLoading) {
    // Tampilkan loading screen saat memverifikasi sesi
    return (
      <div className="flex justify-center items-center min-h-screen text-lg text-gray-600">
        Memverifikasi sesi... 🔄
      </div>
    );
  }

  if (!isAuthenticated) {
    // Jika tidak terautentikasi dan tidak dalam proses loading (sudah dialihkan)
    return null;
  }

  // --- KONTEN DASHBOARD HANYA TAMPIL JIKA isAUTHENTICATED TRUE ---
  return (
    <div className="p-8 bg-white min-h-screen">
      <header className="flex justify-between items-center pb-4 border-b">
        <h1 className="text-3xl font-extrabold text-blue-600">
          Selamat Datang di Dashboard
        </h1>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition duration-200"
        >
          Logout
        </button>
      </header>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-green-100 border border-green-300 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-green-700">
            Dokumen Aktif
          </h2>
          <p className="mt-2 text-3xl font-bold text-green-900">120</p>
        </div>
        <div className="p-6 bg-yellow-100 border border-yellow-300 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-yellow-700">
            Menunggu Persetujuan
          </h2>
          <p className="mt-2 text-3xl font-bold text-yellow-900">5</p>
        </div>
        <div className="p-6 bg-blue-100 border border-blue-300 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-blue-700">
            Total Pengguna
          </h2>
          <p className="mt-2 text-3xl font-bold text-blue-900">15</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
