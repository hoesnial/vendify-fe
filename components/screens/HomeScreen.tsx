"use client";

import React, { useState, useEffect } from "react";
import { useVendingStore } from "@/lib/store";
import { vendingAPI, Product } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Loading } from "@/components/ui/Loading";
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Store,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
// import Link from "next/link";
import toast from "react-hot-toast";
import PrescriptionScanModal from "@/components/PrescriptionScanModal";
import Image from "next/image";

const HomeScreen: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

  const { setSelectedProduct, setCurrentScreen, isOnline, cartItems } =
    useVendingStore();

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const response = await vendingAPI.getAvailableProducts();
      setProducts(response.products);
      setLastUpdate(new Date());
      toast.success("Produk berhasil dimuat");
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    // Auto refresh every 5 minutes
    const interval = setInterval(loadProducts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setCurrentScreen("product-detail");
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return <Loading message="Memuat produk..." fullScreen />;
  }

  return (
    <div className="min-h-screen bg-amber-50/30">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header - Yellow Theme */}
        <div className="flex items-center justify-between mb-8 rounded-3xl bg-amber-400 p-6 shadow-lg shadow-amber-200 border border-amber-300">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white/30 rounded-2xl backdrop-blur-sm border border-white/20">
              <Store className="h-8 w-8 text-amber-900" />
            </div>

            <div>
              <div className="flex items-center gap-3 text-amber-900/80">
                <p className="text-sm font-bold tracking-wide uppercase">
                  Vending Machine
                </p>
              </div>
              <h1 className="text-4xl font-black text-amber-900 mb-1 tracking-tight drop-shadow-sm">
                Vendify
              </h1>
              <p className="text-amber-900/90 font-medium text-sm">
                Snack favoritmu, sekali tap
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            {isOnline ? (
              <div className="flex items-center border border-white/40 bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full shadow-sm">
                <Wifi className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold tracking-wide">
                  Online
                </span>
              </div>
            ) : (
              <div className="flex items-center border border-white/40 bg-red-500 text-white px-4 py-2 rounded-full shadow-sm">
                <WifiOff className="h-4 w-4 mr-2" />
                <span className="text-sm font-bold tracking-wide">
                  Offline
                </span>
              </div>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setCurrentScreen("cart")}
              className="relative flex items-center px-5 py-2 rounded-full bg-white border-2 border-orange-400 text-orange-600 shadow-md hover:bg-orange-50 transition-colors"
              title="Lihat Keranjang"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              <span className="text-sm font-bold tracking-wide">
                Keranjang
              </span>
              {cartItems.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white animate-bounce">
                  {cartItems.length}
                </span>
              )}
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadProducts}
              disabled={isLoading}
              className="p-2 rounded-full bg-white/20 text-white border border-white/30 shadow-sm hover:bg-white/30 transition-colors"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 rounded-3xl border border-dashed border-amber-200 bg-white/70">
            <div className="w-32 h-32 mx-auto mb-6 bg-amber-50 rounded-full flex items-center justify-center shadow-inner">
              <svg
                className="h-16 w-16 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">
              Stok belum tersedia
            </h3>
            <p className="text-gray-500 mb-6">
              Silakan hubungi operator untuk mengisi ulang.
            </p>
            <button
              onClick={loadProducts}
              className="inline-flex items-center bg-amber-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-amber-600 transition-colors font-bold"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Muat ulang
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 rounded-3xl border-2 border-amber-100 bg-white/60 p-6 shadow-xl shadow-amber-50/50 backdrop-blur-sm">
            {products.map((product) => (
              <div
                key={product.id}
                className="animate-fadeIn rounded-2xl bg-white ring-1 ring-gray-100 shadow-sm hover:-translate-y-2 hover:shadow-xl hover:shadow-amber-100/50 hover:ring-amber-200 transition-all duration-300"
              >
                <ProductCard
                  product={product}
                  onSelect={handleProductSelect}
                  disabled={!isOnline}
                />
              </div>
            ))}
          </div>
        )}

        {/* Footer Status */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-100 bg-white/80 px-4 py-2 shadow-sm">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <p>Terakhir diperbarui {formatTime(lastUpdate)}</p>
          </div>
        </div>
      </div>

      {/* Prescription Scan Modal */}
      <PrescriptionScanModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onAddToCart={handleProductSelect}
      />
    </div>
  );
};

export default HomeScreen;
