"use client";

import React from "react";
import Image from "next/image";
import { useVendingStore } from "@/lib/store";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import toast from "react-hot-toast";

const CartScreen: React.FC = () => {
  const { cartItems, setCurrentScreen, removeFromCart, updateCartQuantity } =
    useVendingStore();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "/images/placeholder-product.svg";
    if (imageUrl.startsWith("http")) return imageUrl;
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    return `${backendUrl}${imageUrl}`;
  };

  const subtotal = cartItems.reduce(
    (sum, item) =>
      sum + (item.product.final_price ?? item.product.price) * item.quantity,
    0
  );
  const serviceFee = 5000;
  const total = subtotal + serviceFee;

  const handleBack = () => {
    setCurrentScreen("home");
  };

  const handleRemove = (productId: number) => {
    removeFromCart(productId);
    toast.success("Produk dihapus dari keranjang");
  };

  const handleQuantityChange = (productId: number, delta: number) => {
    const item = cartItems.find((i) => i.product.id === productId);
    if (item) {
      const newQuantity = item.quantity + delta;
      if (newQuantity >= 1 && newQuantity <= 10) {
        updateCartQuantity(productId, newQuantity);
      }
    }
  };

  const handleProceedToPayment = () => {
    if (cartItems.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }
    // Navigate to order summary for multi-item checkout
    setCurrentScreen("order-summary");
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50/30 p-4">
        <div className="w-full max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 text-center border border-amber-100">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-10 w-10 text-orange-500" />
          </div>
          <h1 className="text-2xl font-black text-amber-900 mb-2">
            Keranjang Kosong
          </h1>
          <p className="text-gray-500 mb-8">
            Belum ada produk di keranjang belanja Anda.
          </p>
          <button
            onClick={handleBack}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-lg hover:bg-orange-600 transition-all shadow-lg shadow-orange-200"
          >
            Mulai Belanja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-amber-50/30 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-xl flex flex-col h-[90vh] max-h-[960px] border border-amber-100 overflow-hidden">
        {/* Header */}
        <header className="p-6 flex items-center bg-white border-b border-gray-100 sticky top-0 z-10">
          <button
            onClick={handleBack}
            className="p-3 rounded-full hover:bg-orange-50 text-orange-500 transition-colors bg-white border border-gray-100 shadow-sm"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-black text-center flex-grow text-amber-900 tracking-tight">
            Keranjang Belanja
          </h1>
          <div className="w-11"></div>
        </header>

        {/* Cart Items */}
        <main className="flex-grow overflow-y-auto px-6 py-4 space-y-4 bg-amber-50/30">
          {cartItems.map((item) => {
            const unitPrice = item.product.final_price ?? item.product.price;
            return (
              <div
                key={item.product.id}
                className="flex items-center bg-white p-4 rounded-2xl shadow-sm border border-amber-100/50 hover:border-orange-200 transition-colors"
              >
                {/* Product Image */}
                <div className="relative w-20 h-20 rounded-xl overflow-hidden mr-4 flex-shrink-0 bg-gray-50 border border-gray-100">
                  <Image
                    src={getImageUrl(item.product.image_url)}
                    alt={item.product.name}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h2 className="font-bold text-gray-900 leading-tight mb-1">
                        {item.product.name}
                      </h2>
                      <p className="text-sm font-bold text-orange-600">
                        {formatPrice(unitPrice)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.product.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between bg-amber-50 rounded-xl p-1 w-28 border border-amber-100">
                    <button
                      onClick={() => handleQuantityChange(item.product.id, -1)}
                      disabled={item.quantity <= 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-orange-600 transition-colors"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="flex-1 text-center font-bold text-gray-900 text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, 1)}
                      disabled={item.quantity >= 10}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-orange-500 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 transition-colors"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </main>

        {/* Footer */}
        <footer className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-gray-500 text-sm font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 text-sm font-medium">
              <span>Biaya Layanan</span>
              <span>{formatPrice(serviceFee)}</span>
            </div>
            <div className="h-px bg-gray-100 my-2"></div>
            <div className="flex justify-between items-end">
              <span className="text-gray-900 font-bold">Total Pembayaran</span>
              <span className="text-2xl font-black text-orange-600">
                {formatPrice(total)}
              </span>
            </div>
          </div>
          <button
            onClick={handleProceedToPayment}
            className="w-full bg-orange-500 text-white font-bold py-4 rounded-2xl text-lg shadow-lg shadow-orange-200 hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-200 transition-all transform active:scale-95"
          >
            Lanjut ke Pembayaran
          </button>
        </footer>
      </div>
    </div>
  );
};

export default CartScreen;
