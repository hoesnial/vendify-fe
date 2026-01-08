"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { vendingAPI } from "@/lib/api";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Wallet,
  Download,
  Calendar,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

interface KPIStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  avgTransaction: number;
  totalTransactions: number;
}

interface TopProduct {
  id: string;
  name: string;
  productId: string;
  revenue: number;
  units: number;
  image: string;
}

interface Transaction {
  id: string;
  type: "purchase" | "warning";
  title: string;
  amount?: string;
  details: string;
  time: string;
}

export default function FinancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"today" | "week" | "month" | "year">(
    "month"
  );

  const [stats, setStats] = useState<KPIStats>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    avgTransaction: 0,
    totalTransactions: 0,
  });

  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin");
      return;
    }

    fetchFinanceData();
  }, [router]);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      const data = await vendingAPI.getFinanceSummary();
      
      // Calculate derived stats
      // Assuming 70% restocking/maintenance cost for now as we don't track actual expenses
      const derivedExpenses = Math.round(data.totalRevenue * 0.7); 
      const derivedNetProfit = data.totalRevenue - derivedExpenses;

      setStats({
        totalRevenue: data.totalRevenue || 0,
        totalExpenses: derivedExpenses,
        netProfit: derivedNetProfit,
        avgTransaction: data.averageOrderValue || 0,
        totalTransactions: data.totalTransactions || 0,
      });

      // Map recent transactions
      if (data.recentTransactions) {
        setTransactions(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            data.recentTransactions.map((tx: any) => ({
            id: tx.id,
            type: "purchase",
            title: `Order #${tx.id.substring(0, 8)}...`,
            amount: `+${formatIDR(tx.amount)}`,
            details: `${tx.status} • ${tx.customer === "Guest" ? "Pengguna Tamu" : tx.customer}`,
            time: new Date(tx.date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }),
            dateObj: new Date(tx.date) 
          }))
        );
      }

      if (data.monthlyData) {
        setMonthlyData(data.monthlyData);
      }

    } catch (error) {
      console.error("Failed to fetch finance data:", error);
      toast.error("Gagal memuat data keuangan");
    } finally {
      setLoading(false);
    }
  };

  // Helper to format currency
  const formatIDR = (value: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex h-screen bg-amber-50/20 font-sans">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="max-w-[1200px] w-full mx-auto p-4 md:p-6 lg:p-8 flex flex-col gap-6">
          {/* Page Heading */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                <span>Admin</span>
                <ChevronRight className="h-3 w-3" />
                <span>Keuangan</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-amber-900">
                Ringkasan Keuangan
              </h1>
              <p className="text-gray-500 font-medium">
                Data real-time dari database penjualan
              </p>
            </div>
            <button 
              onClick={fetchFinanceData}
              className="flex shrink-0 cursor-pointer items-center gap-2 justify-center rounded-xl h-12 px-6 bg-white border border-amber-100 hover:border-amber-300 hover:text-amber-600 text-gray-500 font-bold shadow-sm transition-all hover:-translate-y-0.5">
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Data</span>
            </button>
          </header>

          {/* KPI Cards */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="flex flex-col gap-3 rounded-3xl p-6 bg-white border border-amber-50 shadow-lg shadow-amber-100/50 hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm font-bold">
                  Total Pendapatan
                </p>
                <div className="bg-amber-100 p-2 rounded-xl">
                  <DollarSign className="h-5 w-5 text-amber-600" />
                </div>
              </div>
              <p className="text-gray-900 text-2xl font-black tracking-tight truncate">
                {formatIDR(stats.totalRevenue)}
              </p>
              <div className="flex items-center gap-1">
                 <span className="text-gray-400 text-xs font-medium ml-1">
                  Lifetime Revenue
                </span>
              </div>
            </div>

            {/* Total Expenses (Estimated) */}
            <div className="flex flex-col gap-3 rounded-3xl p-6 bg-white border border-amber-50 shadow-lg shadow-amber-100/50 hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm font-bold">
                  Estimasi Biaya
                </p>
                <div className="bg-orange-100 p-2 rounded-xl">
                  <CreditCard className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <p className="text-gray-900 text-2xl font-black tracking-tight truncate">
                {formatIDR(stats.totalExpenses)}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs font-medium ml-1">
                  ~70% dari pendapatan
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex flex-col gap-3 rounded-3xl p-6 bg-amber-500 border border-amber-400 shadow-lg shadow-amber-200 hover:-translate-y-1 transition-transform relative overflow-hidden group">
              {/* Decorative bg accent */}
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>
              <div className="flex items-center justify-between relative z-10">
                <p className="text-amber-100 text-sm font-bold">Laba Kotor (Est)</p>
                <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                  <Wallet className="h-5 w-5 text-white" />
                </div>
              </div>
              <p className="text-white text-2xl font-black tracking-tight relative z-10 truncate">
                {formatIDR(stats.netProfit)}
              </p>
              <div className="flex items-center gap-1 relative z-10">
                <div className="flex items-center text-white bg-white/20 px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
                  <ArrowUpRight className="h-3 w-3" />
                  <span className="text-xs font-bold">30%</span>
                </div>
                <span className="text-amber-100/70 text-xs font-medium ml-1">
                  Margin
                </span>
              </div>
            </div>

            {/* Avg Transaction */}
            <div className="flex flex-col gap-3 rounded-3xl p-6 bg-white border border-amber-50 shadow-lg shadow-amber-100/50 hover:-translate-y-1 transition-transform">
              <div className="flex items-center justify-between">
                <p className="text-gray-500 text-sm font-bold">
                  Rata-rata Transaksi
                </p>
                <div className="bg-blue-100 p-2 rounded-xl">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <p className="text-gray-900 text-2xl font-black tracking-tight truncate">
                {formatIDR(stats.avgTransaction)}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-xs font-medium ml-1">
                  Dari {stats.totalTransactions} transaksi
                </span>
              </div>
            </div>
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Trends Chart */}
            <div className="lg:col-span-2 rounded-3xl bg-white border border-amber-50 shadow-lg shadow-amber-100/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-amber-900 text-lg font-black">
                    Tren Pendapatan Bulanan
                  </h3>
                  <p className="text-gray-500 text-sm font-medium">
                    6 Bulan Terakhir
                  </p>
                </div>
              </div>
              
              {/* Simple Bar Chart Visualization using Flexbox since we don't have chart lib */}
              <div className="w-full h-[240px] flex items-end justify-between px-4 gap-4">
                  {monthlyData.length > 0 ? monthlyData.map((data, idx) => {
                      // Normalize height relative to max revenue
                      const maxRevenue = Math.max(...monthlyData.map(m => m.revenue)) || 1;
                      const heightPercent = Math.max((data.revenue / maxRevenue) * 100, 5); // min 5% height
                      
                      return (
                          <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer">
                              <div className="relative w-full bg-amber-100 rounded-t-xl hover:bg-amber-400 transition-colors duration-300" style={{ height: `${heightPercent}%` }}>
                                  {/* Tooltip */}
                                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                                      {formatIDR(data.revenue)}
                                  </div>
                              </div>
                              <p className="text-xs font-bold text-gray-500 mt-2 rotate-0 group-hover:text-amber-600">{data.month.split(' ')[0]}</p>
                          </div>
                      );
                  }) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                          Belum ada data bulanan
                      </div>
                  )}
              </div>
            </div>

            {/* Expense Breakdown */}
            <div className="flex flex-col rounded-3xl bg-white border border-amber-50 shadow-lg shadow-amber-100/50 p-6">
              <h3 className="text-amber-900 text-lg font-black mb-4">
                Estimasi Pengeluaran
              </h3>
              <div className="flex-1 flex flex-col justify-center gap-6">
                {/* Donut Chart Representation */}
                <div className="flex justify-center py-2">
                  <div className="relative w-40 h-40">
                    <svg
                      className="w-full h-full -rotate-90"
                      viewBox="0 0 36 36"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      {/* Ring 1 */}
                      <circle
                        className="stroke-gray-100"
                        cx="18"
                        cy="18"
                        fill="none"
                        r="16"
                        strokeWidth="3.5"
                      ></circle>
                      {/* Ring 2 (Value) */}
                      <circle
                        className="stroke-amber-500"
                        cx="18"
                        cy="18"
                        fill="none"
                        r="16"
                        strokeDasharray="70 100"
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      ></circle>
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-1">
                        Est. Biaya
                      </span>
                      <p className="text-amber-900 font-black text-sm">{formatIDR(stats.totalExpenses)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/50 border border-amber-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm shadow-amber-200"></div>
                      <p className="text-gray-600 text-sm font-bold">
                        Restock & Maintenance
                      </p>
                    </div>
                    <p className="text-amber-900 text-sm font-black">70%</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-center italic">
                    *Estimasi berdasarkan margin standar 30%
                </p>
              </div>
            </div>
          </section>

          {/* Recent Transactions Feed */}
          <section className="grid grid-cols-1 gap-6 pb-8">
            <div className="rounded-3xl bg-white border border-amber-50 shadow-lg shadow-amber-100/50 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-amber-900 text-lg font-black flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-amber-500" />
                  Transaksi Terbaru
                </h3>
              </div>
              <div className="flex flex-col relative pl-2">
                {/* Timeline Line */}
                <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100"></div>
                {transactions.length > 0 ? transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex gap-4 items-start p-3 relative hover:bg-amber-50/50 rounded-2xl transition-colors group"
                  >
                    <div
                      className={`z-10 relative flex items-center justify-center w-8 h-8 rounded-full shrink-0 border-4 border-white shadow-sm bg-green-100 text-green-600`}
                    >
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col flex-1 gap-1">
                      <div className="flex justify-between items-center">
                        <p className="text-gray-900 text-sm font-bold group-hover:text-amber-700 transition-colors">
                          {transaction.title}
                        </p>
                        <p className="text-green-600 text-sm font-black">
                        {transaction.amount}
                        </p>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-gray-500 text-xs font-medium">
                          {transaction.details}
                        </p>
                        <p className="text-gray-400 text-xs font-medium">
                          {transaction.time}
                        </p>
                      </div>
                    </div>
                  </div>
                )) : (
                    <div className="p-8 text-center text-gray-500">
                        Belum ada transaksi yang tercatat.
                    </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

