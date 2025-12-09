// app/admin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  FiBookOpen,
  FiHardDrive,
} from "react-icons/fi";

const BASE_URL = "http://localhost:3200/api";
const ADMIN_ROLE_NAME = "admin";

// --- DEFINISI TIPE ---
interface UserListItem {
  id: number;
  username: string;
  roleName: string;
}

interface AuditLogItem {
  id: number;
  actionType: string; // Contoh: "READ_ALL_DOCUMENTS", "USER_DELETED"
  tableName: string; // Contoh: "Documents", "Users"
  userId: number;
  ipAddress: string;
  createdAt: string;
}

// --------------------------------------------------------------------------------
// --- KOMPONEN HELPER ---
// --------------------------------------------------------------------------------

// --- Sidebar Item Component ---
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

// --- View: Manajemen Pengguna ---
interface UserManagementViewProps {
  users: UserListItem[];
  userCount: number;
  handleDeleteUser: (id: number) => void;
  router: ReturnType<typeof useRouter>;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({
  users,
  userCount,
  handleDeleteUser,
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
            <TableHead title="Aksi" className="text-right" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {users.map((user) => (
            <tr
              key={user.id}
              className="hover:bg-gray-50 transition duration-150"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {user.id}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 flex items-center">
                <FiUser className="mr-2" />
                {user.username}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <StatusBadge status={user.roleName} isRole />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="text-red-600 hover:text-red-800 flex items-center justify-end ml-auto"
                >
                  <FiTrash2 className="mr-1" /> Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// --- Fungsi untuk menentukan ikon dan warna Audit Log ---
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

// --- View: Audit Log (TAMPILAN CARD VIEW) ---
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

            {/* Kolom 3: User ID */}
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <FiUser className="mr-1 w-4 h-4 text-gray-500" />
                User ID: {log.userId}
              </p>
            </div>

            {/* Kolom 4: IP Address */}
            <div>
              <p className="font-semibold text-gray-700 flex items-center">
                <FiCpu className="mr-1 w-4 h-4 text-gray-500" />
                IP: **{log.ipAddress || "N/A"}**
              </p>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

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

// --- KOMPONEN BADGE STATUS/ROLE KECIL ---
const StatusBadge: React.FC<{ status: string; isRole?: boolean }> = ({
  status,
  isRole = false,
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

// --- KOMPONEN UTAMA ADMIN DASHBOARD ---
const AdminDashboardPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<"users" | "audit">("users");
  const [token, setToken] = useState<string | null>(null);

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [userCount, setUserCount] = useState<number>(0);

  // --- Proteksi dan Validasi Role (HANYA ADMIN) ---
  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    const userRole = localStorage.getItem("userRole");

    if (!authToken) {
      router.push("/login");
      return;
    }

    if (userRole !== ADMIN_ROLE_NAME) {
      alert(
        `Akses Ditolak! Halaman ini hanya untuk peran ${ADMIN_ROLE_NAME.toUpperCase()}. Anda adalah ${
          userRole ? userRole.toUpperCase() : "TAMU"
        }.`
      );
      router.push("/");
      return;
    }

    setToken(authToken);
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
      alert("Gagal memuat daftar pengguna.");
    }
  };

  // --- Logika Fetch Audit Log (/api/audit/all) ---
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
      alert("Gagal memuat log audit.");
    }
  };

  // --- Logika Hapus Pengguna (/api/users/delete/:id) ---
  const handleDeleteUser = async (id: number) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus Pengguna ID: ${id}? Tindakan ini tidak dapat dibatalkan.`
      )
    )
      return;
    if (!token) return;

    try {
      const response = await fetch(`${BASE_URL}/users/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Gagal menghapus pengguna.");

      setUsers(users.filter((user) => user.id !== id));
      setUserCount((prev) => prev - 1);
      alert(`Pengguna ID ${id} berhasil dihapus.`);
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Gagal menghapus pengguna. Cek log server.");
    }
  };

  // --- LOGIKA LOGOUT ---
  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
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
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-xl">
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
            router={router}
          />
        )}
        {currentView === "audit" && <AuditLogView logs={auditLogs} />}
      </main>
    </div>
  );
};

export default AdminDashboardPage;
