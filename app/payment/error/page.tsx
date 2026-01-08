"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { XCircle, Home, RefreshCw } from "lucide-react";

function PaymentErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const statusCode = searchParams.get("status_code");

  const handleRetry = () => {
    // Redirect back to payment with the same order
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <div className="bg-red-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="h-12 w-12 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Pembayaran Gagal
          </h1>

          <p className="text-gray-600 mb-6">
            Maaf, terjadi kesalahan saat memproses pembayaran Anda.
            {orderId && (
              <>
                <br />
                <span className="text-sm">Order ID: {orderId}</span>
              </>
            )}
          </p>

          {statusCode && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-red-800">Error Code: {statusCode}</p>
            </div>
          )}

          <div className="space-y-3">
            <Button onClick={handleRetry} variant="primary" fullWidth>
              <RefreshCw className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>

            <Button
              onClick={() => router.push("/")}
              variant="secondary"
              fullWidth
            >
              <Home className="h-4 w-4 mr-2" />
              Kembali ke Beranda
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            Jika masalah berlanjut, silakan hubungi customer service
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentErrorContent />
    </Suspense>
  );
}
