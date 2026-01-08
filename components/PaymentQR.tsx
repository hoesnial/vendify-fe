"use client";

import React, { useState, useEffect, useCallback } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { LoadingSpinner } from "@/components/ui/Loading";
import { Order } from "@/lib/api";
import { paymentService, PaymentRequest } from "@/lib/payment";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";

interface PaymentQRProps {
  order: Order;
  onPaymentSuccess: () => void;
  onPaymentTimeout: () => void;
  onClose: () => void;
}

export const PaymentQR: React.FC<PaymentQRProps> = ({
  order,
  onPaymentSuccess,
  onPaymentTimeout,
  onClose,
}) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(true);
  const [qrisUrl, setQrisUrl] = useState<string>("");
  const [midtransOrderId, setMidtransOrderId] = useState<string>("");
  const [hasCheckedInitialStatus, setHasCheckedInitialStatus] = useState(false);
  const [qrGenerationError, setQrGenerationError] = useState<string>("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false); // Prevent multiple calls

  const generateMidtransQRIS = useCallback(async () => {
    const orderId = order.order_id;
    const storageKey = `midtrans_token_${orderId}`;

    // Prevent multiple simultaneous calls
    if (isGenerating) {
      console.log("⏳ Generation already in progress, skipping...");
      return;
    }

    try {
      setIsGenerating(true);
      setIsGeneratingQR(true);
      setQrGenerationError("");
      console.log("🔄 Generating Midtrans Snap QRIS for order:", orderId);

      setMidtransOrderId(orderId);

      // Check if we already have a token saved for this order (priority check)
      const existingToken = localStorage.getItem(storageKey);

      if (existingToken) {
        console.log("♻️ Found existing Midtrans token in localStorage");

        // Skip if we already have this token loaded
        if (savedToken === existingToken) {
          console.log("✅ Token already loaded, skipping");
          return;
        }

        // Load existing token
        setSavedToken(existingToken);
        const redirectUrl = `https://app.sandbox.midtrans.com/snap/v4/redirection/${existingToken}`;
        setQrisUrl(redirectUrl);
        toast.success("QR Code Midtrans berhasil dimuat");
        setIsGeneratingQR(false);
        return;
      }

      // No existing token, create new Midtrans Snap transaction
      console.log("🆕 Creating new Midtrans Snap transaction...");

      // Prepare items from order
      let items;

      if (order.items && order.items.length > 0) {
        // Multi-item order from cart
        items = order.items.map((item) => ({
          id: item.product_id.toString(),
          price: Number(item.unit_price),
          quantity: Number(item.quantity),
          name: item.product_name,
        }));
      } else {
        // Single product order
        items = [
          {
            id: order.order_id,
            price: Number(order.unit_price || 0),
            quantity: Number(order.quantity || 1),
            name: order.product_name || "Product",
          },
        ];
      }

      const paymentRequest: PaymentRequest = {
        orderId: orderId,
        amount: order.total_amount,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        items: items,
      };

      console.log("📋 Payment request:", paymentRequest);

      // Create Midtrans Snap transaction
      const response = await paymentService.createTransaction(paymentRequest);

      // Save token to localStorage and state
      localStorage.setItem(storageKey, response.token);
      setSavedToken(response.token);

      // Use redirect_url as QR content (Snap v4 URL)
      console.log("✅ Midtrans Snap transaction created");
      console.log("🔗 Redirect URL:", response.redirect_url);

      setQrisUrl(response.redirect_url);
      toast.success("QR Code Midtrans Snap berhasil dibuat");
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("❌ Failed to generate Midtrans QRIS:", error);

      const errorMessage = err.message || "Gagal membuat QR Code";
      setQrGenerationError(errorMessage);

      if (errorMessage.includes("order_id not unique")) {
        console.log("⚠️ Order ID already exists in Midtrans");
        console.log("⚠️ Attempting to recover existing token...");

        // Try to get token from localStorage as fallback
        const existingToken = localStorage.getItem(storageKey);

        if (existingToken) {
          console.log("✅ Found existing token in localStorage, using it");
          setSavedToken(existingToken);
          const redirectUrl = `https://app.sandbox.midtrans.com/snap/v4/redirection/${existingToken}`;
          setQrisUrl(redirectUrl);
          setQrGenerationError(""); // Clear error
          toast.success("QR Code Midtrans berhasil dimuat dari cache");
        } else {
          console.warn("⚠️ No token found in localStorage, cannot recover");
          toast.error("Order sudah digunakan. Silakan buat pesanan baru.");
          setTimeout(() => {
            onClose();
          }, 2000);
        }
      } else if (errorMessage.includes("server key not configured")) {
        toast.error(
          "⚙️ Konfigurasi Midtrans belum lengkap. Hubungi administrator."
        );
      } else {
        toast.error(`Error: ${errorMessage}`);
      }

      // Fallback: use backend payment URL if exists
      if (
        !qrisUrl &&
        order.payment_url &&
        !order.payment_url.includes("midtrans://")
      ) {
        console.log("🔄 Using fallback payment URL from backend");
        setQrisUrl(order.payment_url);
      }
    } finally {
      setIsGeneratingQR(false);
      setIsGenerating(false);
    }
  }, [
    order.order_id,
    order.total_amount,
    order.unit_price,
    order.quantity,
    order.product_name,
    order.payment_url,
    order.items,
    savedToken,
    qrisUrl,
    isGenerating,
    onClose,
  ]);

  // Generate Midtrans QRIS on component mount
  useEffect(() => {
    generateMidtransQRIS();
  }, [generateMidtransQRIS]);

  useEffect(() => {
    // Calculate time left
    if (!order.expires_at) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(order.expires_at).getTime();
      const difference = expiry - now;

      if (difference > 0) {
        const seconds = Math.floor(difference / 1000);
        setTimeLeft(seconds);
      } else {
        setTimeLeft(0);
        onPaymentTimeout();
      }
    };

    // Initial calculation
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [order.expires_at, onPaymentTimeout]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(price);
  };

  // Check payment status via Midtrans API
  const checkPaymentStatus = useCallback(async () => {
    if (!midtransOrderId || isCheckingPayment) return;

    setIsCheckingPayment(true);
    try {
      console.log("🔍 Checking Midtrans payment status for:", midtransOrderId);

      // Try API route first
      const response = await fetch(`/api/payment/status/${midtransOrderId}`);
      if (response.ok) {
        const status = await response.json();
        console.log("📊 Payment status via API:", status);

        // Handle mock responses for testing
        if (status._mock) {
          console.log("🎭 Received mock payment response");
          // For testing purposes, simulate payment success after 15 seconds
          const now = new Date().getTime();
          const orderTime = new Date(status.transaction_time).getTime();
          const elapsed = (now - orderTime) / 1000;

          if (elapsed > 15) {
            // Simulate success after 15 seconds
            console.log("✅ Mock payment successful!");
            toast.success("Pembayaran Midtrans berhasil! (Simulasi)");
            onPaymentSuccess();
            return;
          }
          return;
        }

        // Handle real Midtrans responses
        if (
          status.transaction_status === "settlement" ||
          status.transaction_status === "capture"
        ) {
          console.log("✅ Midtrans payment successful!");
          toast.success("Pembayaran Midtrans berhasil!");
          onPaymentSuccess();
        } else if (
          status.transaction_status === "deny" ||
          status.transaction_status === "cancel" ||
          status.transaction_status === "expire"
        ) {
          console.log("❌ Midtrans payment failed:", status.transaction_status);
          toast.error("Pembayaran Midtrans gagal atau dibatalkan");
          onPaymentTimeout();
        }
        return;
      }

      // Fallback to payment service if API route fails
      const status = await paymentService.checkPaymentStatus(midtransOrderId);
      console.log("📊 Payment status via service:", status);

      if (
        status.transaction_status === "settlement" ||
        status.transaction_status === "capture"
      ) {
        console.log("✅ Midtrans payment successful!");
        toast.success("Pembayaran Midtrans berhasil!");
        onPaymentSuccess();
      } else if (
        status.transaction_status === "deny" ||
        status.transaction_status === "cancel" ||
        status.transaction_status === "expire"
      ) {
        console.log("❌ Midtrans payment failed:", status.transaction_status);
        toast.error("Pembayaran Midtrans gagal atau dibatalkan");
        onPaymentTimeout();
      }
    } catch (error) {
      console.error("❌ Error checking Midtrans payment status:", error);
    } finally {
      setIsCheckingPayment(false);
    }
  }, [midtransOrderId, isCheckingPayment, onPaymentSuccess, onPaymentTimeout]);

  // Check initial payment status on mount (for page refresh scenarios)
  useEffect(() => {
    const checkInitialStatus = async () => {
      if (hasCheckedInitialStatus) return;

      // Wait for midtransOrderId to be set
      if (!midtransOrderId || isGeneratingQR) return;

      console.log("🔍 Checking initial payment status after mount/refresh...");
      setHasCheckedInitialStatus(true);
      await checkPaymentStatus();
    };

    // Delay initial check to ensure order ID is set
    const timer = setTimeout(checkInitialStatus, 1000);
    return () => clearTimeout(timer);
  }, [
    midtransOrderId,
    isGeneratingQR,
    hasCheckedInitialStatus,
    checkPaymentStatus,
  ]);

  // Auto check payment status every 3 seconds
  useEffect(() => {
    if (!midtransOrderId || isGeneratingQR) return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 3000);

    return () => clearInterval(interval);
  }, [midtransOrderId, isGeneratingQR, checkPaymentStatus]);

  const handleManualCheck = useCallback(async () => {
    await checkPaymentStatus();
  }, [checkPaymentStatus]);

  const handleTestPayment = useCallback(async () => {
    setIsCheckingPayment(true);
    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log("🎭 Simulating successful Midtrans payment");
      toast.success("Pembayaran Midtrans simulasi berhasil!");
      onPaymentSuccess();
    } catch (error) {
      console.error("❌ Test payment error:", error);
      toast.error("Simulasi pembayaran gagal");
    } finally {
      setIsCheckingPayment(false);
    }
  }, [onPaymentSuccess]);

  return (
    <div className="max-w-md mx-auto">
      <Card className="border-2 border-[#00AA13]/30 shadow-lg">
        <CardHeader className="text-center bg-gradient-to-b from-white to-[#F0FFF4]">
          <CardTitle className="text-[#00AA13] text-2xl">
            Pembayaran QRIS Midtrans
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Scan QR Code dengan aplikasi mobile banking atau e-wallet
          </p>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          {/* Error Message */}
          {qrGenerationError && (
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <span className="text-red-600 text-xl">⚠️</span>
                <div className="flex-1">
                  <p className="font-bold text-red-700 mb-1">
                    Error saat membuat QR Code
                  </p>
                  <p className="text-sm text-red-600">{qrGenerationError}</p>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={generateMidtransQRIS}
                    disabled={isGeneratingQR}
                    className="mt-3"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${
                        isGeneratingQR ? "animate-spin" : ""
                      }`}
                    />
                    Coba Lagi
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* QR Code */}
          <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-blue-200 shadow-health">
            {isGeneratingQR ? (
              <div className="flex flex-col items-center space-y-4">
                <LoadingSpinner size="lg" />
                <p className="text-blue-600 font-medium">
                  Membuat QR Code Midtrans...
                </p>
              </div>
            ) : qrisUrl ? (
              <QRCode
                value={qrisUrl}
                size={200}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox="0 0 256 256"
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">QR Code tidak tersedia</p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={generateMidtransQRIS}
                  disabled={isGeneratingQR}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </div>
            )}
          </div>

          {/* Midtrans Badge */}
          {qrisUrl && !qrisUrl.includes(order.order_id) && (
            <div className="text-center">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-gradient-to-r from-[#0066cc] to-[#004a99] text-white font-medium shadow-sm">
                🔒 Powered by Midtrans
              </span>
            </div>
          )}

          {/* Order Details */}
          <div className="space-y-2 text-center bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 border-2 border-blue-200">
            <h3 className="font-bold text-lg text-blue-900">
              {order.product_name}
            </h3>
            <p className="text-gray-600">Jumlah: {order.quantity} pcs</p>
            <div className="text-3xl font-black bg-gradient-to-r from-[#0066cc] to-[#004a99] bg-clip-text text-transparent">
              {formatPrice(order.total_amount)}
            </div>
            {midtransOrderId && (
              <p className="text-xs text-blue-600 font-mono">
                Order ID: {midtransOrderId}
              </p>
            )}
          </div>

          {/* Countdown */}
          <div className="text-center bg-gradient-to-r from-blue-50 to-white rounded-lg p-4 border-2 border-blue-200">
            <div className="text-2xl font-mono font-black bg-gradient-to-r from-[#0066cc] to-[#004a99] bg-clip-text text-transparent">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-blue-700 font-semibold mt-1">
              Waktu tersisa
            </p>
          </div>

          {/* Status */}
          <div className="text-center">
            {isCheckingPayment ? (
              <div className="flex items-center justify-center space-x-2">
                <LoadingSpinner size="sm" />
                <span className="text-blue-600 font-medium">
                  Mengecek pembayaran Midtrans...
                </span>
              </div>
            ) : (
              <p className="text-blue-600 font-medium">
                Menunggu pembayaran...
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Check Payment Status Button */}
            <Button
              variant="primary"
              fullWidth
              onClick={handleManualCheck}
              disabled={isCheckingPayment || isGeneratingQR}
            >
              {isCheckingPayment
                ? "Memeriksa..."
                : "🔍 Periksa Status Pembayaran"}
            </Button>

            {/* Test Payment Button (for demo) */}
            <Button
              variant="secondary"
              fullWidth
              onClick={handleTestPayment}
              disabled={isCheckingPayment || isGeneratingQR}
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200"
            >
              {isCheckingPayment ? "Memproses..." : "🧪 Test Pembayaran (Demo)"}
            </Button>

            {/* Close Button */}
            <Button
              variant="ghost"
              fullWidth
              onClick={onClose}
              disabled={isCheckingPayment}
            >
              Tutup
            </Button>
          </div>

          {/* Instructions */}
          <div className="text-xs text-blue-700 space-y-1 bg-gradient-to-r from-white to-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="font-bold text-blue-900 text-sm mb-2">
              📱 Cara pembayaran:
            </p>
            <p>1. Buka aplikasi mobile banking atau e-wallet</p>
            <p>2. Pilih menu scan QR Code</p>
            <p>3. Arahkan kamera ke QR Code di atas</p>
            <p>4. Konfirmasi pembayaran Midtrans</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
