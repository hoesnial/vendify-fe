import { MIDTRANS_CONFIG } from "./midtrans";

export interface PaymentRequest {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: {
    id: string;
    price: number;
    quantity: number;
    name: string;
  }[];
}

export interface PaymentResponse {
  token: string;
  redirect_url: string;
}

export interface PaymentStatus {
  order_id: string;
  status_code: string;
  transaction_status: string;
  fraud_status: string;
  payment_type: string;
  gross_amount: string;
}

class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = MIDTRANS_CONFIG.isProduction
      ? MIDTRANS_CONFIG.productionBaseUrl
      : MIDTRANS_CONFIG.sandboxBaseUrl;
  }

  // Create payment transaction
  async createTransaction(
    paymentRequest: PaymentRequest
  ): Promise<PaymentResponse> {
    try {
      console.log("🔄 Creating payment transaction:", paymentRequest);

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentRequest),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("❌ Payment API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          details: errorData.details,
        });

        const errorMessage =
          errorData.error || "Failed to create payment transaction";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("✅ Payment transaction created:", {
        hasToken: !!data.token,
        hasRedirectUrl: !!data.redirect_url,
      });
      return data;
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error("❌ Error creating payment transaction:", err.message);
      throw error;
    }
  }

  // Check payment status
  async checkPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      console.log("🔍 Checking payment status for:", orderId);

      const response = await fetch(`/api/payment/status/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || `HTTP ${response.status}: ${response.statusText}`;
        console.error("Payment status API error:", errorMessage);
        throw new Error(`Failed to check payment status: ${errorMessage}`);
      }

      const data = await response.json();
      console.log("📊 Payment status response:", data);
      return data;
    } catch (error) {
      console.error("Error checking payment status:", error);

      // Return mock status for development if API fails
      console.log("🎭 Returning mock payment status due to error");
      return {
        _mock: true,
        order_id: orderId,
        transaction_status: "pending",
        transaction_time: new Date().toISOString(),
        payment_type: "qris",
        fraud_status: "accept",
        status_code: "201",
        status_message: "Mock transaction status (API error fallback)",
        gross_amount: "0",
      } as PaymentStatus & {
        _mock: boolean;
        transaction_time: string;
        status_message: string;
      };
    }
  }

  // Cancel payment transaction
  async cancelPayment(orderId: string): Promise<boolean> {
    try {
      console.log("🚫 Cancelling payment for:", orderId);
      
      // Use keepalive for reliability during page unload
      const response = await fetch(`/api/payment/cancel/${orderId}`, {
        method: "POST",
        keepalive: true, 
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.error("Failed to cancel payment:", response.statusText);
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error cancelling payment:", error);
      return false;
    }
  }

  // Generate order ID
  generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ORDER-${timestamp}-${random}`.toUpperCase();
  }

  // Format amount for Midtrans (no decimal places)
  formatAmount(amount: number): number {
    return Math.round(amount);
  }

  // Open Snap payment popup
  async openSnapPayment(
    token: string
  ): Promise<import("midtrans-client").SnapResult> {
    return new Promise((resolve, reject) => {
      if (
        typeof window !== "undefined" &&
        (window as import("midtrans-client").WindowWithSnap).snap
      ) {
        let isFinished = false; // Track if payment is already finished

        (window as import("midtrans-client").WindowWithSnap).snap!.pay(token, {
          onSuccess: function (result: import("midtrans-client").SnapResult) {
            console.log("✅ Payment success:", result);
            isFinished = true; // Mark as finished
            resolve(result);
          },
          onPending: function (result: import("midtrans-client").SnapResult) {
            console.log("⏳ Payment pending:", result);
            isFinished = true; // Mark as finished
            resolve(result);
          },
          onError: function (result: import("midtrans-client").SnapResult) {
            console.log("❌ Payment error:", result);
            isFinished = true; // Mark as finished
            reject(result);
          },
          onClose: function () {
            console.log("🚪 Payment popup closed by user");

            // Only handle close if payment hasn't finished yet
            if (!isFinished) {
              console.log("⚠️ Popup closed without completing payment");
              // For VA/Bank Transfer, popup is closed after instructions shown
              // Return pending status instead of rejecting
              resolve({
                transaction_status: "pending",
                status_code: "201",
                status_message:
                  "Payment popup closed - please complete payment",
              } as import("midtrans-client").SnapResult);
            } else {
              console.log(
                "✅ Popup closed after payment completion - ignoring"
              );
              // Payment already handled by onSuccess/onPending/onError
              // Don't resolve again
            }
          },
        });
      } else {
        reject(new Error("Snap.js not loaded"));
      }
    });
  }

  // Load Snap.js script
  loadSnapScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window !== "undefined") {
        // Check if script is already loaded
        if ((window as import("midtrans-client").WindowWithSnap).snap) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.src = MIDTRANS_CONFIG.isProduction
          ? MIDTRANS_CONFIG.productionSnapUrl
          : MIDTRANS_CONFIG.sandboxSnapUrl;
        script.setAttribute("data-client-key", MIDTRANS_CONFIG.clientKey);

        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load Snap.js"));

        document.head.appendChild(script);
      } else {
        reject(new Error("Window object not available"));
      }
    });
  }
}

export const paymentService = new PaymentService();
