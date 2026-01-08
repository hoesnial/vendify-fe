"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Lock, User, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { AxiosError } from "axios";

interface AdminLoginProps {
  onLogin: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Call backend API for authentication
      const { vendingAPI } = await import("@/lib/api");
      const response = await vendingAPI.adminLogin({
        username: formData.username,
        password: formData.password,
      });

      // Save token and user info to localStorage
      localStorage.setItem("adminToken", response.token);
      localStorage.setItem("adminUser", JSON.stringify(response.user));
      localStorage.setItem("isAdminLoggedIn", "true");

      toast.success("Login berhasil!");
      onLogin();
    } catch (error: unknown) {
      console.error("Login error:", error);
      const errorMessage =
        (error as AxiosError<{ error?: string }>)?.response?.data?.error ||
        (error as Error).message ||
        "Terjadi kesalahan pada server";
      console.error("Login detailed error:", error);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl shadow-amber-100/50 border-amber-100">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="bg-amber-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
              <Lock className="h-10 w-10 text-amber-600" />
            </div>
            <h1 className="text-3xl font-black text-amber-900 tracking-tight">
              Vendify Admin
            </h1>
            <p className="text-amber-700/60 mt-2 font-medium">
              Portal Manajemen Vending Machine
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-amber-300/50 text-amber-900"
                  placeholder="Masukkan username"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-amber-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-amber-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white placeholder-amber-300/50 text-amber-900"
                  placeholder="Masukkan password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-amber-400 hover:text-amber-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              disabled={isLoading}
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-200 border-none"
            >
              {isLoading ? "Memproses..." : "Masuk Dashboard"}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-center">
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">
              Akun Demo
            </p>
            <p className="text-sm text-amber-700">
              <span className="font-mono bg-amber-100 px-2 py-1 rounded text-amber-900">
                admin
              </span>
              <span className="mx-2 text-amber-300">|</span>
              <span className="font-mono bg-amber-100 px-2 py-1 rounded text-amber-900">
                admin123
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
      
      <div className="absolute bottom-6 text-center text-amber-900/40 text-sm font-medium">
        &copy; 2024 Vendify System v2.0
      </div>
    </div>
  );
};

export default AdminLogin;
