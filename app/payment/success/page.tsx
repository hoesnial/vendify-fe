"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckCircle, Home, Loader2, Package } from "lucide-react";
import { createMqttClient } from "@/lib/mqtt";
import { MqttClient } from "mqtt";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const transactionStatus = searchParams.get("transaction_status");

  // State: 'dispensing' | 'success' | 'failed'
  const [dispenseState, setDispenseState] = useState<'dispensing' | 'success' | 'failed'>('dispensing');
  const clientRef = useRef<MqttClient | null>(null);

  useEffect(() => {
    // 1. Connect MQTT
    console.log("Initializing MQTT...");
    const client = createMqttClient();
    clientRef.current = client;

    client.on('connect', () => {
      console.log('✅ Web MQTT Connected');
      
      // KITA SUBSCRIBE KE 'RESULT' (Output dari Mesin)
      // Topik 'dispend' adalah PERINTAH (Input ke Mesin), jadi kita tidak listen itu disini.
      // Kita menunggu mesin membalas "Saya sudah keluarkan barang" via 'dispense_result'.
      if (client.connected) {
          client.subscribe('vm/+/dispense_result', (err) => {
              if (err) console.error("Subscribe Error:", err);
          });
      }
    });

    client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 Received MQTT:', data);
        console.log(`🔎 Comparing: URL[${orderId}] vs PAYLOAD[${data.orderId}]`);
        
        // Check if this result matches our order
        if (data.orderId === orderId && data.success) {
           console.log("✅ MATCH! Updating UI...");
           setDispenseState('success');
           // Start redirect timer only AFTER success
           setTimeout(() => router.push("/"), 10000);
        } else {
           console.warn("⚠️ Mismatch or Failed:", data);
        }
      } catch (e) {
        console.error('MQTT Parse Error', e);
      }
    });

    return () => {
      console.log("Cleaning up MQTT...");
      if (client) {
          try {
            client.end(); 
          } catch(e) { console.warn("End error:", e); }
      }
    };
  }, [orderId, router]);


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">

          {dispenseState === 'dispensing' && (
            <div className="animate-in fade-in zoom-in duration-300">
               <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
               </div>
               <h1 className="text-xl font-bold text-gray-800 mb-2">Sedang Mengeluarkan Barang...</h1>
               <p className="text-gray-500 mb-6">Mohon tunggu, mesin sedang memproses pesanan Anda.</p>
               
               <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-4">
                 Jangan tutup halaman ini sampai barang keluar.
               </p>
            </div>
          )}

          {dispenseState === 'success' && (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-4">Transaksi Selesai!</h1>
              <p className="text-gray-600 mb-6">Silakan ambil barang Anda di mesin.</p>
              
              <Button onClick={() => router.push("/")} variant="primary" fullWidth>
                <Home className="h-4 w-4 mr-2" />
                Kembali ke Beranda
              </Button>
              <p className="text-xs text-gray-400 mt-4">Redirect otomatis dalam 10 detik...</p>
            </div>
          )}

          {/* Dev Tools (Always visible for manual trigger if getting stuck) */}
          {orderId && (
            <div className="mt-8 pt-4 border-t border-gray-100">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Development Actions</p>
              <Button
                onClick={async () => {
                   try {
                     const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                     // Trigger simulation logic in backend
                     await fetch(`${API_URL}/api/debug/mqtt/simulate-dispense-result`, {
                       method: "POST",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({ orderId: orderId, success: true })
                     });
                     // Note: We don't manually set success here. 
                     // We wait for the Backend -> MQTT -> Frontend loop to complete!
                     // This verifies the full loop.
                   } catch(e) {
                     console.error(e);
                     alert("Network Error");
                   }
                }}
                variant="secondary"
                fullWidth
                size="sm"
                className="text-xs h-9 border-dashed text-gray-500 hover:text-gray-800"
              >
                🛠️ Simulasi Ambil Barang (Full Loop)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
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
      <PaymentSuccessContent />
    </Suspense>
  );
}
