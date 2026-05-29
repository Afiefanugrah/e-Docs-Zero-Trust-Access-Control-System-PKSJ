// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal, { SweetAlertResult } from "sweetalert2";
import { isTokenExpired, clearSession, handleSessionExpired as sharedHandleSessionExpired } from "@/utils/auth";
import {
  FiLogOut,
  FiUsers,
  FiActivity,
  FiSettings,
  FiList,
  FiPlusCircle,
  FiTrash2,
  FiUser,
  FiLoader,
  FiClock,
  FiCpu,
  FiCheckCircle,
  FiEdit3,
  FiAlertTriangle,
  FiToggleLeft,
  FiToggleRight,
  FiRefreshCw,
} from "react-icons/fi";

// Kita akan menggunakan Swal langsung

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
const ADMIN_ROLE_NAME = "admin";

// --- DEFINISI TIPE ---
interface UserListItem {
  id: number;
  username: string;
  isActive: boolean;
  role: {
    name: string;
  };
}

interface AuditLogItem {
  id: number;
  actionType: string;
  tableName: string;
  userId: number;
  ipAddress: string;
  createdAt: string;
  // KRITIS: Tambahkan struktur user untuk menampilkan username
  user?: {
    id: number;
    username: string;
  };
}

// --------------------------------------------------------------------------------
// --- KOMPONEN HELPER & VIEWS ---
// --------------------------------------------------------------------------------

