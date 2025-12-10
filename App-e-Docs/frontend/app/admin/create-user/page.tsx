// app/admin/create-user/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  FiArrowLeft,
  FiUserPlus,
  FiSave,
  FiLoader,
  FiUser,
  FiLock,
  FiTag,
  FiCheckCircle,
} from "react-icons/fi";

const BASE_URL = "http://localhost:3200/api";
const ADMIN_ROLE_NAME = "admin";
const ROLES = [
  { id: 3, name: "Admin" },
  { id: 2, name: "Editor" },
  { id: 1, name: "Viewer" },
];

// --- DEFINISI TIPE ---
interface FormState {
  username: string;
  password: "";
  roleId: string; // Akan dikirim sebagai string, lalu di parse di backend
  isActive: boolean;
}

// -----------------------------------------------------------------------------
// --- KOMPONEN INPUT REUSABLE ---
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// --- KOMPONEN UTAMA CREATE USER ---
// -----------------------------------------------------------------------------

const CreateUserPage: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<FormState>({
    username: "",
    password: "",
    roleId: "1", // Default ke Viewer
    isActive: true, // Default aktif
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // --- 1. Proteksi Role (Hanya Admin) ---
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (userRole !== ADMIN_ROLE_NAME) {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak!",
        text: "Anda tidak memiliki izin untuk mengakses halaman ini.",
        showConfirmButton: false,
        timer: 3000,
      });
      router.push("/admin"); // Arahkan kembali ke panel admin jika tidak punya izin
      return;
    }

    setToken(authToken);
  }, [router]);

  // --- 2. Handle Input Change ---
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    let finalValue: string | boolean = value;

    if (type === "checkbox") {
      finalValue = (e.target as HTMLInputElement).checked;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
  };

  // --- 3. Handle Submit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!formData.username || !formData.password || !formData.roleId) {
      Swal.fire({
        icon: "warning",
        title: "Input Kurang",
        text: "Semua kolom wajib diisi.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Data yang dikirim ke backend
      const dataToSend = {
        username: formData.username,
        password: formData.password,
        roleId: formData.roleId, 
        isActive: formData.isActive,
      };

      const response = await fetch(`${BASE_URL}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil!",
          text: `Pengguna ${result.data.username} berhasil dibuat sebagai ${ROLES.find(r => r.id === result.data.roleId)?.name || 'User'}.`,
          showConfirmButton: false,
          timer: 2500,
        });

        // Reset form dan alihkan kembali ke manajemen pengguna
        setFormData({
            username: "",
            password: "",
            roleId: "1",
            isActive: true,
        });
        router.push("/admin?view=users"); // Redirect ke Admin Panel
      } else {
        // Tampilkan error dari backend
        throw new Error(result.message || "Gagal membuat pengguna baru.");
      }
    } catch (error) {
      console.error("Create User Error:", error);
      Swal.fire({
        icon: "error",
        title: "Gagal!",
        text: (error as Error).message || "Terjadi kesalahan server.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-xl mx-auto">
        <header className="mb-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/admin")}
            className="flex items-center text-gray-600 hover:text-gray-800 transition font-medium"
          >
            <FiArrowLeft className="mr-2" /> Kembali ke Admin Panel
          </button>
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center">
            <FiUserPlus className="mr-2 text-blue-600" /> Buat Pengguna Baru
          </h1>
        </header>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-2xl space-y-6"
        >
          {/* Input Username */}
          <div>
            <Label htmlFor="username">
              Username <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Username unik"
            />
          </div>

          {/* Input Password */}
          <div>
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Minimal 8 karakter"
            />
            <p className="text-xs text-gray-500 mt-1">
              Gunakan password yang kuat.
            </p>
          </div>

          {/* Select Role */}
          <div>
            <Label htmlFor="roleId">
              Role Pengguna <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <select
                id="roleId"
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-150 text-gray-900"
              >
                {ROLES.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <FiTag className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>

          {/* Checkbox isActive */}
          <div className="flex items-center space-x-3">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isActive" className="mb-0 cursor-pointer">
              Aktifkan Akun Sekarang
            </Label>
            <FiCheckCircle className={`w-5 h-5 ${formData.isActive ? 'text-green-500' : 'text-gray-400'}`} />
          </div>

          {/* Tombol Submit */}
          <button
            type="submit"
            className="w-full flex items-center justify-center py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition duration-300 disabled:bg-blue-400"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <FiLoader className="animate-spin mr-2 w-5 h-5" />
                Membuat Pengguna...
              </>
            ) : (
              <>
                <FiSave className="mr-2 w-5 h-5" />
                Simpan Pengguna
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateUserPage;