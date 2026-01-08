"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Megaphone,
  AlertTriangle,
  Info,
  X,
  Plus,
  Trash2,
  Edit,
  Eye,
  MousePointer2,
  XCircle,
  CheckCircle2,
  Smartphone,
  Globe,
  Calendar,
  AlertOctagon,
  Wrench,
  PartyPopper,
  ChevronRight,
  Send,
} from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ERROR" | "MAINTENANCE" | "PROMOTION";
  priority: number;
  is_active: boolean;
  show_on_web: boolean;
  show_on_mobile: boolean;
  icon?: string;
  bg_color?: string;
  text_color?: string;
  start_date?: string;
  end_date?: string;
  view_count: number;
  click_count: number;
  dismiss_count: number;
  created_at: string;
  created_by: string;
  has_action_button?: boolean;
  action_button_text?: string;
  action_button_url?: string;
}

export default function AnnouncementsPage() {
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "INFO",
    priority: "0",
    icon: "info",
    bg_color: "#FFFFFF",
    text_color: "#0D1C1C",
    show_on_web: true,
    show_on_mobile: true,
    has_action_button: false,
    action_button_text: "",
    action_button_url: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin");
      return;
    }
    fetchAnnouncements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // Handle mock data fallback
  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      setTimeout(() => {
        const mockData: Announcement[] = [
          {
            id: 1,
            title: "Promo Kemerdekaan",
            message: "Diskon 17% untuk semua item snack dan minuman dingin!",
            type: "PROMOTION",
            priority: 10,
            is_active: true,
            show_on_web: true,
            show_on_mobile: true,
            icon: "celebration",
            view_count: 1250,
            click_count: 320,
            dismiss_count: 45,
            created_at: new Date().toISOString(),
            created_by: "Admin Marketing",
          },
          {
            id: 2,
            title: "Jadwal Maintenance",
            message: "Sistem akan mengalami pemeliharaan pada jam 02:00 - 04:00 WIB.",
            type: "MAINTENANCE",
            priority: 8,
            is_active: true,
            show_on_web: true,
            show_on_mobile: true,
            icon: "build",
            view_count: 850,
            click_count: 12,
            dismiss_count: 120,
            created_at: new Date(Date.now() - 86400000).toISOString(),
            created_by: "Tim Teknis",
          },
          {
            id: 3,
            title: "Stok Baru Tersedia",
            message: "Varian baru Chitato dan Qtela sudah tersedia di mesin VM-01.",
            type: "INFO",
            priority: 5,
            is_active: false,
            show_on_web: false,
            show_on_mobile: true,
            icon: "info",
            view_count: 450,
            click_count: 80,
            dismiss_count: 20,
            created_at: new Date(Date.now() - 172800000).toISOString(),
            created_by: "Admin Gudang",
          },
        ];
        setAnnouncements(mockData);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      setIsLoading(false);
    }
  };

  const handleTypeChange = (newType: string) => {
    setFormData({
      ...formData,
      type: newType as any,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, post to API
    setIsModalOpen(false);
    // Refresh list logic here
    alert("Fitur simpan belum terhubung ke backend real.");
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case "ERROR":
        return { bg: "bg-red-50", text: "text-red-700", border: "border-red-100", icon: AlertOctagon };
      case "WARNING":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", icon: AlertTriangle };
      case "MAINTENANCE":
        return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-100", icon: Wrench };
      case "PROMOTION":
        return { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-100", icon: PartyPopper };
      case "INFO":
      default:
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-100", icon: Info };
    }
  };

  return (
    <div className="flex h-screen bg-amber-50/20 font-sans">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-6 lg:p-10">
        {/* Page Heading & Main Action */}
        <div className="flex flex-wrap justify-between items-end gap-6 pb-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Admin</span>
                <ChevronRight className="w-3 h-3" />
                <span>Pengumuman</span>
              </div>
            <h1 className="text-3xl font-black tracking-tight text-amber-900">
              Manajemen Pengumuman
            </h1>
            <p className="text-gray-500 font-medium">
              Kelola pesan publik, peringatan sistem, dan jadwal pemeliharaan untuk pengguna.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl h-12 px-6 bg-amber-500 hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 hover:-translate-y-0.5 text-white text-sm font-bold"
          >
            <Plus className="w-5 h-5" />
            <span className="truncate">Buat Pengumuman</span>
          </button>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Megaphone className="w-12 h-12 text-amber-500 animate-bounce" />
              <p className="text-gray-400 font-bold">Memuat pengumuman...</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
              {/* Table Header */}
              <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <div className="col-span-5">Detail Pengumuman</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Statistik</div>
                <div className="col-span-2 text-right">Aksi</div>
              </div>

              {announcements.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 shadow-sm">
                  <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg font-medium">
                    Belum ada pengumuman. Buat yang pertama!
                  </p>
                </div>
              ) : (
                announcements.map((announcement) => {
                  const style = getTypeStyle(announcement.type);
                  const Icon = style.icon;
                  
                  return (
                    <div
                      key={announcement.id}
                      className="bg-white rounded-2xl p-5 shadow-sm border border-amber-50 hover:shadow-md hover:border-amber-200 transition-all group"
                    >
                      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4 items-center">
                        {/* Title & Meta */}
                        <div className="col-span-5 w-full flex items-start gap-4">
                          <div
                            className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${style.bg} ${style.text} ${style.border} border`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <div className="flex flex-col">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                              {announcement.title}
                            </h3>
                            <p className="text-sm text-gray-500 font-medium truncate max-w-xs">
                              {announcement.message}
                            </p>
                            
                            {/* Badges */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${style.bg} ${style.text}`}>
                                {announcement.type}
                              </span>
                              
                              {announcement.show_on_web && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 flex items-center gap-1">
                                  <Globe className="w-3 h-3" /> Web
                                </span>
                              )}
                              
                              {announcement.show_on_mobile && (
                                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-green-50 text-green-600 flex items-center gap-1">
                                  <Smartphone className="w-3 h-3" /> Mobile
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-2 w-full flex items-center">
                          {announcement.is_active ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100">
                              <XCircle className="w-3.5 h-3.5" />
                              Nonaktif
                            </span>
                          )}
                        </div>

                        {/* Analytics */}
                        <div className="col-span-3 w-full flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <Eye className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-bold">{announcement.view_count}</span> dilihat
                          </div>
                          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                            <MousePointer2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 font-bold">{announcement.click_count}</span> diklik
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2 w-full flex items-center justify-end gap-2">
                          <button
                            className="size-9 flex items-center justify-center rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            className="size-9 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        )}

        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="relative w-full max-w-[800px] flex flex-col max-h-[90vh] bg-white rounded-[32px] shadow-2xl overflow-hidden">
              
              {/* Modal Header */}
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-black text-gray-900">
                    Buat Pengumuman Baru
                  </h2>
                  <p className="text-gray-500 text-sm font-medium mt-1">
                    Kirim pesan ke pengguna di berbagai platform
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                  
                  {/* Title */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Judul
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium"
                      placeholder="Contoh: Promo Spesial Hari Ini"
                      required
                    />
                  </div>

                  {/* Message */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Pesan
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full min-h-[120px] px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium resize-none"
                      placeholder="Tulis detail pengumuman di sini..."
                      required
                    />
                  </div>

                  {/* Type & Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Tipe
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => handleTypeChange(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium cursor-pointer"
                      >
                        <option value="INFO">📘 Info</option>
                        <option value="WARNING">⚠️ Peringatan</option>
                        <option value="ERROR">🚨 Error</option>
                        <option value="MAINTENANCE">🔧 Maintenance</option>
                        <option value="PROMOTION">🎉 Promosi</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Prioritas (0-10)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-100 text-gray-900 focus:ring-2 focus:ring-amber-400 focus:bg-white transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* Platforms */}
                  <div className="flex flex-col gap-3">
                    <label className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                      Tampilkan di Platform
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all flex-1">
                        <input
                          type="checkbox"
                          checked={formData.show_on_web}
                          onChange={(e) => setFormData({ ...formData, show_on_web: e.target.checked })}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-400"
                        />
                        <span className="font-bold text-gray-700">Website</span>
                      </label>
                      <label className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer hover:border-amber-200 hover:bg-amber-50 transition-all flex-1">
                        <input
                          type="checkbox"
                          checked={formData.show_on_mobile}
                          onChange={(e) => setFormData({ ...formData, show_on_mobile: e.target.checked })}
                          className="w-5 h-5 text-amber-500 rounded focus:ring-amber-400"
                        />
                        <span className="font-bold text-gray-700">Aplikasi Mobile</span>
                      </label>
                    </div>
                  </div>

                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-8 border-t border-gray-100 bg-gray-50 flex justify-end gap-4 shrink-0">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 h-12 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-8 h-12 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Bagikan Pengumuman
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
