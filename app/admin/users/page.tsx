"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { vendingAPI } from "@/lib/api";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  User,
  Shield,
  Wrench,
  Package,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Lock,
} from "lucide-react";

interface User {
  id: number;
  type: "admin_user" | "user";
  name: string;
  email: string;
  phone?: string;
  role: string;
  roleColor: string;
  roleIcon: any;
  status: "active" | "locked" | "inactive";
  lastLogin: string;
  lastLoginTime: string;
  avatar?: string;
  initials?: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    role: "",
    status: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  /* Add User State */
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
       username: "",
       email: "",
       password: "",
       role: "admin"
  });

  const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          await vendingAPI.addUser(addForm);
          toast.success("Admin baru berhasil ditambahkan!");
          setIsAddModalOpen(false);
          setAddForm({ username: "", email: "", password: "", role: "admin" });
          loadUsers();
      } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Gagal menambah admin");
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteUser = async (user: User) => {
      if (!confirm(`Yakin ingin menghapus user ${user.name}? Tindakan ini tidak bisa dibatalkan.`)) return;
      
      try {
          await vendingAPI.deleteUser(user.id, user.type);
          toast.success("User berhasil dihapus");
          loadUsers();
      } catch (error: any) {
          console.error(error);
          toast.error(error.response?.data?.message || "Gagal menghapus user");
      }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<
      string,
      { label: string; color: string; icon: any }
    > = {
      admin: {
        label: "Super Admin",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Shield,
      },
      SUPER_ADMIN: {
        label: "Super Admin",
        color: "bg-amber-100 text-amber-800 border-amber-200",
        icon: Shield,
      },
      buyer: {
        label: "Customer",
        color: "bg-blue-50 text-blue-700 border-blue-200",
        icon: User,
      },
      technician: {
        label: "Teknisi",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: Wrench,
      },
      TECHNICIAN: {
        label: "Teknisi",
        color: "bg-orange-50 text-orange-700 border-orange-200",
        icon: Wrench,
      },
      inventory: {
        label: "Staf Gudang",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: Package,
      },
      INVENTORY: {
        label: "Staf Gudang",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: Package,
      },
      auditor: {
        label: "Auditor",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: ClipboardList,
      },
      AUDITOR: {
        label: "Auditor",
        color: "bg-purple-50 text-purple-700 border-purple-200",
        icon: ClipboardList,
      },
    };

    return (
      roleMap[role] || {
        label: role,
        color: "bg-gray-100 text-gray-700 border-gray-200",
        icon: User,
      }
    );
  };

  const formatLastLogin = (lastLogin: string | null | undefined) => {
    if (!lastLogin) {
      return { date: "Belum Pernah", time: "--:--" };
    }

    const loginDate = new Date(lastLogin);
    const now = new Date();
    const diffInMs = now.getTime() - loginDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    let dateStr = "";
    if (diffInDays === 0) {
      dateStr = "Hari Ini";
    } else if (diffInDays === 1) {
      dateStr = "Kemarin";
    } else {
      dateStr = loginDate.toLocaleDateString("id-ID", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    const timeStr = loginDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return { date: dateStr, time: timeStr };
  };

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);

      const token = localStorage.getItem("adminToken");
      if (!token) {
        // Fallback mock data if allowed or redirect
        // For development, we'll use mock data if API fails or no token (simulated)
      }

      // Simulate API call or use real one
      // For now, let's use a mix to ensure UI renders
      try {
        const response = await vendingAPI.getAllUsers();
        // Transform logic...
        const transformedUsers: User[] = response.data.map((user: any) => {
          const roleDisplay = getRoleDisplay(user.role);
          const lastLoginFormatted = formatLastLogin(user.lastLogin);
          return {
            id: user.id,
            type: user.type || (user.role === 'buyer' ? 'user' : 'admin_user'), // Fallback if backend doesn't send type for legacy
            name: user.name || "Unknown User",
            email: user.email,
            phone: user.phone,
            role: roleDisplay.label,
            roleColor: roleDisplay.color,
            roleIcon: roleDisplay.icon,
            status: user.status as "active" | "locked" | "inactive",
            lastLogin: lastLoginFormatted.date,
            lastLoginTime: lastLoginFormatted.time,
            initials: getInitials(user.name || "Unknown"),
          };
        });
        setUsers(transformedUsers);
        toast.success(`Berhasil memuat ${transformedUsers.length} pengguna`);
      } catch (error) {
        console.warn("API failed, using mock data", error);
        // Mock Data Fallback
        const mockUsers: User[] = [
          {
            id: 1,
            type: "admin_user",
            name: "Admin Vendify",
            email: "admin@vendify.id",
            role: "Super Admin",
            roleColor: "bg-amber-100 text-amber-800 border-amber-200",
            roleIcon: Shield,
            status: "active",
            lastLogin: "Hari Ini",
            lastLoginTime: "08:30",
            initials: "AV",
          },
          {
            id: 2,
            type: "admin_user",
            name: "Budi Teknisi",
            email: "teknisi@vendify.id",
            role: "Teknisi",
            roleColor: "bg-orange-50 text-orange-700 border-orange-200",
            roleIcon: Wrench,
            status: "active",
            lastLogin: "Kemarin",
            lastLoginTime: "14:20",
            initials: "BT",
          },
          {
            id: 3,
            type: "admin_user",
            name: "Siti Gudang",
            email: "gudang@vendify.id",
            role: "Staf Gudang",
            roleColor: "bg-red-50 text-red-700 border-red-200",
            roleIcon: Package,
            status: "inactive",
            lastLogin: "20 Okt 2023",
            lastLoginTime: "09:15",
            initials: "SG",
          },
             {
            id: 4,
            type: "user",
            name: "Rina Customer",
            email: "rina@gmail.com",
            role: "Customer",
            roleColor: "bg-blue-50 text-blue-700 border-blue-200",
            roleIcon: User,
            status: "active",
            lastLogin: "Hari Ini",
            lastLoginTime: "10:45",
            initials: "RC",
          },
        ];
        setUsers(mockUsers);
      }

    } catch (error) {
      console.error("Failed to load users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.push("/admin");
    } else {
      loadUsers();
    }
  }, [router, loadUsers]);

  const handleEditUser = (user: User) => {
    // Map display role back to value - Prefer Uppercase to match DB
    let roleValue = "";
    if (user.role === "Super Admin") roleValue = "SUPER_ADMIN";
    else if (user.role === "Teknisi") roleValue = "TECHNICIAN";
    else if (user.role === "Staf Gudang") roleValue = "INVENTORY";
    else if (user.role === "Auditor") roleValue = "AUDITOR";
    else roleValue = "buyer"; // Default

    setEditForm({
      role: roleValue,
      status: user.status
    });
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    setIsSaving(true);
    try {
      await vendingAPI.updateUser({
        id: selectedUser.id,
        type: selectedUser.type,
        role: editForm.role,
        status: editForm.status as "active" | "locked" | "inactive"
      });
      toast.success("User updated successfully");
      setIsEditModalOpen(false);
      loadUsers(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Failed to update user");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case "active":
        return (
          <div className="flex items-center gap-2">
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Aktif
              </span>
          </div>
        );
      case "locked":
        return (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                <Lock className="w-3.5 h-3.5" />
                erkunci
              </span>
          </div>
        );
      case "inactive":
        return (
          <div className="flex items-center gap-2">
             <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200">
                <XCircle className="w-3.5 h-3.5" />
                Nonaktif
              </span>
          </div>
        );
      default:
        return null;
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "" ||
      user.role.toLowerCase().includes(roleFilter.toLowerCase());
    return matchesSearch && matchesRole;
  });

  return (
    <div className="flex h-screen bg-amber-50/20 font-sans">
      <AdminSidebar />

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex flex-col w-full max-w-[1400px] mx-auto p-8 gap-8">
          {/* Breadcrumbs & Header */}
          <div className="flex flex-col gap-6">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider">
              <span className="hover:text-amber-600 cursor-pointer transition-colors">
                Admin
              </span>
              <ChevronRight className="w-3 h-3" />
              <span className="text-gray-900">Manajemen Pengguna</span>
            </div>

            {/* Page Heading */}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-col gap-2 max-w-2xl">
                <h2 className="text-3xl font-black tracking-tight text-amber-900">
                  Manajemen Pengguna
                </h2>
                <p className="text-gray-500 font-medium">
                  Kelola hak akses, peran, dan pengaturan keamanan untuk personel Vendify.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={loadUsers}
                  disabled={isLoading}
                  className="flex items-center gap-2 h-12 px-5 rounded-xl bg-white hover:bg-amber-50 border border-amber-200 text-amber-900 font-bold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  {isLoading ? "Memuat..." : "Refresh"}
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 h-12 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-lg shadow-amber-200 transition-all hover:-translate-y-0.5 active:translate-y-0">
                  <UserPlus className="w-5 h-5" />
                  Tambah Admin
                </button>
              </div>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                className="w-full h-14 pl-12 pr-4 rounded-xl border border-amber-100 bg-white text-gray-900 placeholder:text-gray-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all outline-none font-medium"
                placeholder="Cari pengguna berdasarkan nama, email, atau ID..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="md:col-span-4 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Filter className="w-5 h-5" />
              </div>
              <select
                className="w-full h-14 pl-12 pr-10 rounded-xl border border-amber-100 bg-white text-gray-900 appearance-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200 transition-all outline-none cursor-pointer font-bold"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">Semua Peran</option>
                <option value="admin">Super Admin</option>
                <option value="tech">Teknisi</option>
                <option value="inventory">Staf Gudang</option>
                <option value="auditor">Auditor</option>
              </select>
               <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <ChevronRight className="w-5 h-5 rotate-90" />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="flex flex-col rounded-3xl border border-amber-100 bg-white shadow-lg shadow-amber-100/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-amber-100 bg-amber-50/50">
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/4">
                      Info Pengguna
                    </th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Peran
                    </th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Terakhir Login
                    </th>
                    <th className="p-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-50">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                          <p className="text-lg font-bold text-gray-400">
                            Memuat data pengguna...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <User className="w-12 h-12 text-gray-300" />
                          <p className="text-lg font-bold text-gray-400">
                            {searchQuery || roleFilter
                              ? "Tidak ditemukan pengguna dengan filter ini"
                              : "Belum ada pengguna"}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="group hover:bg-amber-50/30 transition-colors"
                      >
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            {user.avatar ? (
                              <div
                                className="size-12 rounded-xl bg-cover bg-center shadow-sm border border-amber-100"
                                style={{
                                  backgroundImage: `url(${user.avatar})`,
                                }}
                              ></div>
                            ) : (
                              <div className="flex items-center justify-center size-12 rounded-xl bg-amber-100 text-amber-600 font-black text-lg shadow-sm border border-amber-200">
                                {user.initials}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-gray-900">
                                {user.name}
                              </span>
                              <span className="text-sm text-gray-500 font-medium">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${user.roleColor} text-xs font-bold`}
                          >
                            <user.roleIcon className="w-3.5 h-3.5" />
                            {user.role}
                          </span>
                        </td>
                        <td className="p-6">
                          {getStatusIndicator(user.status)}
                        </td>
                        <td className="p-6">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">
                              {user.lastLogin}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                              {user.lastLoginTime}
                            </span>
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="size-9 flex items-center justify-center rounded-lg hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-colors"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="size-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between p-6 border-t border-amber-100 bg-amber-50/20">
              <span className="text-sm text-gray-500 font-medium">
                Menampilkan{" "}
                <span className="font-bold text-gray-900">
                  1-{filteredUsers.length}
                </span>{" "}
                dari{" "}
                <span className="font-bold text-gray-900">{users.length}</span>{" "}
                pengguna
              </span>
              <div className="flex gap-2">
                <button
                  className="flex items-center justify-center size-10 rounded-xl border border-amber-100 text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed bg-white hover:bg-amber-50 transition-colors"
                  disabled
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button className="flex items-center justify-center size-10 rounded-xl border border-amber-100 text-gray-900 bg-white hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors shadow-sm">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl skew-y-0 transform transition-all duration-300 scale-100">
            <h3 className="text-xl font-bold text-amber-900 mb-6">
              Edit Pengguna: {selectedUser.name}
            </h3>

            <div className="flex flex-col gap-4">
              {/* Type Discriminator Info */}
              <div className="p-3 bg-gray-50 rounded-xl text-xs font-mono text-gray-500 border border-gray-100">
                Tipe: {selectedUser.type === 'admin_user' ? 'Staff Internal' : 'Customer'}
              </div>

              {/* Role Selection (Only for Staff) */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Role</label>
                {selectedUser.type === 'admin_user' ? (
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="h-12 px-4 rounded-xl border border-amber-200 bg-white font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
                  >
                    <option value="SUPER_ADMIN">Super Admin</option>
                    <option value="TECHNICIAN">Teknisi</option>
                    <option value="INVENTORY">Staf Gudang</option>
                    <option value="AUDITOR">Auditor</option>
                  </select>
                ) : (
                   <input 
                      type="text" 
                      value="Customer (Tetap)" 
                      disabled 
                      className="h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 font-medium"
                   />
                )}
              </div>

              {/* Status Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Status</label>
                <select
                   value={editForm.status}
                   onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                   className="h-12 px-4 rounded-xl border border-amber-200 bg-white font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
                >
                  <option value="active">Aktif</option>
                  <option value="locked">Terkunci / Suspend</option>
                  <option value="inactive">Nonaktif</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={isSaving}
                  className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl skew-y-0 transform transition-all duration-300 scale-100">
            <h3 className="text-xl font-bold text-amber-900 mb-6">
              Tambah Admin Baru
            </h3>
            <form onSubmit={handleAddUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Username</label>
                <input
                   required
                   type="text"
                   value={addForm.username}
                   onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                   className="h-12 px-4 rounded-xl border border-amber-200 bg-white font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
                   placeholder="misal: admin2"
                />
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-gray-700">Email</label>
                 <input
                    required
                    type="email"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="h-12 px-4 rounded-xl border border-amber-200 bg-white font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
                    placeholder="email@contoh.com"
                 />
              </div>
              
              <div className="flex flex-col gap-2">
                 <label className="text-sm font-bold text-gray-700">Password</label>
                 <input
                    required
                    type="password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="h-12 px-4 rounded-xl border border-amber-200 bg-white font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
                    placeholder="Minimal 6 karakter"
                 />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-gray-700">Role</label>
                <select
                   value={addForm.role}
                   onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                   className="h-12 px-4 rounded-xl border border-amber-200 bg-white font-medium focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none"
                >
                  <option value="admin">Super Admin</option>
                  <option value="technician">Teknisi</option>
                  <option value="inventory">Staf Gudang</option>
                  <option value="auditor">Auditor</option>
                </select>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? "Menyimpan..." : "Tambah Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