// --- Sidebar Item Component (Tetap Sama) ---
interface SidebarItemProps {
  icon: React.ReactElement<{ className?: string }>;
  title: string;
  isActive?: boolean;
  onClick: () => void;
  isLink?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  title,
  isActive,
  onClick,
  isLink = false,
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-300 transform hover:translate-x-1 group relative overflow-hidden cursor-pointer
            ${
              isActive
                ? "bg-gradient-to-r from-red-600 to-rose-500 text-white font-semibold shadow-lg shadow-red-500/20"
                : "text-gray-400 hover:text-white hover:bg-gray-800/50"
            }
        `}
  >
    {isActive && (
      <span className="absolute left-0 top-0 bottom-0 w-1.5 bg-white rounded-r-md"></span>
    )}
    
    <div className={`mr-3 transition-transform duration-300 group-hover:scale-110 ${isActive ? "text-white" : "text-gray-400 group-hover:text-red-400"}`}>
      {React.cloneElement(icon, { className: "w-5 h-5" })}
    </div>
    
    <span className="text-sm font-medium tracking-wide">{title}</span>
  </button>
);

// --- Komponen Sidebar Admin ---
interface AdminSidebarProps {
  currentView: "users" | "audit";
  setCurrentView: (view: "users" | "audit") => void;
  handleLogout: () => void;
  router: ReturnType<typeof useRouter>;
  adminUsername: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  setCurrentView,
  handleLogout,
  router,
  adminUsername,
}) => (
  <aside className="w-64 bg-gray-950 text-white flex flex-col p-5 shadow-2xl h-screen shrink-0 sticky top-0 border-r border-gray-800/80">
    <div className="mb-8 mt-2">
      <h1 className="text-2xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-rose-400 flex items-center">
        <FiSettings className="mr-2.5 text-red-500 transition-transform duration-700 hover:rotate-90" /> Admin Panel
      </h1>
      <div className="flex items-center mt-2.5 ml-0.5 space-x-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Zero Trust Active</span>
      </div>
    </div>

    <nav className="grow space-y-2">
      <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-3">Menu Dashboard</p>
      
      <SidebarItem
        icon={<FiUsers />}
        title="Manajemen Pengguna"
        isActive={currentView === "users"}
        onClick={() => setCurrentView("users")}
      />
      <SidebarItem
        icon={<FiActivity />}
        title="Audit Log"
        isActive={currentView === "audit"}
        onClick={() => setCurrentView("audit")}
      />

      <div className="border-t border-gray-800 pt-5 mt-5">
        <p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest px-2 mb-3">Navigasi</p>
        <SidebarItem
          icon={<FiList />}
          title="Kembali ke Dokumen"
          onClick={() => router.push("/")}
          isLink
        />
      </div>
    </nav>

    <div className="mt-auto border-t border-gray-800 pt-5 space-y-4">
      <div className="flex items-center space-x-3 bg-gray-900/60 p-3 rounded-xl border border-gray-800/40">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center font-bold text-white shadow-md shadow-red-500/10">
          {adminUsername.substring(0, 2).toUpperCase()}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-gray-200 truncate">{adminUsername}</p>
          <span className="inline-block px-2 py-0.5 mt-0.5 text-[9px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 rounded-md">
            Administrator
          </span>
        </div>
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center py-3 bg-gray-900 hover:bg-red-750 text-gray-300 hover:text-white rounded-xl text-sm font-semibold border border-gray-800 hover:border-red-650 transition-all duration-300 shadow-md hover:shadow-red-950/20 cursor-pointer"
      >
        <FiLogOut className="mr-2 w-4 h-4" />
        Keluar Sistem
      </button>
    </div>
  </aside>
);

// --- View: Manajemen Pengguna (Tidak Berubah) ---
interface UserManagementViewProps {
  users: UserListItem[];
  userCount: number;
  handleDeleteUser: (id: number) => void;
  handleToggleActive: (id: number, isActive: boolean) => void;
  adminId: number;
  router: ReturnType<typeof useRouter>;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  userCount,
  handleDeleteUser,
  handleToggleActive,
  adminId,
  router,
}) => (
  <>
    <div className="flex justify-between items-center mb-6 p-4 bg-white rounded-xl shadow-md">
      <h3 className="text-xl font-semibold text-gray-700">
        Total Pengguna: {userCount}
      </h3>
      <button
        onClick={() => router.push("/admin/create-user")}
        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
      >
        <FiPlusCircle className="mr-2" /> Buat Pengguna Baru
      </button>
    </div>

    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <TableHead title="ID" />
            <TableHead title="Username" />
            <TableHead title="Role" />
            <TableHead title="Status Aktif" />
            <TableHead title="Aksi" className="text-right" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => {
            const isSelf = user.id === adminId;
            return (
              <tr
                key={user.id}
                className="hover:bg-gray-50 transition duration-150"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.id}{" "}
                  {isSelf && (
                    <span className="text-red-500 font-bold">(Anda)</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                  <FiUser className="mr-2" />
                  {user.username}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <StatusBadge status={user.role.name} isRole />
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {user.isActive ? (
                    <span className="text-green-600 font-semibold flex items-center">
                      <FiCheckCircle className="mr-1" /> Aktif
                    </span>
                  ) : (
                    <span className="text-gray-500 font-semibold flex items-center">
                      <FiAlertTriangle className="mr-1" /> Dinonaktifkan
                    </span>
                  )}
                </td>

                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                  {!isSelf && (
                    <button
                      onClick={() => handleToggleActive(user.id, user.isActive)}
                      className={`text-white py-1 px-3 rounded transition duration-150 
                            ${
                              user.isActive
                                ? "bg-orange-500 hover:bg-orange-600"
                                : "bg-blue-500 hover:bg-blue-600"
                            }
                        `}
                      title={
                        user.isActive
                          ? "Nonaktifkan Akses Login"
                          : "Aktifkan Akses Login"
                      }
                    >
                      {user.isActive ? (
                        <FiToggleRight className="inline-block w-5 h-5" />
                      ) : (
                        <FiToggleLeft className="inline-block w-5 h-5" />
                      )}
                    </button>
                  )}

                  {!isSelf && (
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 ml-3"
                      title="Hapus Pengguna"
                    >
                      <FiTrash2 className="inline-block w-5 h-5" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </>
);

// --- Fungsi untuk menentukan ikon dan warna Audit Log (Tetap Sama) ---
const getActionVisuals = (actionType: string) => {
  let icon = <FiCpu />;
  let color = "bg-gray-100 text-gray-700 border-gray-300";
  const baseAction = actionType.split("_")[0] || "";

  if (baseAction === "READ" || baseAction === "SESSION") {
    icon = <FiCheckCircle />;
    color = "bg-green-50 border-green-300 text-green-700";
  } else if (baseAction === "CREATE" || baseAction === "REGISTER") {
    icon = <FiPlusCircle />;
    color = "bg-blue-50 border-blue-300 text-blue-700";
  } else if (baseAction === "UPDATE" || baseAction === "EDIT") {
    icon = <FiEdit3 />;
    color = "bg-yellow-50 border-yellow-300 text-yellow-700";
  } else if (baseAction === "DELETE" || baseAction === "LOGOUT") {
    icon = <FiAlertTriangle />;
    color = "bg-red-50 border-red-300 text-red-700";
  }

  return { icon, color };
};

// --- View: Audit Log (Diperbaiki untuk Username) ---
interface AuditLogViewProps {
  logs: AuditLogItem[];
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => (
  <div className="space-y-4">
    {logs.length === 0 && (
      <div className="p-6 text-center bg-white rounded-xl shadow-lg text-gray-500">
        Tidak ada log aktivitas ditemukan.
      </div>
    )}

    {logs.map((log) => {
      const { icon, color } = getActionVisuals(log.actionType);

      // Tentukan teks user: Username (ID)
      const userText = log.user?.username
        ? `${log.user.username} (${log.userId})`
        : `ID: ${log.userId}`;

      return (
        <div
          key={log.id}
          className={`flex p-4 rounded-xl border-l-4 shadow-md ${color} border-l-4`}
        >
          {/* Ikon Aksi */}
          <div className="shrink-0 mr-4 mt-1">
            {React.cloneElement(icon, { className: "w-6 h-6" })}
          </div>

          {/* Detail Log Grid */}
          <div className="grow grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-sm">
            {/* Kolom 1: Aksi & Tabel */}
            <div>
              <p className="font-bold text-gray-800 flex items-center">
                {log.actionType}
              </p>
              <p className="text-xs text-gray-600 font-semibold">
                Pada Tabel:{" "}
                <span className="font-normal">{log.tableName || "-"}</span>
              </p>
            </div>

            {/* Kolom 2: Waktu */}
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <FiClock className="mr-1 w-4 h-4 text-gray-500" />
                {new Date(log.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Kolom 3: User ID/Username (Diperbaiki) */}
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <FiUser className="mr-1 w-4 h-4" />
                User: <span className="font-bold ml-1">{userText}</span>
              </p>
            </div>

            {/* Kolom 4: IP Address (Diperbaiki) */}
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <FiCpu className="mr-1 w-4 h-4" />
                IP:{" "}
                <span className="font-bold ml-1">{log.ipAddress || "N/A"}</span>
              </p>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

// --- KOMPONEN KEPALA TABEL KECIL (Tetap Sama) ---
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

// --- KOMPONEN BADGE STATUS/ROLE KECIL (Tetap Sama) ---
const StatusBadge: React.FC<{ status: string; isRole?: boolean }> = ({
  status,
}) => {
  let colorClass = "bg-gray-200 text-gray-800";
  const safeStatus = status || "";

  if (safeStatus === "admin") {
    colorClass = "bg-red-100 text-red-800";
  } else if (safeStatus === "editor") {
    colorClass = "bg-green-100 text-green-800";
  } else if (safeStatus === "viewer") {
    colorClass = "bg-blue-100 text-blue-800";
  }

  return (
    <span
      className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClass}`}
    >
      {safeStatus.toUpperCase()}
    </span>
  );
};

