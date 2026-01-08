import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Camera,
  Smartphone,
  Upload,
  CheckCircle,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import { Product } from "@/lib/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface PrescriptionScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

interface ScanSession {
  sessionId: string;
  qrCode: string;
  uploadUrl: string;
  status: "waiting" | "processing" | "completed" | "error";
  result?: {
    prescription: {
      doctorName?: string;
      patientName?: string;
      medications?: Array<{
        name: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions?: string;
      }>;
    };
    products?: Product[];
    unavailableCount?: number;
  };
}

export default function PrescriptionScanModal({
  isOpen,
  onClose,
  onAddToCart,
}: PrescriptionScanModalProps) {
  const [session, setSession] = useState<ScanSession | null>(null);
  const [, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"scan" | "result">("scan");
  const [pollErrorCount, setPollErrorCount] = useState(0);

  // Create scan session function
  const createScanSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/prescription-scan/create-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setSession({
          sessionId: data.sessionId,
          qrCode: data.qrCode,
          uploadUrl: data.uploadUrl,
          status: "waiting",
        });
      } else {
        setError("Gagal membuat sesi scan");
      }
    } catch (err) {
      console.error("Error creating session:", err);
      const errorMessage =
        err instanceof TypeError && err.message.includes("fetch")
          ? "Tidak dapat terhubung ke server. Pastikan backend sedang berjalan."
          : "Terjadi kesalahan. Silakan coba lagi.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create scan session when modal opens
  useEffect(() => {
    if (isOpen && !session) {
      createScanSession();
    }
  }, [isOpen, session, createScanSession]);

  // Poll for scan results
  useEffect(() => {
    if (
      !session ||
      session.status === "completed" ||
      session.status === "error"
    ) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/prescription-scan/status/${session.sessionId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Reset error count on successful fetch
        setPollErrorCount(0);

        if (data.success) {
          setSession((prev) => ({
            ...prev!,
            status: data.status,
            result: data.result,
          }));

          if (data.status === "completed") {
            setStep("result");
          } else if (data.status === "error") {
            setError(data.error || "Terjadi kesalahan saat memproses resep");
          }
        }
      } catch (err) {
        console.error("Error polling status:", err);
        setPollErrorCount((prev) => prev + 1);

        // Stop polling after 5 consecutive errors
        if (pollErrorCount >= 5) {
          setError("Koneksi terputus. Silakan coba lagi atau refresh halaman.");
          clearInterval(pollInterval);
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [session, pollErrorCount]);

  const handleClose = () => {
    setSession(null);
    setStep("scan");
    setError(null);
    setPollErrorCount(0);
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Camera className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Scan Resep Dokter</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Scan Step */}
          {step === "scan" && session && (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-700 mb-4">
                  Scan QR code ini dengan kamera HP Anda:
                </p>

                {/* QR Code */}
                <div className="bg-white p-6 rounded-lg border-4 border-blue-500 inline-block shadow-lg">
                  <Image
                    src={session.qrCode}
                    alt="QR Code"
                    width={256}
                    height={256}
                    className="w-64 h-64"
                    unoptimized
                  />
                </div>

                {/* Status Indicator */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  {session.status === "waiting" && (
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <Upload className="w-5 h-5 animate-bounce" />
                      <span className="font-medium">
                        Menunggu upload foto...
                      </span>
                    </div>
                  )}
                  {session.status === "processing" && (
                    <div className="flex items-center justify-center gap-2 text-purple-700">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-700"></div>
                      <span className="font-medium">
                        Memproses resep Anda...
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-500 mt-4">
                  Session akan expired dalam 10 menit
                </p>
              </div>

              {/* Cara Penggunaan - Below QR Code */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Cara Menggunakan:
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
                  <li>Buka kamera HP Anda</li>
                  <li>Scan QR code di atas</li>
                  <li>Ambil foto resep dokter dengan jelas</li>
                  <li>Upload foto</li>
                  <li>Tunggu hasil analisis</li>
                </ol>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-bold text-yellow-900 mb-2 text-sm">
                  💡 Tips Foto yang Bagus:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-800 text-xs">
                  <li>Pencahayaan terang</li>
                  <li>Foto tegak lurus</li>
                  <li>Teks jelas terbaca</li>
                  <li>Hindari bayangan</li>
                </ul>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === "result" && session?.result && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="font-bold text-green-900">
                    Resep Berhasil Dibaca!
                  </h3>
                  <p className="text-sm text-green-700">
                    Sistem telah mengekstrak informasi dari resep Anda
                  </p>
                </div>
              </div>

              {/* Prescription Details */}
              {session.result.prescription && (
                <div className="space-y-4">
                  {/* Doctor & Patient Info */}
                  {(session.result.prescription.doctorName ||
                    session.result.prescription.patientName) && (
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      {session.result.prescription.doctorName && (
                        <p className="text-sm">
                          <span className="font-semibold">Dokter:</span>{" "}
                          {session.result.prescription.doctorName}
                        </p>
                      )}
                      {session.result.prescription.patientName && (
                        <p className="text-sm">
                          <span className="font-semibold">Pasien:</span>{" "}
                          {session.result.prescription.patientName}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Medications List */}
                  {session.result.prescription.medications &&
                    session.result.prescription.medications.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">
                          Daftar Obat:
                        </h4>
                        <div className="space-y-3">
                          {session.result.prescription.medications.map(
                            (med, index) => (
                              <div
                                key={index}
                                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                              >
                                <h5 className="font-bold text-blue-900 mb-2">
                                  {med.name}
                                </h5>
                                <div className="grid grid-cols-2 gap-2 text-sm text-blue-800">
                                  {med.dosage && (
                                    <p>
                                      <span className="font-medium">
                                        Dosis:
                                      </span>{" "}
                                      {med.dosage}
                                    </p>
                                  )}
                                  {med.frequency && (
                                    <p>
                                      <span className="font-medium">
                                        Frekuensi:
                                      </span>{" "}
                                      {med.frequency}
                                    </p>
                                  )}
                                  {med.duration && (
                                    <p>
                                      <span className="font-medium">
                                        Durasi:
                                      </span>{" "}
                                      {med.duration}
                                    </p>
                                  )}
                                  {med.instructions && (
                                    <p className="col-span-2">
                                      <span className="font-medium">
                                        Instruksi:
                                      </span>{" "}
                                      {med.instructions}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}

              {/* Product Cards */}
              {session.result.products &&
                session.result.products.length > 0 && (
                  <div>
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5" />
                      Produk Tersedia:
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {session.result.products.map((product) => {
                        if (!product) return null;

                        return (
                          <div
                            key={product.id}
                            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
                          >
                            {/* Product Image */}
                            <div className="relative h-32 w-full bg-gray-100">
                              <Image
                                src={getImageUrl(product.image_url)}
                                alt={product.name || "Product"}
                                fill
                                className="object-cover"
                              />
                              {/* Stock badge */}
                              {(product.current_stock ?? 0) > 0 && (
                                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                  {product.current_stock} pcs
                                </div>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="p-3 space-y-2">
                              <h5 className="font-bold text-gray-800 text-sm line-clamp-2">
                                {product.name}
                              </h5>

                              <div className="flex items-center justify-between">
                                <div className="text-base font-bold text-gray-900">
                                  {formatPrice(
                                    product.final_price ?? product.price
                                  )}
                                </div>

                                {/* Buy Button */}
                                <button
                                  onClick={() => onAddToCart?.(product)}
                                  disabled={(product.current_stock ?? 0) === 0}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                  Beli
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Unavailable Products Warning */}
              {session.result.unavailableCount &&
                session.result.unavailableCount > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ Beberapa obat tidak tersedia di mesin ini. (
                      {session.result.unavailableCount} item)
                    </p>
                  </div>
                )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-bold hover:from-blue-600 hover:to-purple-700 transition"
                >
                  Selesai
                </button>
                <button
                  onClick={() => {
                    setSession(null);
                    setStep("scan");
                    createScanSession();
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-300 transition"
                >
                  Scan Lagi
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-medium">⚠️ {error}</p>
              <button
                onClick={createScanSession}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Coba lagi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
