import axios, {
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("machine_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error("API Error RAW:", error);
    if (error.response) {
        console.error("API Error Response:", error.response.data);
        console.error("API Error Status:", error.response.status);
    } else if (error.request) {
        console.error("API No Response:", error.request);
    } else {
        console.error("API Setup Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export interface HealthAssistantResponse {
  success: boolean;
  message: string;
  isHealthRelated?: boolean;
  recommendedProducts?: Product[];
  timestamp?: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  slot_id?: number;
  slot_number?: number;
  current_stock?: number;
  final_price?: number;
}

export interface OrderItem {
  slot_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface Order {
  order_id: string;
  product_name?: string;
  quantity: number;
  unit_price?: number;
  total_amount: number;
  payment_url: string;
  payment_token: string;
  expires_at: string;
  qr_string: string;
  status: "PENDING" | "PAID" | "DISPENSING" | "COMPLETED" | "FAILED";
  paid_at?: string;
  dispensed_at?: string;
  items?: OrderItem[];
  total_quantity?: number;
}

export interface DispenseStatus {
  order_id: string;
  status: string;
  success?: boolean;
  drop_detected?: boolean;
  duration_ms?: number;
  error_message?: string;
}

// API functions
export const vendingAPI = {
  // Products
  getAvailableProducts: async (): Promise<{ products: Product[] }> => {
    const response = await api.get("/products/available");
    // Backend returns { success: true, data: [...], count: ... }
    // Transform to match expected format
    return {
      products: response.data.data || [],
    };
  },

  getProducts: async (): Promise<{ products: Product[] }> => {
    const response = await api.get("/products");
    return {
        products: response.data.products || [],
    };
  },

  getProduct: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  createProduct: async (formData: FormData): Promise<Product> => {
    const response = await api.post("/products", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  updateProduct: async (id: number, formData: FormData): Promise<Product> => {
    const response = await api.put(`/products/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  // Orders
  createOrder: async (orderData: {
    slot_id: number;
    quantity?: number;
    customer_phone?: string;
    payment_method?: "qris" | "va" | "gopay" | "shopeepay";
  }): Promise<Order> => {
    const response = await api.post("/orders", orderData);
    return response.data;
  },

  createMultiItemOrder: async (orderData: {
    items: Array<{ slot_id: number; quantity: number }>;
    customer_phone?: string;
    payment_method?: "qris" | "va" | "gopay" | "shopeepay";
  }): Promise<Order> => {
    const response = await api.post("/orders/multi", orderData);
    return response.data;
  },

  getOrderStatus: async (orderId: string): Promise<Order> => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Payments
  verifyPayment: async (
    orderId: string,
    status: "SUCCESS" | "FAILED" = "SUCCESS"
  ) => {
    const response = await api.post(`/payments/verify/${orderId}`, { status });
    return response.data;
  },

  updatePaymentMethod: async (
    orderId: string,
    paymentMethod: "qris" | "va" | "gopay" | "shopeepay" | "midtrans"
  ) => {
    const response = await api.patch(`/payments/method/${orderId}`, {
      payment_method: paymentMethod,
    });
    return response.data;
  },

  // Dispense
  triggerDispense: async (orderId: string) => {
    const response = await api.post("/dispense/trigger", { order_id: orderId });
    return response.data;
  },

  getDispenseStatus: async (orderId: string): Promise<DispenseStatus> => {
    const response = await api.get(`/dispense/status/${orderId}`);
    return response.data;
  },

  // Machine
  getMachineInfo: async (machineId: string = "VM01") => {
    const response = await api.get(`/machines/${machineId}`);
    return response.data;
  },

  updateMachineStatus: async (machineId: string = "VM01", status: string) => {
    const response = await api.post(`/machines/${machineId}/status`, {
      status,
    });
    return response.data;
  },

  assignSlot: async (machineId: string = "VM01", slotId: number, productId: number) => {
      const response = await api.post(`/machines/${machineId}/slots/assign`, {
          slot_id: slotId,
          product_id: productId
      });
      return response.data;
  },

  // Health Assistant
  chatWithAssistant: async (
    message: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<HealthAssistantResponse> => {
    const response = await api.post("/health-assistant/chat", {
      message,
      conversationHistory: conversationHistory || [],
    });
    return response.data;
  },

  getProductRecommendations: async (symptoms: string) => {
    const response = await api.post("/health-assistant/recommendations", {
      symptoms,
    });
    return response.data;
  },

  getAssistantStatus: async () => {
    const response = await api.get("/health-assistant/status");
    return response.data;
  },

  // Admin Authentication
  adminLogin: async (credentials: {
    username: string;
    password: string;
  }): Promise<{
    token: string;
    user: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
  }> => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  adminLogout: () => {
    // Clear admin token from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("admin_user");
      localStorage.removeItem("isAdminLoggedIn");
    }
  },

  // Stock Logs
  getStockLogs: async (
    machineId: string = "VM01",
    params?: {
      limit?: number;
      offset?: number;
      change_type?: string;
    }
  ) => {
    const response = await api.get(`/stock/logs/${machineId}`, { params });
    return response.data;
  },

  // Orders by Machine
  getOrdersByMachine: async (
    machineId: string = "VM01",
    params?: {
      limit?: number;
      offset?: number;
      status?: string;
    }
  ) => {
    const response = await api.get(`/orders/machine/${machineId}`, { params });
    return response.data;
  },

  // Users Management (Admin only)
  getAllUsers: async (): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      name: string;
      email: string;
      phone?: string;
      role: string;
      status: string;
      createdAt: string;
      lastLogin?: string;
    }>;
    total: number;
  }> => {
    // Use admin token instead of machine token
    const adminToken = typeof window !== "undefined" 
      ? localStorage.getItem("adminToken") 
      : null;
    
    const response = await api.get("/users/all", {
      headers: {
         Authorization: `Bearer ${adminToken}`,
      },
    });
    return response.data;
  },

  updateUser: async (data: {
    id: number;
    type: "admin_user" | "user";
    role?: string;
    status?: "active" | "locked" | "inactive";
  }) => {
    // Correct endpoint is /users/manage
    // Our api base url is /api, so this becomes /api/users/manage
    const response = await api.post("/users/manage", data, {
       headers: {
         Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
       },
    });
    return response.data;
  },

  addUser: async (data: any) => {
    const response = await api.post("/users/add", data, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
    });
    return response.data;
  },

  deleteUser: async (id: number, type: "admin_user" | "user") => {
    // Correct endpoint pattern from backend: DELETE /:type/:id
    const response = await api.delete(`/users/${type}/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("adminToken")}` }
    });
    return response.data;
  },

  // Stock Management
  updateStock: async (data: {
      slot_id: number;
      quantity: number;
      change_type: string;
      reason?: string;
  }) => {
     const response = await api.post("/stock/update", data);
     return response.data;
  },

  // Temperature
  getTemperatureLogs: async (machineId: string = "VM01", limit: number = 24) => {
    const response = await api.get(`/temperature/${machineId}`, {
        params: { limit }
    });
    return response.data;
  },

  // Finance
  getFinanceSummary: async () => {
    const response = await api.get("/finance/summary");
    return response.data;
  },
};

export default api;
