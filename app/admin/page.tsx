"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLogin from "@/components/AdminLogin";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is already logged in
    const token = localStorage.getItem("adminToken");
    if (token) {
      // Redirect to dashboard if already logged in
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleLogin = () => {
    // After successful login, redirect to dashboard
    router.push("/admin/dashboard");
  };

  return <AdminLogin onLogin={handleLogin} />;
}
