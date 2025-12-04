"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

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

    const API_URL = "http://localhost:3200/api/auth/login";

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username,
          password: password,
        }),
      });

      const data = await response.json();

      // Ambil token dari properti 'data' kedua.
      // Jika responsnya { success: true, data: { token: '...' } }, maka ini yang benar.
      const receivedToken = data.data?.token; // <-- PERBAIKAN KRITIS DI SINI

      if (response.ok) {
        // --- LOGIN BERHASIL (Status kode 200-299) ---
        setIsSuccess(true);
        setMessage("Login Berhasil! Mengalihkan ke Dashboard...");

        if (receivedToken) {
          // 1. Menyimpan token untuk digunakan sebagai bukti sesi
          localStorage.setItem("authToken", receivedToken);
        } else {
          // Jika token tidak ditemukan, anggap error dan lemparkan ke catch block
          throw new Error(
            "Login berhasil, tetapi token tidak ditemukan dalam properti 'data'."
          );
        }

        // 2. Arahkan pengguna ke halaman dashboard setelah jeda singkat
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        // --- LOGIN GAGAL (Status kode 4xx atau 5xx) ---
        setIsSuccess(false);
        const errorMessage =
          data.message || "Gagal login. Cek kredensial Anda.";
        setMessage(errorMessage);
        setIsLoading(false); // Hentikan loading
      }
    } catch (error) {
      // --- ERROR JARINGAN, CORS, ATAU TOKEN HILANG ---
      setIsSuccess(false);
      console.error("Login Error:", error);
      setMessage(
        "Terjadi kesalahan. Cek koneksi server, konfigurasi CORS, atau pastikan respons token benar."
      );
      setIsLoading(false); // Hentikan loading
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
          Masuk ke Akun Anda
        </h2>

        <form onSubmit={handleSubmit}>
          {/* Input Nama Pengguna */}
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nama Pengguna
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUsername(e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          {/* Input Kata Sandi */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Kata Sandi
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md font-semibold hover:bg-blue-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Memproses..." : "Login"}
          </button>

          {/* Pesan Kesalahan/Sukses */}
          {message && (
            <p
              className={`mt-4 text-center font-medium ${
                isSuccess ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
