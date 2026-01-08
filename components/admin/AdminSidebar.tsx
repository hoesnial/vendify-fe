"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { vendingAPI } from "@/lib/api";
import {
  Store,
  LayoutDashboard,
  Thermometer,
  Package,
  Wallet,
  Receipt,
  Megaphone,
  Users,
  LogOut,
  CheckCircle2,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/dashboard",
    },
    {
      id: "temperature",
      label: "Temperature",
      icon: Thermometer,
      href: "/admin/temperature",
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Package,
      href: "/admin/inventory",
    },
    {
      id: "finance",
      label: "Finance",
      icon: Wallet,
      href: "/admin/finance",
    },
    {
      id: "transactions",
      label: "Transactions",
      icon: Receipt,
      href: "/admin/transactions",
    },

    {
      id: "announcements",
      label: "Announcements",
      icon: Megaphone,
      href: "/admin/announcements",
    },
    { id: "users", label: "Users", icon: Users, href: "/admin/users" },
  ];

  const handleLogout = async () => {
    try {
      await vendingAPI.adminLogout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Remove all admin tokens
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      localStorage.removeItem("isAdminLoggedIn");
      // Force full page reload to clear all state
      window.location.href = "/admin";
    }
  };

  return (
    <aside className="w-72 h-screen bg-white border-r border-amber-100 flex flex-col flex-shrink-0 font-sans shadow-lg shadow-amber-50 z-20">
      {/* Top Section - Fixed */}
      <div className="p-6 border-b border-amber-100">
        {/* Brand Logo */}
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center rounded-2xl bg-amber-100 p-2.5 shadow-sm">
            <Store className="h-7 w-7 text-amber-600" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-black leading-tight tracking-tight text-amber-900 font-sans">
              Vendify
            </h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Admin Console
            </p>
          </div>
        </div>
      </div>

      {/* Middle Section - Scrollable */}
      <div className="flex-1 overflow-y-auto no-scrollbar py-6 px-4">
        {/* Navigation Links */}
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`group flex items-center gap-4 rounded-xl px-4 py-3.5 transition-all duration-200 ${
                  isActive
                    ? "bg-amber-50 text-amber-700 shadow-sm ring-1 ring-amber-100"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 active:scale-95"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${
                    isActive
                      ? "text-amber-600 fill-amber-600/20"
                      : "text-gray-400 group-hover:text-amber-500"
                  }`}
                />
                <span className="text-sm font-bold tracking-wide">
                  {item.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Section - Fixed */}
      <div className="p-6 border-t border-amber-100 flex flex-col gap-4 bg-gray-50/50">
        <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Status Sistem
            </p>
            <p className="font-bold text-emerald-600 text-sm">Terhubung</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all active:scale-95"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
