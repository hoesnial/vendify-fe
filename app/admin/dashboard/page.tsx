"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Bell,
  Lock,
  DollarSign,
  AlertTriangle,
  Info,
  Thermometer,
  CheckCircle,
  Package,
  TrendingUp,
  Activity as ActivityIcon,
  ShoppingBag,
  User,
  History,
  LayoutGrid,
  X,
  Loader2,
} from "lucide-react";
import { vendingAPI } from "@/lib/api";

interface DashboardStats {
  salesToday: number;
  criticalAlerts: number;
  temperature: number;
  lowStockItems: number;
}

interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  time: string;
}

interface Activity {
  id: string;
  type: "sale" | "login" | "restock";
  title: string;
  time: string;
  value?: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    email: string;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [lowStockList, setLowStockList] = useState<any[]>([]);
  const [showLowStockModal, setShowLowStockModal] = useState(false);

  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleNavigation = (path: string) => {
    setIsNavigating(true);
    router.push(path);
  };

  const handleLock = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    router.replace("/admin");
  };

  const [stats, setStats] = useState<DashboardStats>({
    salesToday: 0,
    criticalAlerts: 0,
    temperature: 0,
    lowStockItems: 0,
  });

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [temp, setTemp] = useState(0);
  const tempRef = useRef(0);

  // Dedicated Temperature Polling (1s)
  useEffect(() => {
    const fetchTemp = async () => {
      try {
        const response: any = await vendingAPI.getTemperatureLogs("VM01", 1);
        if (response.data && response.data.length > 0) {
          // API returns 'value' for temperature
          const newTemp = response.data[0].value;
          setTemp(newTemp);
          tempRef.current = newTemp;
        }
      } catch (e) {
        console.error("Temp fetch error", e);
      }
    };

    fetchTemp(); // Initial fetch
    const interval = setInterval(fetchTemp, 1000); // 1s interval
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [financeData, productsData, ordersData] = await Promise.all([
        vendingAPI.getFinanceSummary(),
        vendingAPI.getAvailableProducts(),
        vendingAPI.getOrdersByMachine("VM01", { limit: 10 })
      ]);

      // 1. Stats
      const currentTemp = tempRef.current; // Use Ref
      
      const lowStockItemsData = productsData.products.filter(p => (p.current_stock || 0) < 5);
      const lowStockCount = lowStockItemsData.length;
      setLowStockList(lowStockItemsData);
      
      // Alerts Generation
      const generatedAlerts: Alert[] = [];
      if (currentTemp > 25) { // Use real-time temp state
        generatedAlerts.push({
          id: "temp-alert",
          type: "warning",
          title: "Suhu Tinggi",
          message: `Suhu mesin ${currentTemp}°C melebihi batas normal.`,
          time: "Sekarang"
        });
      }
      if (lowStockCount > 0) {
        generatedAlerts.push({
          id: "stock-alert",
          type: "warning",
          title: "Stok Menipis",
          message: `${lowStockCount} produk memiliki stok < 5.`,
          time: "Sekarang"
        });
      }

      // Check for recent failed orders
      const failedOrders = ordersData.orders.slice(0, 5).filter((o: any) => o.status === "FAILED");
      failedOrders.forEach((o: any) => {
         generatedAlerts.push({
           id: `fail-${o.id}`,
           type: "error",
           title: "Transaksi Gagal",
           message: `Order #${o.id.substring(0,8)} gagal dispenser.`,
           time: new Date(o.created_at).toLocaleTimeString("id-ID", {hour: '2-digit', minute:'2-digit'})
         });
      });

      setAlerts(generatedAlerts);

      setStats({
        salesToday: financeData.salesToday || 0,
        criticalAlerts: generatedAlerts.length,
        temperature: currentTemp, // Use state
        lowStockItems: lowStockCount,
      });

      // 2. Activities
      const mappedActivities: Activity[] = ordersData.orders.slice(0, 5).map((order: any) => ({
        id: order.id,
        type: "sale",
        title: `Penjualan #${order.id.substring(0, 6)}`,
        time: new Date(order.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        value: `Rp ${(order.total_amount || 0).toLocaleString("id-ID")}`
      }));
      setActivities(mappedActivities);

    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    const user = localStorage.getItem("adminUser");

    if (!token) {
      router.replace("/admin");
      return;
    }

    if (user) {
      setCurrentUser(JSON.parse(user));
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // 30s refresh for other data
    return () => clearInterval(interval);
  }, [router]); // Re-run if temp changes to update alerts? No, fetchDashboard is on separate interval.
                     // But alerts depend on temp.
                     // Better: Update alerts locally in the temp effect?
                     // For now, let's keep fetchDashboard independent, but pass 'temp' to it?
                     // Actually, fetchDashboardData reads 'temp' from closure. It might be stale.
                     // 'temp' is in state. fetchDashboardData is defined in render scope, so it closes over 'temp'.
                     // But it's called by setInterval which captures the *initial* fetchDashboardData if not careful.
                     // Since fetchDashboardData is defined inside component body, it's recreated on every render.
                     // But the useEffect with [] dep uses the *first* version of fetchDashboardData.
                     
                     // FIX: Remove fetchDashboardData from dependency of generic effect, but 'temp' is used inside.
                     // I will remove 'temp' dependency from main Effect and let 'fetchDashboardData' use current value via ref or just ignore temp-based alerts syncing perfectly for now.
                     // OR better: Just update the stat card to use 'temp' (the state), and 'stats.temperature' becomes redundant/fallback.
                     
                     // Plan: Use 'temp' state directly in JSX for temperature card.
                     
  

  if (!currentUser) {
    return null;
  }

  return (
    <div className="flex h-screen bg-amber-50/20 font-sans">
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <header className="h-auto shrink-0 px-8 py-6 bg-white/50 backdrop-blur-sm border-b border-amber-100 z-10 sticky top-0">
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-amber-900 text-3xl font-black tracking-tight">
                Dashboard Utama
              </h2>
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <p className="text-gray-500 text-sm font-medium">
                  Sistem Operasional | Sinkronisasi: Baru saja
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAlertsModal(true)}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-white border border-amber-200 hover:border-amber-400 text-amber-900 font-bold text-sm shadow-sm hover:shadow-md transition-all"
              >
                <Bell className="h-4 w-4 text-amber-500" />
                <span>Notifikasi ({stats.criticalAlerts})</span>
              </button>
              <button 
                onClick={handleLock}
                className="flex items-center gap-2 h-10 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white border border-transparent font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <Lock className="h-4 w-4" />
                <span>Kunci Layar</span>
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-8 pt-6">
          {/* Stats Row */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Sales Card */}
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-amber-100/50 border border-amber-50 flex flex-col justify-between h-40 relative group hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute top-4 right-4 p-2 bg-amber-100 rounded-xl text-amber-600">
                <DollarSign className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Penjualan Hari Ini
                </p>
                <p className="text-amber-900 text-3xl font-black tracking-tight">
                  Rp {stats.salesToday.toLocaleString("id-ID")}
                  <span className="text-lg text-gray-400 font-bold">rb</span>
                </p>
              </div>
              <div className="flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded-lg">
                <TrendingUp className="h-3 w-3" />
                <span>+12% vs rata-rata</span>
              </div>
            </div>

            {/* Alerts Card */}
            <div 
              onClick={() => setShowAlertsModal(true)}
              className="bg-white p-6 rounded-3xl shadow-lg shadow-red-100/50 border border-red-50 flex flex-col justify-between h-40 relative group hover:border-red-200 transition-colors cursor-pointer"
            >
              <div className="absolute top-4 right-4 p-2 bg-red-100 rounded-xl text-red-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Alert Kritikal
                </p>
                <p className="text-gray-900 text-3xl font-black tracking-tight">
                  {stats.criticalAlerts}
                </p>
              </div>
              <div className="flex items-center gap-1 text-red-600 text-xs font-bold bg-red-50 w-fit px-2 py-1 rounded-lg">
                <span>Perlu Perhatian</span>
              </div>
            </div>

            {/* Temp Card */}
            <div className="bg-white p-6 rounded-3xl shadow-lg shadow-blue-100/50 border border-blue-50 flex flex-col justify-between h-40 relative group">
              <div className="absolute top-4 right-4 p-2 bg-blue-100 rounded-xl text-blue-500">
                <Thermometer className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Suhu Internal
                </p>
                <p className="text-gray-900 text-3xl font-black tracking-tight">
                  {temp /* Real-time */}°C
                </p>
              </div>
              <div className="flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 w-fit px-2 py-1 rounded-lg">
                <CheckCircle className="h-3 w-3" />
                <span>Stabil</span>
              </div>
            </div>

            {/* Low Stock Card */}
            <div 
              onClick={() => setShowLowStockModal(true)}
              className="bg-white p-6 rounded-3xl shadow-lg shadow-orange-100/50 border border-orange-50 flex flex-col justify-between h-40 relative group cursor-pointer hover:border-orange-200 transition-colors"
            >
              <div className="absolute top-4 right-4 p-2 bg-orange-100 rounded-xl text-orange-600">
                <Package className="h-6 w-6" />
              </div>
              <div>
                <p className="text-gray-500 text-sm font-medium mb-1">
                  Stok Menipis
                </p>
                <p className="text-gray-900 text-3xl font-black tracking-tight">
                  {stats.lowStockItems}
                </p>
              </div>
              <div className="flex items-center gap-1 text-orange-600 text-xs font-bold bg-orange-50 w-fit px-2 py-1 rounded-lg">
                <span>Restock Segera</span>
              </div>
            </div>
          </section>

          {/* Main Interactive Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8">
            {/* Quick Actions Grid (Takes up 2 columns) */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <h3 className="text-amber-900 text-xl font-bold tracking-tight flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-amber-500" /> Aksi Cepat
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Action Item 1 */}
                <button 
                  onClick={() => handleNavigation("/admin/temperature")}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all text-left group h-40 justify-between"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <History className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      Riwayat Suhu
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">
                      Cek pendingin & grafik suhu
                    </p>
                  </div>
                </button>

                {/* Action Item 2 */}
                <button 
                  onClick={() => handleNavigation("/admin/inventory")}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all text-left group h-40 justify-between relative overflow-hidden"
                >
                  <div className="absolute top-4 right-4 px-2 py-1 bg-orange-100 text-orange-600 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                    Penting
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Package className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      Manajemen Stok
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">
                      Isi ulang slot & update jumlah
                    </p>
                  </div>
                </button>

                {/* Action Item 3 */}
                <button 
                  onClick={() => handleNavigation("/admin/transactions")}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all text-left group h-40 justify-between"
                >
                  <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <ShoppingBag className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      Log Transaksi
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">
                      Lihat pembelian terakhir & error
                    </p>
                  </div>
                </button>

                {/* Action Item 4 */}
                <button 
                  onClick={() => handleNavigation("/admin/inventory")}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-white border border-amber-100 hover:border-amber-300 hover:shadow-lg hover:shadow-amber-100/50 transition-all text-left group h-40 justify-between"
                >
                  <div className="h-10 w-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-500 group-hover:scale-110 transition-transform">
                    <ActivityIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      Katalog Produk
                    </h4>
                    <p className="text-gray-500 text-xs mt-1">
                      Atur item & harga
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Side Panel (Alerts & Recent) */}
            <div className="flex flex-col gap-6 h-full">
              {/* Critical Alerts Panel */}
              <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-amber-100 shadow-sm h-full">
                <div className="flex justify-between items-center">
                  <h3 className="text-gray-900 text-lg font-bold tracking-tight">
                    Alert Sistem
                  </h3>
                  <button 
                    onClick={() => setShowAlertsModal(true)}
                    className="text-xs text-amber-500 font-bold hover:text-amber-600 uppercase tracking-wide"
                  >
                    Lihat Semua
                  </button>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px] pr-2 scrollbar-thin scrollbar-thumb-amber-200">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`flex gap-3 p-3 rounded-xl items-start ${
                        alert.type === "error"
                          ? "bg-red-50 border border-red-100"
                          : alert.type === "warning"
                          ? "bg-orange-50 border border-orange-100"
                          : "bg-blue-50 border border-blue-100"
                      }`}
                    >
                      <span className="shrink-0 mt-0.5">
                        {alert.type === "error" ? (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        ) : alert.type === "warning" ? (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-500" />
                        )}
                      </span>
                      <div>
                        <p className="text-gray-900 font-bold text-sm">
                          {alert.title}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 leading-relaxed">
                          {alert.message}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Mini List */}
              <div className="flex flex-col gap-4 bg-white p-6 rounded-3xl border border-amber-100 shadow-sm">
                <h3 className="text-gray-900 text-lg font-bold tracking-tight">
                  Aktivitas Terbaru
                </h3>
                <div className="flex flex-col gap-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-8 w-8 rounded-full flex items-center justify-center ${
                            activity.type === "sale"
                              ? "bg-green-100 text-green-600"
                              : activity.type === "login"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-orange-100 text-orange-600"
                          }`}
                        >
                          {activity.type === "sale" ? (
                            <ShoppingBag className="h-4 w-4" />
                          ) : activity.type === "login" ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Package className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {activity.title}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                            {activity.time}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-sm ${
                          activity.type === "sale"
                            ? "font-bold text-gray-900"
                            : "font-medium text-gray-500"
                        }`}
                      >
                        {activity.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center pb-6 opacity-40 hover:opacity-100 transition-opacity">
            <p className="text-xs text-amber-900 font-mono">
              Vendify System v2.0 • Status: OK • Server: sg-1
            </p>
          </div>
        </div>
      </main>

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Daftar Stok Menipis
              </h3>
              <button 
                onClick={() => setShowLowStockModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
               {lowStockList.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-bold">Stok Aman!</p>
                    <p className="text-sm">Tidak ada produk dengan stok di bawah 5.</p>
                 </div>
               ) : (
                 <div className="flex flex-col gap-4">
                    {lowStockList.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-4 bg-orange-50 rounded-2xl border border-orange-100">
                        {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-12 w-12 rounded-lg object-cover bg-white" />
                        ) : (
                            <div className="h-12 w-12 rounded-lg bg-orange-200 flex items-center justify-center text-orange-600">
                                <Package className="h-6 w-6" />
                            </div>
                        )}
                        <div className="flex-1">
                           <h4 className="font-bold text-gray-900">{item.name}</h4>
                           <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              <span className="bg-white px-2 py-0.5 rounded border border-orange-200 text-orange-700 font-mono font-bold">Slot {item.slot_number || item.slot_id}</span>
                              <span>Kap: {item.capacity}</span>
                           </div>
                        </div>
                        <div className="text-center">
                            <p className="text-xs text-gray-400 font-bold uppercase">Sisa</p>
                            <p className={`text-xl font-black ${item.current_stock === 0 ? "text-red-500" : "text-orange-600"}`}>
                                {item.current_stock}
                            </p>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100">
                 <button 
                    onClick={() => router.push("/admin/inventory")}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                 >
                    <Package className="h-5 w-5" />
                    Kelola Stok (Restock)
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* Critical Alerts Modal */}
      {showAlertsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Alert Sistem Kritikal
              </h3>
              <button 
                onClick={() => setShowAlertsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
               {alerts.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="font-bold">Sistem Normal!</p>
                    <p className="text-sm">Tidak ada alert yang terdeteksi saat ini.</p>
                 </div>
               ) : (
                 <div className="flex flex-col gap-4">
                    {alerts.map((alert) => (
                      <div 
                        key={alert.id} 
                        className={`flex gap-4 p-4 rounded-2xl border ${
                           alert.type === "error" ? "bg-red-50 border-red-100" : 
                           alert.type === "warning" ? "bg-orange-50 border-orange-100" :
                           "bg-blue-50 border-blue-100"
                        }`}
                      >
                         <div className={`p-3 rounded-xl h-fit ${
                            alert.type === "error" ? "bg-red-100 text-red-600" : 
                            alert.type === "warning" ? "bg-orange-100 text-orange-600" :
                            "bg-blue-100 text-blue-600"
                         }`}>
                             {alert.type === "error" ? <AlertTriangle className="h-6 w-6" /> : <Info className="h-6 w-6" />}
                         </div>
                         <div className="flex-1">
                            <h4 className={`font-bold text-lg ${
                                alert.type === "error" ? "text-red-900" : "text-gray-900"
                            }`}>
                                {alert.title}
                            </h4>
                            <p className="text-gray-600 text-sm mt-1 leading-relaxed">
                                {alert.message}
                            </p>
                            <span className="inline-block mt-3 text-xs font-bold text-gray-400 uppercase tracking-wide bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                                {alert.time}
                            </span>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 text-center">
                 <button 
                    onClick={() => setShowAlertsModal(false)}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl shadow-lg transition-all"
                 >
                    Tutup
                 </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Loader Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="flex flex-col items-center gap-4">
              <div className="relative">
                 <div className="w-16 h-16 border-4 border-amber-200 rounded-full"></div>
                 <div className="absolute top-0 left-0 w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-6 w-6 text-amber-600 animate-spin" />
                 </div>
              </div>
              <p className="text-amber-900 font-bold text-lg animate-pulse">
                Memuat Halaman...
              </p>
           </div>
        </div>
      )}
    </div>
  );
}
