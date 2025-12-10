// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal, { SweetAlertResult } from "sweetalert2";
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
} from "react-icons/fi";

// Kita akan menggunakan Swal langsung

const BASE_URL = "http://localhost:3200/api";
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
    className={`w-full flex items-center px-3 py-2 rounded-lg transition duration-150 
            ${
              isActive
                ? "bg-red-600 text-white font-bold"
                : isLink
                ? "hover:bg-gray-700 text-gray-300"
                : "hover:bg-gray-700 text-gray-100"
            }
        `}
  >
    {React.cloneElement(icon, { className: "mr-3 w-5 h-5" })}
    {title}
  </button>
);

// --- Komponen Sidebar Admin ---
interface AdminSidebarProps {
  currentView: "users" | "audit";
  setCurrentView: (view: "users" | "audit") => void;
  handleLogout: () => void;
  router: ReturnType<typeof useRouter>;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentView,
  setCurrentView,
  handleLogout,
  router,
}) => (
  <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-xl h-screen shrink-0 sticky top-0">
    <h1 className="text-2xl font-bold mb-8 text-red-400 flex items-center">
      <FiSettings className="mr-2" /> Admin Panel
    </h1>

    <nav className="grow space-y-2">
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

      <div className="border-t border-gray-700 pt-4 mt-4">
        <SidebarItem
          icon={<FiList />}
          title="Kembali ke Dokumen"
          onClick={() => router.push("/")}
          isLink
        />
      </div>
    </nav>

    <button
      onClick={handleLogout}
      className="flex items-center justify-center w-full py-2 mt-4 bg-red-700 rounded-lg hover:bg-red-800 transition"
    >
      <FiLogOut className="mr-2" />
      Logout
    </button>
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
              <p className="text-xs text-gray-600">
                Pada Tabel: **{log.tableName || "-"}**
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
                User: **{userText}**
              </p>
            </div>

            {/* Kolom 4: IP Address */}
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <FiCpu className="mr-1 w-4 h-4" />
                IP: **{log.ipAddress || "N/A"}**
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

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [userCount, setUserCount] = useState<number>(0);

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
    const authToken = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");

    if (!authToken) {
      router.push("/login");
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

    // Set token dan ID Admin
    setToken(authToken);
    setAdminId(userId ? parseInt(userId, 10) : 0);
    setLoading(false);
  }, [router]);

  // --- Pemuatan Data Khusus Admin ---
  useEffect(() => {
    if (token) {
      if (currentView === "users") {
        fetchUsers(token);
      } else if (currentView === "audit") {
        fetchAuditLogs(token);
      }
    }
  }, [token, currentView]);

  // --- Logika Fetch Data Pengguna (/api/users/all) ---
  const fetchUsers = async (authToken: string) => {
    try {
      const response = await fetch(`${BASE_URL}/users/all`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
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
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
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
      />

      {/* --- KONTEN UTAMA --- */}
      <main className="grow p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-6">
          {currentView === "users"
            ? "Manajemen Pengguna"
            : "Log Aktivitas Sistem (Audit Log)"}
        </h2>

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
