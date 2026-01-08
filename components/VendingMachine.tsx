"use client";

import React from "react";
import { useVendingStore } from "@/lib/store";
import HomeScreen from "./screens/HomeScreen";
import ProductDetailScreen from "./screens/ProductDetailScreen";
import CartScreen from "./screens/CartScreen";
import OrderSummaryScreen from "./screens/OrderSummaryScreen";
import PaymentScreen from "./screens/PaymentScreen";
import DispensingScreen from "./screens/DispensingScreen";
import SuccessScreen from "./screens/SuccessScreen";
import ErrorScreen from "./screens/ErrorScreen";

import { Loading } from "./ui/Loading";

const VendingMachine: React.FC = () => {
  const { currentScreen, isLoading, error } = useVendingStore();

  // Show full screen loading overlay
  if (isLoading) {
    return <Loading message="Memproses..." fullScreen />;
  }

  // Show error screen if there's an error
  if (error && currentScreen !== "error") {
    return <ErrorScreen />;
  }

  // Render appropriate screen based on current state
  let screenContent;
  switch (currentScreen) {
    case "home":
      screenContent = <HomeScreen />;
      break;
    case "product-detail":
      screenContent = <ProductDetailScreen />;
      break;
    case "cart":
      screenContent = <CartScreen />;
      break;
    case "order-summary":
      screenContent = <OrderSummaryScreen />;
      break;
    case "payment":
      screenContent = <PaymentScreen />;
      break;
    case "dispensing":
      screenContent = <DispensingScreen />;
      break;
    case "success":
      screenContent = <SuccessScreen />;
      break;
    case "error":
      screenContent = <ErrorScreen />;
      break;
    default:
      screenContent = <HomeScreen />;
  }

  return (
    <>
      {screenContent}

    </>
  );
};

export default VendingMachine;
