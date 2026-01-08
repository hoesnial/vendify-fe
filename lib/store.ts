import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Product, Order } from "./api";

interface CartItem {
  product: Product;
  quantity: number;
}

interface VendingStore {
  // Machine state
  machineId: string;
  isOnline: boolean;

  // Cart
  cartItems: CartItem[];

  // Current transaction
  selectedProduct: Product | null;
  quantity: number;
  currentOrder: Order | null;

  // UI state
  currentScreen:
    | "home"
    | "product-detail"
    | "cart"
    | "order-summary"
    | "payment"
    | "dispensing"
    | "success"
    | "error";
  isLoading: boolean;
  error: string | null;

  // Actions
  setSelectedProduct: (product: Product | null) => void;
  setQuantity: (quantity: number) => void;
  setCurrentOrder: (order: Order | null) => void;
  setCurrentScreen: (screen: VendingStore["currentScreen"]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setMachineStatus: (online: boolean) => void;

  // Cart actions
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;

  // Reset transaction
  resetTransaction: () => void;
}

export const useVendingStore = create<VendingStore>()(
  persist(
    (set) => ({
      // Initial state
      machineId: "VM01",
      isOnline: true,
      cartItems: [],
      selectedProduct: null,
      quantity: 1,
      currentOrder: null,
      currentScreen: "home",
      isLoading: false,
      error: null,

      // Actions
      setSelectedProduct: (product) =>
        set({ selectedProduct: product, quantity: 1 }),

      setQuantity: (quantity) =>
        set({ quantity: Math.max(1, Math.min(10, quantity)) }),

      setCurrentOrder: (order) => set({ currentOrder: order }),

      setCurrentScreen: (screen) => set({ currentScreen: screen, error: null }),

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error, isLoading: false }),

      setMachineStatus: (online) => set({ isOnline: online }),

      // Cart actions
      addToCart: (product, quantity) =>
        set((state) => {
          const existingItem = state.cartItems.find(
            (item) => item.product.id === product.id
          );

          if (existingItem) {
            return {
              cartItems: state.cartItems.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item
              ),
            };
          }

          return {
            cartItems: [...state.cartItems, { product, quantity }],
          };
        }),

      removeFromCart: (productId) =>
        set((state) => ({
          cartItems: state.cartItems.filter(
            (item) => item.product.id !== productId
          ),
        })),

      updateCartQuantity: (productId, quantity) =>
        set((state) => ({
          cartItems: state.cartItems.map((item) =>
            item.product.id === productId
              ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) }
              : item
          ),
        })),

      clearCart: () => set({ cartItems: [] }),

      resetTransaction: () => {
        // Clear Midtrans token from localStorage when resetting
        const currentOrder = useVendingStore.getState().currentOrder;
        if (currentOrder?.order_id) {
          const storageKey = `midtrans_token_${currentOrder.order_id}`;
          localStorage.removeItem(storageKey);
        }

        set({
          selectedProduct: null,
          quantity: 1,
          currentOrder: null,
          currentScreen: "home",
          error: null,
          isLoading: false,
        });
      },
    }),
    {
      name: "vending-store", // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist important transaction data
      partialize: (state) => ({
        cartItems: state.cartItems,
        selectedProduct: state.selectedProduct,
        quantity: state.quantity,
        currentOrder: state.currentOrder,
        currentScreen: state.currentScreen,
      }),
    }
  )
);
