// Midtrans Configuration
export const MIDTRANS_CONFIG = {
  // Use sandbox for development, production for live
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-YOUR_SERVER_KEY",
  clientKey:
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    "SB-Mid-client-YOUR_CLIENT_KEY",

  // Sandbox URLs
  sandboxBaseUrl: "https://api.sandbox.midtrans.com",
  sandboxSnapUrl: "https://app.sandbox.midtrans.com/snap/snap.js",

  // Production URLs
  productionBaseUrl: "https://api.midtrans.com",
  productionSnapUrl: "https://app.midtrans.com/snap/snap.js",
};

export const getMidtransConfig = () => {
  return {
    baseUrl: MIDTRANS_CONFIG.isProduction
      ? MIDTRANS_CONFIG.productionBaseUrl
      : MIDTRANS_CONFIG.sandboxBaseUrl,
    snapUrl: MIDTRANS_CONFIG.isProduction
      ? MIDTRANS_CONFIG.productionSnapUrl
      : MIDTRANS_CONFIG.sandboxSnapUrl,
    clientKey: MIDTRANS_CONFIG.clientKey,
    serverKey: MIDTRANS_CONFIG.serverKey,
  };
};
