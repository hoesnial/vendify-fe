"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Calendar,
  Clock,
  Thermometer,
  TrendingUp,
  Activity,
  Download,
  RefreshCw,
  Unlock,
  Settings,
  AlertTriangle,
  Info,
  CheckCircle2,
} from "lucide-react";

interface Alert {
  id: string;
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  severity: string;
  time: string;
  resolved?: boolean;
}

export default function TemperatureMonitor() {
  const router = useRouter();
  const [currentTemp, setCurrentTemp] = useState(0);
  const [targetMin] = useState(2.0);
  const [targetMax] = useState(8.0);
  const [sensorHealth] = useState({
    status: "Optimal",
    latency: "12ms",
    calibration: "3 hari lalu",
  });
  const [selectedPeriod, setSelectedPeriod] = useState<
    "day" | "week" | "month"
  >("day");
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  const alerts: Alert[] = [
    {
      id: "1",
      type: "warning",
      title: "Pintu Terbuka > 2 mnt",
      message: "Cek keamanan fisik",
      severity: "Warning",
      time: "10:45",
    },
    {
      id: "2",
      type: "info",
      title: "Kalibrasi Otomatis",
      message: "Maintenance rutin",
      severity: "Info",
      time: "Kemarin",
    },
    {
      id: "3",
      type: "error",
      title: "Lonjakan Suhu Terdeteksi",
      message: "Diatasi oleh Sistem",
      severity: "Resolved",
      time: "Kemarin",
      resolved: true,
    },
  ];

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin");
      return;
    }

    const fetchTemperature = async () => {
      try {
        const { vendingAPI } = await import("@/lib/api");
        const response = await vendingAPI.getTemperatureLogs("VM01"); // Default machine ID
        if (response.success && response.data && response.data.length > 0) {
           // Assuming data is latest first
           setCurrentTemp(response.data[0].value);
        }
      } catch (err) {
        console.error("Failed to fetch temp", err);
      }
    };

    fetchTemperature();

    // Set current date and time
    const now = new Date();
    setCurrentDate(
      now.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    );
    setCurrentTime(
      now.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );

    // Update time every minute
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      // Refresh temp every minute too
      fetchTemperature();
    }, 60000);

    return () => clearInterval(interval);
  }, [router]);

  // Calculate temperature position in range (for visual indicator)
  const tempPosition =
    ((currentTemp - targetMin) / (targetMax - targetMin)) * 100;

  return (
    <div className="flex h-screen bg-amber-50/20 font-sans">
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto p-8 lg:p-12">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl font-black tracking-tight text-amber-900">
              Monitor Suhu
            </h2>
            <p className="mt-2 text-lg text-gray-500">
              Status kontrol iklim internal • Unit #402
            </p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 border border-amber-100 shadow-sm">
              <Calendar className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-gray-700">
                {currentDate}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 border border-amber-100 shadow-sm">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-bold text-gray-700">
                {currentTime} WIB
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 mb-8">
          {/* Hero Temp Card */}
          <div className="relative flex flex-col justify-between overflow-hidden rounded-3xl bg-white p-6 shadow-lg shadow-amber-100/50 border border-amber-50 transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex justify-between items-start z-10">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Suhu Saat Ini
                </p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-6xl font-black tracking-tighter text-amber-900">
                    {currentTemp.toFixed(1)}
                  </span>
                  <span className="text-2xl font-bold text-amber-500">°C</span>
                </div>
              </div>
              <div
                className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-conic from-amber-400 via-amber-100 to-amber-50"
                style={{
                  background: `conic-gradient(#fbbf24 0% 65%, #fef3c7 65% 100%)`,
                }}
              >
                <div className="absolute h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-inner">
                  <Thermometer className="h-8 w-8 text-amber-500" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 w-fit">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-bold text-green-600">
                +0.1% vs jam lalu
              </span>
            </div>
            {/* Decor bg */}
            <div className="absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-amber-400/10 blur-2xl"></div>
          </div>

          {/* Target Range Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-lg shadow-amber-100/50 border border-amber-50">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Rentang Target
              </p>
              <div className="mt-6 flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                    <span>{targetMin}°C</span>
                    <span>{targetMax}°C</span>
                  </div>
                  <div className="relative h-4 w-full rounded-full bg-gray-100 inner-shadow">
                    {/* Range Indicator */}
                    <div className="absolute left-[20%] right-[20%] h-full rounded-full bg-green-100 border border-green-200/50"></div>
                    {/* Current Indicator */}
                    <div
                      className="absolute top-1/2 h-7 w-2 -translate-y-1/2 rounded-full bg-amber-500 shadow-md ring-2 ring-white transition-all"
                      style={{
                        left: `${Math.min(Math.max(tempPosition, 0), 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              <p className="mt-6 text-3xl font-bold text-gray-900">
                {targetMin}°C - {targetMax}°C
              </p>
            </div>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Rentang optimal untuk snack & minuman.
            </p>
          </div>

          {/* Sensor Health Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-lg shadow-amber-100/50 border border-amber-50">
            <div className="flex justify-between items-start">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Kesehatan Sensor
              </p>
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-green-600">
                {sensorHealth.status}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span className="text-gray-500">Latency</span>
                  <span className="font-bold text-gray-900">
                    {sensorHealth.latency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Kalibrasi</span>
                  <span className="font-bold text-gray-900">
                    {sensorHealth.calibration}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="mb-8 flex flex-col rounded-3xl bg-white p-6 lg:p-8 shadow-lg shadow-amber-100/50 border border-amber-50">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Riwayat Suhu 24-Jam
              </h3>
              <p className="text-sm text-gray-500 font-medium">
                Rata-rata: 4.1°C
              </p>
            </div>
            <div className="flex gap-2 bg-gray-50 p-1 rounded-xl">
              <button
                onClick={() => setSelectedPeriod("day")}
                className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all shadow-sm ${
                  selectedPeriod === "day"
                    ? "bg-white text-amber-600"
                    : "bg-transparent text-gray-500 hover:text-gray-900 shadow-none border-transparent"
                }`}
              >
                Hari
              </button>
              <button
                onClick={() => setSelectedPeriod("week")}
                className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all shadow-sm ${
                  selectedPeriod === "week"
                    ? "bg-white text-amber-600"
                    : "bg-transparent text-gray-500 hover:text-gray-900 shadow-none border-transparent"
                }`}
              >
                Minggu
              </button>
              <button
                onClick={() => setSelectedPeriod("month")}
                className={`rounded-lg px-4 py-1.5 text-sm font-bold transition-all shadow-sm ${
                  selectedPeriod === "month"
                    ? "bg-white text-amber-600"
                    : "bg-transparent text-gray-500 hover:text-gray-900 shadow-none border-transparent"
                }`}
              >
                Bulan
              </button>
            </div>
          </div>

          {/* Chart SVG */}
          <div className="relative h-64 w-full">
            <svg
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
              viewBox="0 0 1200 300"
            >
              <defs>
                <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="#f59e0b"
                    stopOpacity="0.2"
                  ></stop>
                  <stop
                    offset="100%"
                    stopColor="#f59e0b"
                    stopOpacity="0.0"
                  ></stop>
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line
                stroke="#f3f4f6"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="1200"
                y1="75"
                y2="75"
              ></line>
              <line
                stroke="#f3f4f6"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="1200"
                y1="150"
                y2="150"
              ></line>
              <line
                stroke="#f3f4f6"
                strokeDasharray="4 4"
                strokeWidth="1"
                x1="0"
                x2="1200"
                y1="225"
                y2="225"
              ></line>
              {/* Area */}
              <path
                d="M0,180 C100,170 150,200 250,190 C350,180 400,120 500,130 C600,140 650,160 750,150 C850,140 900,100 1000,110 C1100,120 1150,140 1200,130 V300 H0 Z"
                fill="url(#chartGradient)"
              ></path>
              {/* Line */}
              <path
                d="M0,180 C100,170 150,200 250,190 C350,180 400,120 500,130 C600,140 650,160 750,150 C850,140 900,100 1000,110 C1100,120 1150,140 1200,130"
                fill="none"
                stroke="#f59e0b"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
              ></path>
              {/* Points */}
              <circle
                cx="500"
                cy="130"
                fill="#fff"
                r="6"
                stroke="#f59e0b"
                strokeWidth="3"
              ></circle>
              <circle
                cx="1000"
                cy="110"
                fill="#fff"
                r="6"
                stroke="#f59e0b"
                strokeWidth="3"
              ></circle>
            </svg>
            {/* X Axis Labels */}
            <div className="flex justify-between mt-4 text-xs font-bold text-gray-400">
              <span>12 PM</span>
              <span>4 PM</span>
              <span>8 PM</span>
              <span>12 AM</span>
              <span>4 AM</span>
              <span>8 AM</span>
              <span>Sekarang</span>
            </div>
          </div>
        </div>

        {/* Bottom Row: Alerts & Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Alerts */}
          <div className="flex flex-col rounded-3xl bg-white p-6 shadow-lg shadow-amber-100/50 border border-amber-50">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Alert Terbaru</h3>
              <a
                className="text-sm font-bold text-amber-500 hover:text-amber-600"
                href="#"
              >
                Lihat Semua
              </a>
            </div>
            <div className="flex flex-col gap-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-colors ${
                    alert.type === "warning"
                      ? "border-orange-100 bg-orange-50/50"
                      : alert.type === "error"
                      ? "border-red-100 bg-red-50/50"
                      : "border-gray-100 bg-gray-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      alert.type === "warning"
                        ? "bg-orange-100 text-orange-600"
                        : alert.type === "error"
                        ? "bg-red-100 text-red-600"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    {alert.type === "warning" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : alert.type === "error" ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <Info className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-bold text-gray-900 ${
                        alert.resolved
                          ? "line-through decoration-gray-400 decoration-2 text-gray-400"
                          : ""
                      }`}
                    >
                      {alert.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {alert.message}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-xs font-bold ${
                        alert.severity === "Warning"
                          ? "text-orange-600"
                          : alert.severity === "Resolved"
                          ? "text-green-600"
                          : "text-blue-600"
                      }`}
                    >
                      {alert.severity}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium uppercase mt-0.5">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-1 flex-col justify-center rounded-3xl bg-white p-6 shadow-lg shadow-amber-100/50 border border-amber-50">
            <h3 className="mb-6 text-xl font-bold text-gray-900">Aksi Cepat</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 p-6 text-center transition-all hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 group">
                <Settings className="h-8 w-8 text-gray-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-amber-900">
                  Kalibrasi Sensor
                </span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 p-6 text-center transition-all hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 group">
                <Download className="h-8 w-8 text-gray-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-amber-900">
                  Export Log
                </span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 p-6 text-center transition-all hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 group">
                <RefreshCw className="h-8 w-8 text-gray-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-amber-900">
                  Refresh Data
                </span>
              </button>
              <button className="flex flex-col items-center justify-center gap-3 rounded-2xl bg-gray-50 p-6 text-center transition-all hover:bg-amber-50 hover:ring-2 hover:ring-amber-200 group">
                <Unlock className="h-8 w-8 text-gray-400 group-hover:text-amber-500 transition-colors" />
                <span className="text-sm font-bold text-gray-700 group-hover:text-amber-900">
                  Buka Kunci Remote
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
