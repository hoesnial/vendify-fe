import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log the notification for debugging
    console.log("🔔 Midtrans notification received:", body);

    // Verify the notification
    const { order_id, transaction_status, fraud_status } = body;

    // Forward notification to backend webhook
    try {
      console.log(
        `📤 Forwarding to backend: ${BACKEND_URL}/api/payments/webhook`
      );
      const backendResponse = await fetch(
        `${BACKEND_URL}/api/payments/webhook`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log("✅ Backend webhook response:", backendData);
      } else {
        console.error("❌ Backend webhook failed:", backendResponse.status);
      }
    } catch (backendError) {
      console.error("❌ Error forwarding to backend:", backendError);
      // Continue even if backend fails - don't block Midtrans webhook
    }

    // Handle different transaction statuses (for logging)
    switch (transaction_status) {
      case "capture":
        if (fraud_status === "challenge") {
          console.log("⚠️  Payment challenged:", order_id);
        } else if (fraud_status === "accept") {
          console.log("✅ Payment successful (capture):", order_id);
        }
        break;

      case "settlement":
        console.log("✅ Payment settled:", order_id);
        break;

      case "pending":
        console.log("⏳ Payment pending:", order_id);
        break;

      case "deny":
        console.log("❌ Payment denied:", order_id);
        break;

      case "cancel":
      case "expire":
        console.log("❌ Payment cancelled/expired:", order_id);
        break;

      default:
        console.log("❓ Unknown transaction status:", transaction_status);
    }

    // Return OK status to Midtrans
    return NextResponse.json({ status: "OK" });
  } catch (error) {
    console.error("❌ Webhook processing error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
