"use client";

import React, { useState } from "react";
import { useVendingStore } from "@/lib/store";
import { vendingAPI } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Loading";
import {
  ArrowLeft,
  Smartphone,
  ClipboardCheck,
  Package,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";
import toast from "react-hot-toast";

const OrderSummaryScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");

  const {
    selectedProduct,
    quantity,
    cartItems,
    setCurrentOrder,
    setCurrentScreen,
    setLoading,
    setError,
    clearCart,
  } = useVendingStore();

  // Check if cart has items or single product selected
  const hasCartItems = cartItems.length > 0;
  const hasSingleProduct = selectedProduct && quantity > 0;

  if (!hasCartItems && !hasSingleProduct) {
    return (
      <div className="min-h-screen bg-amber-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Tidak ada produk dipilih</p>
          <Button
            variant="primary"
            onClick={() => setCurrentScreen("home")}
            className="bg-orange-500 hover:bg-orange-600"
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

  // Calculate total for cart or single product
  const displayItems = hasCartItems
    ? cartItems.map((item) => ({
        name: item.product.name,
        description: item.product.description,
        quantity: item.quantity,
        unitPrice: item.product.final_price ?? item.product.price,
        slot_id: item.product.slot_id,
      }))
    : selectedProduct
    ? [
        {
          name: selectedProduct.name,
          description: selectedProduct.description,
          quantity,
          unitPrice: selectedProduct.final_price ?? selectedProduct.price,
          slot_id: selectedProduct.slot_id,
        },
      ]
    : [];

  const subtotal = displayItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const tax = subtotal * 0.11;
  const totalPrice = subtotal + tax;

  const handleBack = () => {
    if (hasCartItems) {
      setCurrentScreen("cart");
    } else {
      setCurrentScreen("product-detail");
    }
  };

  const handleCreateOrder = async () => {
    setIsLoading(true);
    setLoading(true);

    try {
      let order;

      if (hasCartItems) {
        // Multi-item order
        const orderData = {
          items: cartItems.map((item) => ({
            slot_id: item.product.slot_id!,
            quantity: item.quantity,
          })),
          ...(customerPhone && { customer_phone: customerPhone }),
        };

        console.log("Creating multi-item order:", orderData);
        order = await vendingAPI.createMultiItemOrder(orderData);

        // Clear cart after successful order
        clearCart();
      } else if (selectedProduct?.slot_id) {
        // Single item order
        const orderData = {
          slot_id: selectedProduct.slot_id,
          quantity,
          ...(customerPhone && { customer_phone: customerPhone }),
        };

        console.log("Creating single order:", orderData);
        order = await vendingAPI.createOrder(orderData);
      } else {
        toast.error("Slot produk tidak ditemukan");
        return;
      }

      console.log("Order created successfully:", order);

      // Clear any existing Midtrans token for this order ID to prevent conflicts
      const storageKey = `midtrans_token_${order.order_id}`;
      localStorage.removeItem(storageKey);
      console.log("🗑️ Cleared existing Midtrans token from cache");

      setCurrentOrder(order);
      setCurrentScreen("payment");
      toast.success("Pesanan berhasil dibuat");
    } catch (error: unknown) {
      console.error("Failed to create order:", error);
      console.error("Error details:", {
        name: (error as Error)?.name,
        message: (error as Error)?.message,
        response: (error as { response?: unknown })?.response,
        status: (error as { response?: { status?: number } })?.response?.status,
        data: (error as { response?: { data?: unknown } })?.response?.data,
      });

      const errorMessage =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Gagal membuat pesanan";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, "");

    // Format as Indonesian phone number
    if (numbers.startsWith("0")) {
      return numbers.replace(/^0/, "+62 ");
    } else if (numbers.startsWith("62")) {
      return "+" + numbers;
    } else if (numbers.startsWith("8")) {
      return "+62 " + numbers;
    }

    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(e.target.value);
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handleBack}
            disabled={isLoading}
            className="p-3 rounded-full bg-white border border-gray-100 text-orange-500 shadow-sm hover:shadow-md transition hover:bg-orange-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-orange-600 text-xs font-bold uppercase tracking-[0.2em] mb-1">
              <ShoppingBag className="h-4 w-4" /> Checkout
            </div>
            <h1 className="text-2xl font-black text-amber-900 tracking-tight">Rincian Pesanan</h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-200">
            {quantity}
          </div>
        </div>

        {/* Cart Items - Rounded container */}
        <div className="bg-white rounded-[2rem] p-6 mb-6 shadow-xl shadow-amber-100/20 border border-amber-100">
          {/* Product Items */}
          <div className="space-y-3 mb-6">
            {displayItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50 hover:border-orange-200 transition-colors"
              >
                {/* Product Image Placeholder */}
                <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center border border-amber-100 text-orange-400 shadow-sm">
                  <Package className="h-7 w-7" />
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className="text-gray-900 font-bold text-lg leading-tight">
                    {item.name}
                    <span className="text-orange-600 ml-2 text-sm font-semibold">
                      x{item.quantity}
                    </span>
                  </h3>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {item.description || "Snack & Minuman"}
                  </p>
                </div>

                {/* Price */}
                <div className="bg-orange-100 text-orange-700 font-bold px-3 py-1.5 rounded-lg text-sm">
                  {formatPrice(item.unitPrice * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Tax & Total Card */}
          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100">
            <div className="relative z-10">
              {/* Subtotal */}
              <div className="flex items-center justify-between mb-3 text-sm font-medium">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">
                  {formatPrice(subtotal)}
                </span>
              </div>

              {/* Tax Amount */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-amber-200">
                <span className="text-amber-700 font-medium text-sm flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4" /> PPN (11%)
                </span>
                <span className="text-gray-900 font-bold">
                  {formatPrice(tax)}
                </span>
              </div>

              {/* Total Amount */}
              <div>
                <p className="text-orange-600 font-bold text-sm mb-1 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" /> Total Pembayaran
                </p>
                <p className="text-3xl font-black text-gray-900 tracking-tight">
                  {formatPrice(totalPrice)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info (Optional) */}
        {customerPhone && (
          <div className="bg-white rounded-2xl p-4 mb-4 border border-amber-100 shadow-sm flex items-center gap-3">
             <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Smartphone className="h-5 w-5" />
             </div>
             <div>
                <p className="text-xs text-gray-500 font-medium">Nomor WhatsApp</p>
                <p className="text-gray-900 font-bold">{customerPhone}</p>
             </div>
          </div>
        )}

        {/* Make Payment Button */}
        <button
          onClick={handleCreateOrder}
          disabled={isLoading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-lg py-5 rounded-2xl shadow-lg shadow-orange-200 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-95"
        >
          {isLoading ? (
            <div className="flex items-center">
              <Loading />
              <span className="ml-2">Memproses...</span>
            </div>
          ) : (
            <>
              <span>Lanjut Pembayaran</span>
            </>
          )}
        </button>

        {/* Optional: Phone Input */}
        <div className="mt-4">
          <details className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm group">
            <summary className="p-4 cursor-pointer text-gray-700 font-medium flex items-center justify-between hover:bg-gray-50 transition-colors">
              <span className="flex items-center space-x-3 text-sm">
                <Smartphone className="h-5 w-5 text-orange-500" />
                <span className="font-semibold text-gray-900">Simpan Nomor WA (Opsional)</span>
              </span>
              <svg
                className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </summary>
            <div className="p-4 pt-0 bg-white">
              <input
                type="tel"
                value={customerPhone}
                onChange={handlePhoneChange}
                placeholder="Contoh: 08123456789"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm transition-all"
                disabled={isLoading}
              />
              <p className="text-xs text-amber-700 mt-2 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Kami akan mengirimkan notifikasi status pesanan ke nomor ini.
              </p>
            </div>
          </details>
        </div>

        {/* Terms */}
        <div className="text-xs text-gray-500 text-center mt-6">
          <p className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100 text-amber-800 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-orange-500" /> Sisa waktu pembayaran: 15 menit
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderSummaryScreen;