// --------------------------------------------------------------------------------
// --- KOMPONEN UTAMA ADMIN DASHBOARD ---
// --------------------------------------------------------------------------------
const AdminDashboardPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<"users" | "audit">("users");
  const [token, setToken] = useState<string | null>(null);
  const [adminId, setAdminId] = useState<number>(0);
  const [adminUsername, setAdminUsername] = useState<string>("Admin");

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [userCount, setUserCount] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // --- Fungsi Penanganan Sesi Kedaluwarsa ---
  const handleSessionExpired = () => {
    sharedHandleSessionExpired(router, Swal);
  };

  // --- Fungsi menampilkan SweetAlert2 (Toast) ---
  const showSwalAlert = (
    icon: "success" | "error" | "warning",
    title: string,
    text: string
  ) => {
    Swal.fire({
      // Menggunakan Swal langsung
      icon: icon,
      title: title,
      text: text,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 5000,
      timerProgressBar: true,
      // KRITIS: Menambahkan tipe HTMLElement
      didOpen: (toast: HTMLElement) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
      },
    });
  };

  // --- Proteksi dan Validasi Role (HANYA ADMIN) ---
  useEffect(() => {
    const authToken = sessionStorage.getItem("authToken") || localStorage.getItem("authToken");
    const userRole = sessionStorage.getItem("userRole") || localStorage.getItem("userRole");
    const userId = sessionStorage.getItem("userId") || localStorage.getItem("userId");

    if (!authToken) {
      router.push("/login");
      return;
    }

    // Periksa kedaluwarsa token di sisi client sebelum lanjut
    if (isTokenExpired(authToken)) {
      sharedHandleSessionExpired(router, Swal);
      return;
    }

    if (userRole !== ADMIN_ROLE_NAME) {
      // Mengganti alert native
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak!",
        text: `Halaman ini hanya untuk peran ${ADMIN_ROLE_NAME.toUpperCase()}.`,
        showConfirmButton: false,
        timer: 3000,
      });
      router.push("/");
      return;
    }

    // Ekstrak nama admin dari token secara aman
    try {
      const parts = authToken.split(".");
      if (parts.length === 3) {
        const payloadBase64 = parts[1];
        const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
        const decodedPayload = JSON.parse(
          decodeURIComponent(
            atob(base64)
              .split("")
              .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
              .join("")
          )
        );
        if (decodedPayload.username) {
          setAdminUsername(decodedPayload.username);
        }
      }
    } catch (e) {
      console.error("Gagal mengekstrak nama admin:", e);
    }

    // Set token dan ID Admin
    setToken(authToken);
    setAdminId(userId ? parseInt(userId, 10) : 0);
    setLoading(false);
  }, [router]);

  // --- Pemuatan Data Khusus Admin (dengan Auto-Refresh / Polling 10 Detik Opsional) ---
  useEffect(() => {
    if (!token) return;

    // Fetch pertama kali saat masuk view
    if (currentView === "users") {
      fetchUsers(token);
    } else if (currentView === "audit") {
      fetchAuditLogs(token);
    }

    if (!autoRefresh) return; // 🛡️ Jangan jalankan polling jika Auto-Refresh dinonaktifkan

    // Auto-refresh data setiap 10 detik agar admin mendapat update secara berkala
    const intervalId = setInterval(() => {
      if (currentView === "users") {
        fetchUsers(token);
      } else if (currentView === "audit") {
        fetchAuditLogs(token);
      }
    }, 10000);

    return () => {
      clearInterval(intervalId);
    };
  }, [token, currentView, autoRefresh]);

  // --- Logika Fetch Data Pengguna (/api/users/all) ---
  const fetchUsers = async (authToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/all`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!response.ok) throw new Error("Gagal memuat data pengguna.");

      const data = await response.json();
      setUsers(data.data);
      setUserCount(data.data.length);
    } catch (error) {
      console.error("Error fetching users:", error);
      showSwalAlert("error", "Gagal!", "Gagal memuat daftar pengguna.");
    }
  };

  // --- Logika Fetch Audit Log (Diperbaiki) ---
  const fetchAuditLogs = async (authToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/audit/all`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (response.status === 401) {
        handleSessionExpired();
        return;
      }
      if (!response.ok) throw new Error("Gagal memuat data audit.");

      const data = await response.json();
      setAuditLogs(data.data);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      showSwalAlert("error", "Gagal!", "Gagal memuat log audit.");
    }
  };

  // --- Logika Hapus Pengguna (/api/users/delete/:id) ---
  const handleDeleteUser = (id: number) => {
    if (id === adminId) {
      showSwalAlert(
        "warning",
        "Aksi Ditolak",
        "Anda tidak dapat menghapus akun Anda sendiri!"
      );
      return;
    }

    Swal.fire({
      // Menggunakan Swal langsung
      title: "Konfirmasi Hapus?",
      text: `Apakah Anda yakin ingin menghapus Pengguna ID: ${id}? Tindakan ini tidak dapat dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc3545",
    }).then(async (result: SweetAlertResult) => {
      if (result.isConfirmed) {
        if (!token) return;

        try {
          const response = await fetch(`${BASE_URL}/users/delete/${id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.status === 401) {
            handleSessionExpired();
            return;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: "Gagal menghapus pengguna. Cek log server.",
            }));
            throw new Error(errorData.message);
          }

          setUsers(users.filter((user) => user.id !== id));
          setUserCount((prev) => prev - 1);
          showSwalAlert(
            "success",
            "Berhasil",
            `Pengguna ID ${id} berhasil dihapus.`
          );
        } catch (error) {
          console.error("Error deleting user:", error);
          showSwalAlert(
            "error",
            "Gagal!",
            (error as Error).message || "Gagal menghapus pengguna."
          );
        }
      }
    });
  };

  // --- Logika TOGGLE STATUS AKTIF (Baru) ---
  const handleToggleActive = (id: number, currentStatus: boolean) => {
    if (id === adminId) {
      showSwalAlert(
        "warning",
        "Aksi Ditolak",
        "Anda tidak dapat menonaktifkan akun Anda sendiri!"
      );
      return;
    }

    const action = currentStatus ? "Nonaktifkan" : "Aktifkan";
    const statusText = currentStatus ? "dinonaktifkan" : "diaktifkan";

    Swal.fire({
      // Menggunakan Swal langsung
      title: "Konfirmasi Status?",
      text: `Apakah Anda yakin ingin ${action.toLowerCase()} akses login Pengguna ID: ${id}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Ya, ${action}`,
      cancelButtonText: "Batal",
      confirmButtonColor: currentStatus ? "#ffc107" : "#007bff",
    }).then(async (result: SweetAlertResult) => {
      if (result.isConfirmed) {
        if (!token) return;

        try {
          // ASUMSI: Endpoint backend: PUT /api/users/toggle-active/:id
          const response = await fetch(
            `${BASE_URL}/users/toggle-active/${id}`,
            {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ isActive: !currentStatus }), // Mengirim status yang diinginkan
            }
          );

          if (response.status === 401) {
            handleSessionExpired();
            return;
          }

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: `Gagal ${action.toLowerCase()} pengguna.`,
            }));
            throw new Error(errorData.message);
          }

          // Perbarui state secara lokal
          setUsers(
            users.map((user) =>
              user.id === id ? { ...user, isActive: !currentStatus } : user
            )
          );

          showSwalAlert(
            "success",
            "Berhasil",
            `Pengguna ID ${id} berhasil di${statusText}.`
          );
        } catch (error) {
          console.error("Error toggling user status:", error);
          showSwalAlert(
            "error",
            "Gagal!",
            (error as Error).message ||
              `Gagal ${action.toLowerCase()} pengguna.`
          );
        }
      }
    });
  };

  // --- LOGIKA LOGOUT (Tetap Sama) ---
  const handleLogout = () => {
    clearSession();
    router.push("/login");
  };

  if (loading || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="flex items-center text-red-600">
          <FiLoader className="animate-spin w-6 h-6 mr-3" />
          <span className="text-lg font-medium">
            Memverifikasi hak akses Admin...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* --- SIDEBAR COMPONENT --- */}
      <AdminSidebar
        currentView={currentView}
        setCurrentView={setCurrentView}
        handleLogout={handleLogout}
        router={router}
        adminUsername={adminUsername}
      />

      {/* --- KONTEN UTAMA --- */}
      <main className="grow p-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4 border-b pb-4">
          <h2 className="text-3xl font-extrabold text-gray-800">
            {currentView === "users"
              ? "Manajemen Pengguna"
              : "Log Aktivitas Sistem (Audit Log)"}
          </h2>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (token) {
                  if (currentView === "users") fetchUsers(token);
                  else if (currentView === "audit") fetchAuditLogs(token);
                }
              }}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold shadow-sm transition cursor-pointer"
              title="Refresh Data Sekarang"
            >
              <FiRefreshCw className="mr-2 w-4 h-4 text-gray-500" /> Sync / Refresh
            </button>
            <label className="flex items-center space-x-2 text-sm text-gray-600 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
              />
              <span>Auto-Refresh (10s)</span>
            </label>
          </div>
        </div>

        {currentView === "users" && (
          <UserManagementView
            users={users}
            userCount={userCount}
            handleDeleteUser={handleDeleteUser}
            handleToggleActive={handleToggleActive}
            adminId={adminId}
            router={router}
          />
        )}
        {currentView === "audit" && <AuditLogView logs={auditLogs} />}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
