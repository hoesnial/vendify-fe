import { createClient } from "@supabase/supabase-js";
import type { RealtimeChannel } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️  Supabase credentials not found. Please add them to .env.local"
  );
}

// Create Supabase client for frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Helper function to handle Supabase errors
export function handleSupabaseError(error: unknown) {
  if (error) {
    const err = error as { message?: string };
    console.error("Supabase error:", error);
    return {
      success: false,
      error: err.message || "An unknown error occurred",
    };
  }
  return { success: true };
}

// Storage helpers for product images
export const storage = {
  async uploadProductImage(file: File, productId: string) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${productId}-${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from("product-images")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(filePath);

    return {
      path: filePath,
      url: publicUrl,
    };
  },

  async deleteProductImage(filePath: string) {
    const { error } = await supabase.storage
      .from("product-images")
      .remove([filePath]);

    if (error) throw error;
    return true;
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  },
};

// Real-time subscription helpers
export const realtime = {
  subscribeToOrders(callback: (payload: unknown) => void) {
    return supabase
      .channel("orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        callback
      )
      .subscribe();
  },

  subscribeToMachineStatus(
    machineId: string,
    callback: (payload: unknown) => void
  ) {
    return supabase
      .channel(`machine-${machineId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "machines",
          filter: `id=eq.${machineId}`,
        },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel: RealtimeChannel) {
    return supabase.removeChannel(channel);
  },
};
