"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import VendingMachine from "@/components/VendingMachine";
import AnnouncementPopup from "@/components/AnnouncementPopup";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check if redirected from Midtrans
    const orderId = searchParams.get("order_id");
    const statusCode = searchParams.get("status_code");
    
    if (orderId && statusCode === "200") {
      // Redirect to success page while preserving params
      const params = new URLSearchParams(searchParams.toString());
      router.replace(`/payment/success?${params.toString()}`);
    }
  }, [searchParams, router]);

  return (
    <>
      <AnnouncementPopup />
      <VendingMachine />
    </>
  );
}

export default function Home() {
  return (
     <Suspense fallback={<div>Loading...</div>}>
       <HomeContent />
     </Suspense>
  );
}
