"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiLogIn, FiLoader, FiBookOpen, FiEye, FiEyeOff } from "react-icons/fi";
import { isTokenExpired, clearSession } from "@/utils/auth";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "");

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 🛡️ Redirect jika user sudah login sebelumnya dan token belum kadaluwarsa
  useEffect(() => {
    const token = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
    if (token) {
      if (isTokenExpired(token)) {
        clearSession();
      } else {
        router.push("/");
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    // 🛡️ VALIDASI & SANITASI INPUT
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setMessage("Nama pengguna dan kata sandi wajib diisi.");
      return;
    }

    // 🛡️ VALIDASI CONFIG BASE_URL
    if (!BASE_URL) {
      setMessage("Kesalahan Konfigurasi: URL API backend tidak dikonfigurasi.");
      return;
    }

    setIsLoading(true);
    const API_URL = `${BASE_URL}/auth/login`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: trimmedUsername, password }),
      });

      const data = await response.json();
      const receivedToken = data.data?.token;

      if (response.ok) {
        if (!receivedToken) {
          throw new Error(
            "Token otentikasi tidak ditemukan dalam respons server.",
          );
        }

        const parts = receivedToken.split(".");
        if (parts.length !== 3) {
          throw new Error("Format token keamanan tidak valid.");
        }

        const payloadBase64 = parts[1];
        let roleNameFromToken;

        try {
          // 🛡️ SOLUSI ANTI-CRASH: Aman untuk karakter Unicode
          const decodedPayload = JSON.parse(
            decodeURIComponent(
              atob(payloadBase64)
                .split("")
                .map(
                  (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                )
                .join(""),
            ),
          );
          roleNameFromToken = decodedPayload.roleName;
        } catch (decodeError) {
          throw new Error("Gagal mendekode enkripsi token payload.");
        }

        if (!roleNameFromToken) {
          throw new Error(
            "Akses ditolak: Informasi hak akses (Role) tidak ditemukan.",
          );
        }

        // 💡 AMBIL NAMA USER DARI JSON BACKEND UNTUK MENYAPA DI UI
        const activeUser = data.data?.user?.username || "Pengguna";

        setIsSuccess(true);
        setMessage(`Login Berhasil! Selamat Datang Kembali, ${activeUser}.`);

        // 🔒 PRINSIP ZERO TRUST: Gunakan sessionStorage untuk mengurangi exposure window dari serangan XSS persisten.
        sessionStorage.setItem("authToken", receivedToken);

        setTimeout(() => {
          router.push("/");
        }, 1200);
      } else {
        setIsSuccess(false);
        // Menangkap pesan error dari sistem pertahanan backend (misal akun terkunci karena brute force)
        const errorMessage =
          data.message || "Gagal masuk. Silakan periksa kembali akun Anda.";
        setMessage(errorMessage);
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsSuccess(false);
      console.error("Login Error:", error);
      setMessage(
        error.message ||
          "Terjadi kesalahan jaringan atau server tidak merespons.",
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-sm transform transition duration-500 hover:scale-[1.01]">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600 rounded-full mb-3 text-white shadow-md">
            <FiBookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">e-Docs</h1>
          <h2 className="text-sm text-gray-500 mt-1 font-medium">
            Zero Trust Access Control System
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Nama Pengguna
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setUsername(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 bg-gray-50 disabled:opacity-60"
                placeholder="Masukkan username Anda"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Kata Sandi
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150 text-gray-700 bg-gray-50 disabled:opacity-60"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin mr-2 w-5 h-5" />
                Memverifikasi...
              </>
            ) : (
              <>
                <FiLogIn className="mr-2 w-5 h-5" />
                Masuk Sistem
              </>
            )}
          </button>

          {message && (
            <p
              className={`mt-5 p-3 rounded-lg text-center font-medium text-sm border transition-all duration-300 ${
                isSuccess
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-gray-400 font-light">
          Aplikasi e-Docs &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
