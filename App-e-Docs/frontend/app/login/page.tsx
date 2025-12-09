// app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { FiUser, FiLock, FiLogIn, FiLoader, FiBookOpen } from "react-icons/fi";

const BASE_URL = "http://localhost:3200/api";

const LoginPage: React.FC = () => {
  const router = useRouter();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);

    const API_URL = `${BASE_URL}/auth/login`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      const receivedToken = data.data?.token;

      if (response.ok) {
        setIsSuccess(true);
        setMessage("Login Berhasil! Mengalihkan ke Dokumen Global...");

        if (receivedToken) {
          // 1. Dekode Payload Token untuk mendapatkan Role
          const parts = receivedToken.split(".");
          if (parts.length === 3) {
            const payloadBase64 = parts[1];
            let payload;

            try {
              payload = JSON.parse(atob(payloadBase64));
            } catch (decodeError) {
              throw new Error("Gagal mendekode token payload.");
            }

            const roleNameFromToken = payload.roleName;

            if (roleNameFromToken) {
              // 2. Menyimpan Token dan Role yang Sudah Didekode (KRITIS UNTUK RBAC)
              localStorage.setItem("authToken", receivedToken);
              localStorage.setItem("userRole", roleNameFromToken);

              setTimeout(() => {
                router.push("/");
              }, 1000);
              return;
            }
          }

          throw new Error("Token ditemukan, tetapi gagal mendekode Role Name.");
        } else {
          throw new Error("Token tidak ditemukan dalam respons data.");
        }
      } else {
        setIsSuccess(false);
        const errorMessage =
          data.message || "Gagal login. Cek kredensial Anda.";
        setMessage(errorMessage);
        setIsLoading(false);
      }
    } catch (error) {
      setIsSuccess(false);
      console.error("Login Error:", error);
      setMessage("Terjadi kesalahan atau kredensial tidak valid.");
      setIsLoading(false);
    }
  };

  // --- TAMPILAN MODERN TAILWIND CSS ---
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="bg-white p-8 sm:p-10 rounded-xl shadow-2xl w-full max-w-sm transform transition duration-500 hover:scale-[1.01]">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-blue-600 rounded-full mb-3 text-white shadow-md">
            <FiBookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-800">e-Docs</h1>
          <h2 className="text-lg text-gray-600 mt-1 font-medium">
            Masuk ke Sistem Dokumentasi
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
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition duration-150 text-gray-700"
                placeholder="Masukkan Nama Pengguna Anda"
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
                type="password"
                id="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-100 focus:border-blue-500 transition duration-150 text-gray-700"
                placeholder="Kata Sandi Rahasia"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center bg-blue-600 text-white py-3 rounded-lg font-bold uppercase tracking-wider shadow-lg shadow-blue-500/50 hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400 disabled:shadow-none disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin mr-2 w-5 h-5" />
                Memproses...
              </>
            ) : (
              <>
                <FiLogIn className="mr-2 w-5 h-5" />
                Login
              </>
            )}
          </button>

          {message && (
            <p
              className={`mt-5 p-3 rounded-lg text-center font-semibold text-sm transition-all duration-300 ${
                isSuccess
                  ? "bg-green-100 text-green-700 border border-green-300"
                  : "bg-red-100 text-red-700 border border-red-300"
              }`}
            >
              {message}
            </p>
          )}
        </form>

        <p className="mt-8 text-center text-xs text-gray-500">
          Aplikasi e-Docs &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
