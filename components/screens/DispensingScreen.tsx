"use client";

import React, { useEffect } from "react";
import { useVendingStore } from "@/lib/store";
import Dispensing from "@/components/Dispensing";

const DispensingScreen: React.FC = () => {
  const { selectedProduct, currentOrder, setCurrentScreen } = useVendingStore();

  useEffect(() => {
    if (!selectedProduct || !currentOrder) {
      setCurrentScreen("home");
    }
  }, [selectedProduct, currentOrder, setCurrentScreen]);

  if (!selectedProduct || !currentOrder) {
    return null;
  }

  const handleDispenseComplete = (success: boolean) => {
    if (success) {
      setCurrentScreen("success");
    } else {
      setCurrentScreen("error");
    }
  };

  return (
    <div className="min-h-screen bg-amber-50/30 p-4 flex items-center justify-center">
      <Dispensing
        productName={selectedProduct.name}
        onComplete={handleDispenseComplete}
      />
    </div>
  );
};

export default DispensingScreen;
