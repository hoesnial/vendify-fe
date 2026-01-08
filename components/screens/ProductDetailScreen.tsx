"use client";

import React from "react";
import Image from "next/image";
import { useVendingStore } from "@/lib/store";
import { CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ArrowLeft,
  Plus,
  Minus,
  Tag,
  Info,
  ShoppingBag,
  CreditCard,
  ShoppingCart,
} from "lucide-react";
import toast from "react-hot-toast";

const ProductDetailScreen: React.FC = () => {
  const {
    selectedProduct,
    quantity,
    setQuantity,
    setCurrentScreen,
    resetTransaction,
    addToCart,
  } = useVendingStore();

  if (!selectedProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Produk tidak ditemukan</p>
          <Button
            variant="primary"
            onClick={() => setCurrentScreen("home")}
            className="bg-amber-500 hover:bg-amber-600 text-white border-none"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get full image URL
  const getImageUrl = (imageUrl: string | null) => {
    if (!imageUrl) return "/images/placeholder-product.svg";
    if (imageUrl.startsWith("http")) return imageUrl;
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
    return `${backendUrl}${imageUrl}`;
  };

  const unitPrice = selectedProduct.final_price ?? selectedProduct.price;
  const totalPrice = unitPrice * quantity;
  const maxQuantity = Math.min(10, selectedProduct.current_stock ?? 0);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  const handleBack = () => {
    resetTransaction();
    setCurrentScreen("home");
  };

  const handleContinue = () => {
    // "Beli Sekarang" logic: Add to cart then go to checkout directly?
    // Or just go to checkout with single item?
    // Usually 'Buy Now' implies checkout immediately.
    // For simplicity, we'll add to cart and go to cart/summary.
    addToCart(selectedProduct, quantity);
    setCurrentScreen("order-summary");
  };

  const handleAddToCart = () => {
    if (selectedProduct) {
      addToCart(selectedProduct, quantity);
      toast.success(`${selectedProduct.name} masuk keranjang!`);
      setQuantity(1);
      setCurrentScreen("home");
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="p-3 rounded-full bg-white border-2 border-amber-100 text-amber-500 shadow-sm hover:shadow-md hover:border-amber-300 transition-all mr-4"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-bold uppercase tracking-wide text-xs mb-1">
              <Info className="h-4 w-4" /> Detail Produk
            </div>
            <h1 className="text-3xl font-black text-amber-900 tracking-tight">
              Info Snack
            </h1>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-amber-100 shadow-xl shadow-amber-100/50 overflow-hidden">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2 gap-0">
              {/* Left Side: Image */}
              <div className="p-8 bg-amber-50/50 flex flex-col justify-center">
                <div className="relative aspect-square w-full rounded-3xl bg-white p-4 shadow-inner border border-amber-100/50">
                  <div className="relative w-full h-full rounded-2xl overflow-hidden">
                    <Image
                      src={getImageUrl(selectedProduct.image_url)}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>

                {/* Stock Chips */}
                <div className="mt-6 flex justify-between items-center text-sm font-medium">
                  <div className="px-4 py-2 bg-white rounded-full border border-amber-100 text-amber-800 shadow-sm">
                    Slot: {selectedProduct.slot_number || "-"}
                  </div>
                  <div
                    className={`px-4 py-2 rounded-full border shadow-sm ${
                      (selectedProduct.current_stock ?? 0) > 5
                        ? "bg-green-100 border-green-200 text-green-700"
                        : "bg-red-100 border-red-200 text-red-700"
                    }`}
                  >
                    Stok: {selectedProduct.current_stock} pcs
                  </div>
                </div>
              </div>

              {/* Right Side: Info & Actions */}
              <div className="p-8 flex flex-col h-full bg-white">
                <div className="flex-grow space-y-6">
                  <div>
                    {selectedProduct.category && (
                      <span className="inline-block px-3 py-1 mb-3 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded-lg">
                        {selectedProduct.category}
                      </span>
                    )}
                    <h2 className="text-4xl font-black text-gray-900 mb-3 leading-tight">
                      {selectedProduct.name}
                    </h2>
                    <p className="text-gray-500 leading-relaxed text-lg">
                      {selectedProduct.description ||
                        "Snack lezat untuk menemani harimu."}
                    </p>
                  </div>

                  <div className="h-px bg-gray-100 w-full" />

                  {/* Price Block */}
                  <div>
                    <p className="text-sm text-gray-400 font-medium flex items-center gap-2 mb-1">
                      <Tag className="h-4 w-4" /> Harga Satuan
                    </p>
                    <p className="text-4xl font-extrabold text-amber-600">
                      {formatPrice(unitPrice)}
                    </p>
                  </div>

                  {/* Quantity Selector */}
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <Button
                      variant="ghost"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="h-12 w-12 rounded-xl bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-amber-600"
                    >
                      <Minus className="h-6 w-6" />
                    </Button>

                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                        {quantity}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-400">
                        Jumlah
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= maxQuantity}
                      className="h-12 w-12 rounded-xl bg-white shadow-sm border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-amber-600"
                    >
                      <Plus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-8 pt-6 border-t border-gray-100 space-y-6">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="text-3xl font-black text-gray-900">
                      {formatPrice(totalPrice)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      // variant="secondary"
                      size="lg"
                      onClick={handleAddToCart}
                      className="h-14 bg-white border-2 border-orange-400 text-orange-600 hover:bg-orange-50 font-bold text-lg rounded-xl shadow-sm hover:shadow-md transition-all"
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Keranjang
                    </Button>

                    <Button
                      // variant="primary"
                      size="lg"
                      onClick={handleContinue}
                      className="h-14 bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg rounded-xl shadow-lg shadow-orange-200 hover:shadow-xl transition-all border-none"
                    >
                      Beli
                    </Button>
                  </div>
                  
                  <button 
                    onClick={handleBack}
                    className="w-full text-center text-gray-400 text-sm font-medium hover:text-amber-600 transition-colors"
                  >
                    Batal dan kembali
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailScreen;
