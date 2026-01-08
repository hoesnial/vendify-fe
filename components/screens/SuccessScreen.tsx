"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useVendingStore } from "@/lib/store";
import { Star } from "lucide-react";

const SuccessScreen: React.FC = () => {
  const {
    selectedProduct,
    currentOrder,
    quantity,
    resetTransaction,
    setCurrentScreen,
  } = useVendingStore();

  const [countdown, setCountdown] = useState(10);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleBackToHome = useCallback(() => {
    resetTransaction();
  }, [resetTransaction]);

  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Use setTimeout to avoid setState during render
          setTimeout(() => {
            handleBackToHome();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [handleBackToHome]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleRating = (value: number) => {
    setRating(value);
    // Show thank you message
    setTimeout(() => {
      alert("Terima kasih atas rating Anda! ⭐");
    }, 300);
  };

  if (!selectedProduct || !currentOrder) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <button
          className="px-6 py-3 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition-colors"
          onClick={() => setCurrentScreen("home")}
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  const totalPrice = currentOrder.total_amount;

  return (
    <div className="min-h-screen bg-amber-50/30 p-4 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border border-amber-100">
          {/* Success Icon with Animation */}
          <div className="w-14 h-14 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-[scaleIn_0.5s_ease-out]">
            <svg
              className="w-7 h-7 stroke-white animate-[drawCheck_0.6s_ease-out_0.3s_forwards]"
              style={{
                strokeWidth: 3,
                strokeLinecap: "round",
                strokeLinejoin: "round",
                fill: "none",
                strokeDasharray: 100,
                strokeDashoffset: 100,
              }}
              viewBox="0 0 52 52"
            >
              <path d="M14 27l7.5 7.5L38 18" />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-black text-gray-900 text-center mb-1">
            Berhasil!
          </h1>
          <p className="text-xs text-orange-500 text-center mb-4 font-medium">
            Produk Anda telah berhasil keluar
          </p>

          {/* Product List */}
          <div className="bg-amber-50 rounded-xl p-3.5 mb-3 border border-amber-100">
            <div className="flex justify-between items-center py-1.5">
              <div>
                <div className="text-xs text-gray-800 font-medium">
                  {selectedProduct.name}{" "}
                  <span className="text-orange-600 font-bold">(x{quantity})</span>
                </div>
              </div>
              <div className="text-xs text-gray-900 font-medium">
                {formatPrice(totalPrice)}
              </div>
            </div>

            <div className="flex justify-between items-center pt-2.5 mt-1.5 border-t-2 border-orange-100">
              <div className="text-sm font-semibold text-gray-900">Total</div>
              <div className="text-base font-bold text-orange-600">
                {formatPrice(totalPrice)}
              </div>
            </div>
          </div>

          {/* Order ID */}
          <div className="text-[10px] text-gray-400 font-mono text-center mb-3">
            Order ID: {currentOrder.order_id || "VND-2024-001234"}
          </div>

          {/* Redirect Text */}
          <p className="text-[11px] text-gray-400 text-center mb-2.5">
            Kembali ke beranda dalam...
          </p>

          {/* Countdown */}
          <div className="flex justify-center gap-2 mb-3">
            <div className="bg-gray-100 rounded-lg py-2.5 px-3.5 min-w-[55px] text-center">
              <span className="text-xl font-bold text-gray-900 block leading-none mb-0.5">
                00
              </span>
              <span className="text-[9px] text-gray-400">Jam</span>
            </div>
            <div className="bg-gray-100 rounded-lg py-2.5 px-3.5 min-w-[55px] text-center">
              <span className="text-xl font-bold text-gray-900 block leading-none mb-0.5">
                00
              </span>
              <span className="text-[9px] text-gray-400">Menit</span>
            </div>
            <div className="bg-orange-100 rounded-lg py-2.5 px-3.5 min-w-[55px] text-center">
              <span className="text-xl font-bold text-orange-600 block leading-none mb-0.5">
                {countdown.toString().padStart(2, "0")}
              </span>
              <span className="text-[9px] text-gray-400">Detik</span>
            </div>
          </div>

          {/* Instruction Text */}
          <p className="text-[11px] text-orange-600 text-center mb-3 font-bold">
            Silakan ambil produk Anda di bawah
          </p>

          {/* Tips List */}
          <div className="bg-gray-50 rounded-xl p-2.5 mb-3.5 text-left border border-gray-100">
            <p className="text-[10px] text-gray-600 mb-0.5 leading-snug">
              • Pastikan semua produk telah diambil
            </p>
            <p className="text-[10px] text-gray-600 mb-0.5 leading-snug">
              • Simpan struk digital ini sebagai bukti
            </p>
            <p className="text-[10px] text-gray-600 leading-snug">
              • Terima kasih atas kepercayaan Anda!
            </p>
          </div>

          {/* Button */}
          <button
            className="w-full bg-orange-500 text-white rounded-xl py-3 text-sm font-bold hover:bg-orange-600 transition-all hover:-translate-y-0.5 active:translate-y-0 mb-3 shadow-lg shadow-orange-200"
            onClick={handleBackToHome}
          >
            Beli Lagi
          </button>

          {/* Divider */}
          <div className="h-px bg-gray-200 mb-3"></div>

          {/* Rating Section */}
          <div className="mb-2.5">
            <p className="text-[11px] text-gray-600 font-medium text-center mb-1.5">
              Bagaimana pengalaman Anda?
            </p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="p-0.5 transition-transform hover:scale-110"
                  onClick={() => handleRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                >
                  <Star
                    className={`w-5 h-5 transition-colors ${
                      star <= (hoveredStar || rating)
                        ? "fill-yellow-400 stroke-yellow-500"
                        : "fill-gray-200 stroke-gray-200"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-[10px] text-gray-400 text-center">
            Butuh bantuan? Hubungi petugas
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes drawCheck {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default SuccessScreen;
