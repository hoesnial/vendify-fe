import { NextRequest, NextResponse } from "next/server";
import midtransClient from "midtrans-client";

// Initialize Snap API client
const snap = new midtransClient.Snap({
  isProduction: false, // Set to true for production
  serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SERVER_KEY",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      orderId,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      items,
    } = body;

    console.log("📥 Payment creation request:", {
      orderId,
      amount,
      customerName,
      itemsCount: items?.length,
    });

    // Validate required fields
    if (!orderId || !amount || !customerName || !items || items.length === 0) {
      console.error("❌ Validation failed: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check Midtrans credentials
    if (
      !process.env.MIDTRANS_SERVER_KEY ||
      process.env.MIDTRANS_SERVER_KEY.includes("YOUR_SERVER_KEY")
    ) {
      console.error("❌ Midtrans server key not configured");
      return NextResponse.json(
        {
          error:
            "Midtrans server key not configured. Please set MIDTRANS_SERVER_KEY in .env.local",
        },
        { status: 500 }
      );
    }

    // Prepare transaction details
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: amount,
      },
      customer_details: {
        first_name: customerName,
        email: customerEmail || "customer@vendingmachine.com",
        phone: customerPhone || "08123456789",
      },
      item_details: items.map(
        (item: {
          id: string;
          price: number;
          quantity: number;
          name: string;
        }) => ({
          id: item.id,
          price: item.price,
          quantity: item.quantity,
          name: item.name,
        })
      ),
      credit_card: {
        secure: true,
      },
      callbacks: {
        finish: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
        error: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/error`,
        pending: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/pending`,
      },
      // IMPORTANT: Notification URL for Midtrans to send payment status updates
      // This is required for automatic payment status updates
      notification_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payment/webhook`,
    };

    console.log("🔄 Creating Midtrans transaction...", {
      order_id: parameter.transaction_details.order_id,
      gross_amount: parameter.transaction_details.gross_amount,
    });

    // Create transaction
    const transaction = await snap.createTransaction(parameter);

    console.log("✅ Midtrans transaction created successfully:", {
      token: transaction.token ? "✓" : "✗",
      redirect_url: transaction.redirect_url ? "✓" : "✗",
    });

    return NextResponse.json({
      token: transaction.token,
      redirect_url: transaction.redirect_url,
    });
  } catch (error: unknown) {
    const err = error as {
      message?: string;
      httpStatusCode?: number;
      ApiResponse?: unknown;
    };
    console.error("❌ Payment creation error:", {
      message: err.message,
      statusCode: err.httpStatusCode,
      apiResponse: err.ApiResponse,
      rawError: error,
    });

    // Return more detailed error message
    const errorMessage = err.message || "Failed to create payment transaction";
    const statusCode = err.httpStatusCode || 500;

    return NextResponse.json(
      {
        error: errorMessage,
        details:
          (err.ApiResponse as { error_messages?: string[] })?.error_messages ||
          [],
        statusCode: statusCode,
      },
      { status: statusCode }
    );
  }
}
