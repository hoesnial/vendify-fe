import { NextRequest, NextResponse } from "next/server";
import midtransClient from "midtrans-client";

// Initialize Core API client
const core = new midtransClient.CoreApi({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SERVER_KEY",
});

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking payment status for:", orderId);

    // Check if we have valid Midtrans credentials
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey || serverKey === "SB-Mid-server-YOUR_SERVER_KEY") {
      // Demo mode - check backend order status as fallback
      console.log("⚠️ Demo mode: Checking backend order status for:", orderId);
      
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
        
        if (backendResponse.ok) {
          const orderData = await backendResponse.json();
          console.log("📦 Backend order status:", orderData.payment_status);
          
          // Map backend payment status to Midtrans format
          const transactionStatus = orderData.payment_status === "PAID" 
            ? "settlement" 
            : orderData.payment_status === "FAILED"
            ? "deny"
            : "pending";

          return NextResponse.json({
            _mock: true,
            _source: "backend",
            order_id: orderId,
            transaction_status: transactionStatus,
            transaction_time: orderData.created_at,
            payment_type: "qris",
            fraud_status: "accept",
            status_code: transactionStatus === "settlement" ? "200" : "201",
            status_message: `Transaction is ${transactionStatus}`,
            gross_amount: orderData.total_amount?.toString() || "0",
          });
        }
      } catch (backendError) {
        console.error("❌ Backend check error:", backendError);
      }

      // Final fallback - return pending
      return NextResponse.json({
        _mock: true,
        order_id: orderId,
        transaction_status: "pending",
        transaction_time: new Date().toISOString(),
        payment_type: "qris",
        fraud_status: "accept",
        status_code: "201",
        status_message: "Transaction is pending",
        gross_amount: "0",
      });
    }

    try {
      // Check transaction status with real Midtrans
      console.log("💳 Checking Midtrans API for:", orderId);
      const statusResponse = await core.transaction.status(orderId);
      console.log("✅ Midtrans status:", statusResponse.transaction_status);
      return NextResponse.json(statusResponse);
    } catch (midtransError: unknown) {
      console.error("❌ Midtrans API error:", midtransError);

      // Fallback to backend order status
      console.log("🔄 Falling back to backend order status");
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/orders/${orderId}`);
        
        if (backendResponse.ok) {
          const orderData = await backendResponse.json();
          console.log("📦 Backend order status (fallback):", orderData.payment_status);
          
          const transactionStatus = orderData.payment_status === "PAID" 
            ? "settlement" 
            : orderData.payment_status === "FAILED"
            ? "deny"
            : "pending";

          return NextResponse.json({
            _mock: true,
            _source: "backend_fallback",
            order_id: orderId,
            transaction_status: transactionStatus,
            transaction_time: orderData.created_at,
            payment_type: "qris",
            fraud_status: "accept",
            status_code: transactionStatus === "settlement" ? "200" : "201",
            status_message: `Transaction is ${transactionStatus}`,
            gross_amount: orderData.total_amount?.toString() || "0",
          });
        }
      } catch (backendError) {
        console.error("❌ Backend fallback error:", backendError);
      }

      // Final fallback
      return NextResponse.json({
        _mock: true,
        order_id: orderId,
        transaction_status: "pending",
        transaction_time: new Date().toISOString(),
        payment_type: "qris",
        fraud_status: "accept",
        status_code: "201",
        status_message: "Transaction is pending (fallback)",
        gross_amount: "0",
      });
    }
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
