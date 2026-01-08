"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  Package,
  Search,
  Plus,
  Filter,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Thermometer,
  History,
  TrendingUp,
  ChevronRight,
  Bell,
  Edit,
  HelpCircle,
  RefreshCw,
  ArrowLeft,
  QrCode,
} from "lucide-react";
import ProductForm from "@/components/admin/ProductForm";
import StockForm from "@/components/admin/StockForm";
import SlotManager from "@/components/admin/SlotManager";

interface Product {
  id: string;
  name: string;
  sku: string;
  slot: string;
  current: number;
  capacity: number;
  status: "out-of-stock" | "low-stock" | "in-stock";
  image: string;
  slot_id: number;
}

interface ActivityLog {
  id: string;
  type: "refill" | "alert" | "error";
  title: string;
  user: string;
  time: string;
  message: string;
}

export default function InventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "low-stock" | "out-of-stock"
  >("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<"list" | "product-form" | "stock-form" | "slot-manager">("list");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSKUs: 0,
    lowStockAlerts: 0,
    criticalEmpty: 0,
    storageTemp: 4.2,
  });
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      router.replace("/admin");
      return;
    }

    // Fetch products from API
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const { vendingAPI } = await import("@/lib/api");
      const response = await vendingAPI.getProducts();

      // Transform API data to match our Product interface
      const transformedProducts: Product[] = [];

      response.products.forEach((p: any) => {
          if (p.slots && p.slots.length > 0) {
              p.slots.forEach((s: any) => {
                  const stockPercentage = s.current_stock && s.capacity
                    ? (s.current_stock / s.capacity) * 100
                    : 0;
                  
                  let status: "out-of-stock" | "low-stock" | "in-stock" = "in-stock";
                  if (s.current_stock === 0) status = "out-of-stock";
                  else if (s.current_stock < 5) status = "low-stock";

                  transformedProducts.push({
                      id: `${p.id}-${s.slot_id}`, // Unique ID for key
                      name: p.name,
                      sku: String(p.id).padStart(5, "0"),
                      slot: `A${s.slot_number}`,
                      current: s.current_stock || 0,
                      capacity: s.capacity || 50,
                      status,
                      image: p.image_url || "/images/placeholder-product.svg",
                      slot_id: s.slot_id
                  });
              });
          } else {
              // Product without slot
               transformedProducts.push({
                  id: String(p.id),
                  name: p.name,
                  sku: String(p.id).padStart(5, "0"),
                  slot: "N/A",
                  current: 0,
                  capacity: 50,
                  status: "out-of-stock",
                  image: p.image_url || "/images/placeholder-product.svg",
                  slot_id: 0
               });
          }
      });

      setProducts(transformedProducts);

      // Calculate stats
      const totalSKUs = transformedProducts.length;
      const lowStock = transformedProducts.filter(
        (p) => p.status === "low-stock"
      ).length;
      const outOfStock = transformedProducts.filter(
        (p) => p.status === "out-of-stock"
      ).length;

      setStats({
        totalSKUs,
        lowStockAlerts: lowStock,
        criticalEmpty: outOfStock,
        storageTemp: 4.2, // Temperature comes from machine status usually, mocking strictly temp
      });

      // Fetch stock logs
      await fetchStockLogs();
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setError("Gagal memuat data stok dari server. Pastikan backend aktif.");
      setProducts([]); // Clear products on error
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStockLogs = async () => {
    try {
      const { vendingAPI } = await import("@/lib/api");
      const response = await vendingAPI.getStockLogs("VM01", { limit: 10 });

      // Transform stock logs to activity logs
      const logs: ActivityLog[] =
        response.logs?.map(
          (log: {
            id: number;
            change_type: string;
            quantity_change: number;
            quantity_before: number;
            quantity_after: number;
            created_at: string;
            performed_by?: string;
            product_name?: string;
            slot_number?: string;
          }) => {
            const timeAgo = getTimeAgo(new Date(log.created_at));
            let type: "refill" | "alert" | "error" = "refill";
            let title = "Stok Diperbarui";

            if (log.change_type === "RESTOCK") {
              type = "refill";
              title = "Restock Selesai";
            } else if (log.change_type === "DISPENSE") {
              type = "alert";
              title = "Produk Terjual";
            } else if (log.change_type === "AUDIT") {
              type = "error";
              title = "Audit Stok";
            }

            return {
              id: String(log.id),
              type,
              title,
              user: log.performed_by || "Sistem Otomatis",
              time: timeAgo,
              message: `${log.product_name || `Slot ${log.slot_number || "?"}`}: ${
                log.quantity_before
              } → ${log.quantity_after} unit (${
                log.quantity_change > 0 ? "+" : ""
              }${log.quantity_change})`,
            };
          }
        ) || [];

      setActivityLogs(logs);
    } catch (error) {
      console.error("Failed to fetch stock logs:", error);
      // No fallback logs
      setActivityLogs([]);
    }
  };
  const handleAdd = () => {
      setEditingProduct(null);
      setView("product-form");
  };

  const handleEdit = async (product: Product) => {
    setIsLoading(true);
    try {
        const { vendingAPI } = await import("@/lib/api");
        // product.id might be composite "productId-slotId" due to flattening
        const rawId = product.id.toString().split("-")[0];
        const productId = Number(rawId);

        if (isNaN(productId)) {
            throw new Error("Invalid Product ID");
        }

        // We need to fetch the full product details because Inventory Product type is a subset/different view
        const fullProduct = await vendingAPI.getProduct(productId);
        setEditingProduct(fullProduct);
        setView("product-form");
    } catch (error) {
        console.error("Failed to fetch product details", error);
        alert("Gagal memuat detail produk.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleStock = async (product: Product) => {
    try {
      // 1. Show loading state if needed (optional, or just fast fetch)
      // product.id is "productId-slotId". Extract productId.
      const rawId = product.id.toString().split("-")[0];
      const productId = Number(rawId);

      if (!isNaN(productId)) {
          // 2. Fetch fresh data
          const { vendingAPI } = await import("@/lib/api");
          const freshProductData = await vendingAPI.getProduct(productId);
          
          // 3. Find the specific slot to get real-time stock
          // The API returns 'slots' array inside product
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const freshSlot = (freshProductData as any).slots?.find((s: any) => s.slot_id === product.slot_id);
          
          if (freshSlot) {
              console.log("Refreshed Stock Data:", freshSlot.current_stock);
              // Update the product object with fresh stock
              setSelectedProduct({
                  ...product,
                  current: freshSlot.current_stock, // Use fresh stock
                  capacity: freshSlot.capacity
              });
          } else {
              // Fallback if slot not found in fresh data (rare)
              setSelectedProduct(product);
          }
      } else {
          setSelectedProduct(product);
      }
    } catch (e) {
      console.error("Failed to refresh stock:", e);
      // Fallback to local state if fetch fails
      setSelectedProduct(product);
    }
    setView("stock-form");
  };

  const handleBack = () => {
      setView("list");
      setSelectedProduct(null);
      setEditingProduct(null);
      fetchProducts(); // Refresh list on return
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Baru saja";
    if (minutes < 60) return `${minutes} mnt lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    return `${days} hari lalu`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return "border-l-4 border-l-red-500 bg-red-50/10";
      case "low-stock":
        return "border-l-4 border-l-orange-400 bg-amber-50/30";
      case "in-stock":
        return "border-l-4 border-l-green-500";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return (
          <span className="text-xs font-bold text-red-600 flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full">
            <XCircle className="h-3 w-3" />
            Stok Habis
          </span>
        );
      case "low-stock":
        return (
          <span className="text-xs font-bold text-orange-600 flex items-center gap-1 bg-orange-100 px-2 py-1 rounded-full">
            <AlertTriangle className="h-3 w-3" />
            Menipis
          </span>
        );
      case "in-stock":
        return (
          <span className="text-xs font-bold text-green-600 flex items-center gap-1 bg-green-100 px-2 py-1 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            Tersedia
          </span>
        );
      default:
        return null;
    }
  };

  const getProgressBarColor = (status: string) => {
    switch (status) {
      case "out-of-stock":
        return "bg-red-500";
      case "low-stock":
        return "bg-orange-400";
      case "in-stock":
        return "bg-green-500";
      default:
        return "bg-gray-300";
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.includes(searchQuery) ||
      product.slot.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "low-stock" && product.status === "low-stock") ||
      (filterStatus === "out-of-stock" && product.status === "out-of-stock");

    return matchesSearch && matchesFilter;
  });

  const lowStockCount = products.filter((p) => p.status === "low-stock").length;
  const outOfStockCount = products.filter(
    (p) => p.status === "out-of-stock"
  ).length;

  return (
    <div className="flex h-screen bg-amber-50/20 font-sans">
      <AdminSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Header Section */}
        <header className="px-8 py-6 flex items-end justify-between bg-white/50 backdrop-blur-sm border-b border-amber-100 sticky top-0 z-10">
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Admin</span>
              <ChevronRight className="h-3 w-3" />
              <span>Manajemen Stok</span>
              {view !== "list" && (
                <>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-amber-600">{view === "product-form" ? (editingProduct ? "Edit Produk" : "Tambah Produk") : "Isi Stok"}</span>
                </>
              )}
            </div>
            
            <div className="flex items-center gap-4">
                {view !== "list" && (
                    <button 
                        onClick={handleBack}
                        className="p-2 -ml-2 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors"
                    >
                        <ArrowLeft className="w-8 h-8" />
                    </button>
                )}
                <div>
                    <h2 className="text-3xl font-black tracking-tight text-amber-900">
                    {view === "list" ? "Stok Produk" : view === "stock-form" ? "Atur Stok Produk" : (editingProduct ? "Edit Produk" : "Produk Baru")}
                    </h2>
                    <p className="text-gray-500 font-medium">
                    {view === "list" ? "Monitor level produk & atur restock • Mesin #402" : 
                     view === "stock-form" ? `Update stok untuk ${selectedProduct?.name}` : 
                     "Kelola detail produk vending machine."}
                    </p>
                </div>
            </div>
          </div>
          
          {view === "list" && (
            <div className="flex items-center gap-3">
                <button
                onClick={() => fetchProducts()}
                className="h-12 w-12 rounded-xl flex items-center justify-center bg-white border border-amber-100 text-gray-400 hover:text-amber-500 hover:border-amber-300 transition-all shadow-sm"
                title="Refresh Data"
                >
                <RefreshCw className={`h-5 w-5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
                <button
                    onClick={() => setView("slot-manager")}
                    className="h-12 px-6 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold flex items-center gap-2 transition-all mr-3"
                >
                    <Filter className="h-5 w-5" />
                    <span>Atur Slot</span>
                </button>
                <button 
                onClick={handleAdd}
                className="h-12 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold flex items-center gap-2 shadow-lg shadow-amber-200 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                <Plus className="h-5 w-5" />
                <span>Tambah Produk</span>
                </button>
            </div>
          )}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 pb-32">
          {view === "product-form" ? (
              <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-amber-50 border border-amber-100 max-w-3xl mx-auto">
                  <ProductForm 
                    product={editingProduct} 
                    onSuccess={handleBack} 
                    onCancel={handleBack} 
                  />
              </div>
          ) : view === "stock-form" && selectedProduct ? (
               <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-amber-50 border border-amber-100 max-w-2xl mx-auto">
               <div className="bg-white rounded-[32px] p-8 shadow-lg shadow-amber-50 border border-amber-100 max-w-2xl mx-auto">
                  <StockForm
                    slotId={selectedProduct.slot_id}
                    productName={selectedProduct.name}
                    currentStock={selectedProduct.current}
                    capacity={selectedProduct.capacity}
                    onSuccess={handleBack}
                    onCancel={handleBack}
                  />
               </div>
               </div>
          ) : view === "slot-manager" ? (
             <SlotManager 
                products={products.map(p => ({ id: p.id, name: p.name, image: p.image }))} 
                onClose={handleBack} 
             />
          ) : (
            <>
          {error ? (
            <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-3xl border border-red-100 border-dashed p-8">
               <AlertTriangle className="w-16 h-16 text-red-400 mb-4" />
               <h3 className="text-xl font-bold text-red-800 mb-2">Gagal Memuat Data</h3>
               <p className="text-red-600 mb-6 text-center max-w-md">{error}</p>
               <button 
                  onClick={() => fetchProducts()}
                  className="px-6 py-2 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
                >
                  Coba Lagi
               </button>
            </div>
          ) : isLoading && products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold">
                  Memuat data stok dari backend...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Stat Card 1 */}
                <div className="bg-white p-6 rounded-3xl border border-amber-50 shadow-lg shadow-amber-100/50 flex flex-col justify-between h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Package className="h-24 w-24 text-amber-900" />
                  </div>
                  <p className="text-gray-500 font-bold text-sm z-10">Total SKU</p>
                  <div>
                    <p className="text-4xl font-black text-amber-900 z-10">
                      {stats.totalSKUs}
                    </p>
                    <p className="text-xs text-green-600 font-bold flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      Aktif dijual
                    </p>
                  </div>
                </div>

                {/* Stat Card 2 */}
                <div className="bg-white p-6 rounded-3xl border border-amber-50 shadow-lg shadow-orange-100/50 flex flex-col justify-between h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertTriangle className="h-24 w-24 text-orange-600" />
                  </div>
                  <p className="text-gray-500 font-bold text-sm z-10">
                    Stok Menipis
                  </p>
                  <div>
                    <p className="text-4xl font-black text-orange-500 z-10">
                      {stats.lowStockAlerts}
                    </p>
                    <p className="text-xs text-orange-600 font-bold mt-1">
                      Perlu restock segera
                    </p>
                  </div>
                </div>

                {/* Stat Card 3 */}
                <div className="bg-white p-6 rounded-3xl border border-amber-50 shadow-lg shadow-red-100/50 flex flex-col justify-between h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <XCircle className="h-24 w-24 text-red-600" />
                  </div>
                  <p className="text-gray-500 font-bold text-sm z-10">
                    Stok Habis (Kritis)
                  </p>
                  <div>
                    <p className="text-4xl font-black text-red-500 z-10">
                      {stats.criticalEmpty}
                    </p>
                    <p className="text-xs text-red-600 font-bold mt-1">
                      Tindakan diperlukan
                    </p>
                  </div>
                </div>

                {/* Stat Card 4 */}
                <div className="bg-white p-6 rounded-3xl border border-amber-50 shadow-lg shadow-amber-100/50 flex flex-col justify-between h-36 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                  <div className="absolute right-[-10px] top-[-10px] p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Thermometer className="h-24 w-24 text-blue-600" />
                  </div>
                  <p className="text-gray-500 font-bold text-sm z-10">
                    Suhu Penyimpanan
                  </p>
                  <div>
                    <p className="text-4xl font-black text-gray-900 z-10">
                      {stats.storageTemp}°C
                    </p>
                    <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Rentang Optimal
                    </p>
                  </div>
                </div>
              </div>

              {/* Filters & Search Toolbar */}
              <div className="flex flex-col lg:flex-row gap-4 mb-6 sticky top-24 z-20 py-2 -mx-2 px-2">
                <div className="flex-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    className="block w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white shadow-lg shadow-amber-100/20 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-amber-500 h-14 font-medium transition-all"
                    placeholder="Cari nama produk, SKU, atau slot..."
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 no-scrollbar">
                  <button
                    onClick={() => setFilterStatus("all")}
                    className={`flex items-center gap-2 h-14 px-6 rounded-2xl font-bold shadow-sm whitespace-nowrap transition-all hover:-translate-y-0.5 ${
                      filterStatus === "all"
                        ? "bg-gray-900 text-white shadow-gray-200"
                        : "bg-white text-gray-500 border border-amber-100 hover:border-amber-300"
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    Semua
                  </button>
                  <button
                    onClick={() => setFilterStatus("low-stock")}
                    className={`flex items-center gap-2 h-14 px-6 rounded-2xl font-bold border transition-all whitespace-nowrap hover:-translate-y-0.5 ${
                      filterStatus === "low-stock"
                        ? "bg-orange-50 border-orange-300 text-orange-700 shadow-sm"
                        : "bg-white text-gray-500 border-amber-100 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <AlertTriangle className={`h-4 w-4 ${filterStatus === "low-stock" ? "text-orange-600" : "text-gray-400"}`} />
                    Menipis ({lowStockCount})
                  </button>
                  <button
                    onClick={() => setFilterStatus("out-of-stock")}
                    className={`flex items-center gap-2 h-14 px-6 rounded-2xl font-bold border transition-all whitespace-nowrap hover:-translate-y-0.5 ${
                      filterStatus === "out-of-stock"
                        ? "bg-red-50 border-red-300 text-red-700 shadow-sm"
                        : "bg-white text-gray-500 border-amber-100 hover:border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <XCircle className={`h-4 w-4 ${filterStatus === "out-of-stock" ? "text-red-600" : "text-gray-400"}`} />
                    Habis ({outOfStockCount})
                  </button>
                  <button className="flex items-center gap-2 h-14 px-6 rounded-2xl bg-white text-gray-500 font-bold border border-amber-100 hover:border-amber-400 hover:text-amber-600 transition-all whitespace-nowrap hover:-translate-y-0.5">
                    <Filter className="h-4 w-4" />
                    Filter
                  </button>
                </div>
              </div>

              {/* Product List */}
              <div className="flex flex-col gap-4">
                {products.length === 0 && !isLoading ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-amber-100 shadow-sm">
                        <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Belum Ada Data Produk</h3>
                        <p className="text-gray-500 mb-6">Database produk kosong atau tidak ada produk aktif.</p>
                        <button
                                onClick={() => router.push('/admin/products')}
                                className="px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors"
                        >
                            Kelola Produk Master
                        </button>
                    </div>
                ) : (
                    filteredProducts.map((product) => (
                    <div
                        key={product.id}
                        className={`flex flex-col md:flex-row items-center gap-6 p-4 rounded-3xl bg-white shadow-lg shadow-amber-50/50 border hover:shadow-xl transition-all ${getStatusColor(
                        product.status
                        )}`}
                    >
                        <div className="flex items-center gap-4 w-full md:w-1/3">
                        <div className="size-20 rounded-2xl bg-gray-50 shrink-0 flex items-center justify-center p-2 relative border border-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                            alt={`${product.name} packaging`}
                            className="w-full h-full object-contain mix-blend-multiply"
                            src={product.image}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/images/placeholder-product.svg";
                            }}
                            />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">
                            {product.name}
                            </h3>
                            <div className="flex gap-2 mt-2">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-lg text-[10px] font-bold text-gray-500 tracking-wider">
                                SKU: {product.sku}
                            </span>
                            <span className="bg-amber-50 px-2 py-0.5 rounded-lg text-[10px] font-bold text-amber-700 tracking-wider border border-amber-100">
                                SLOT: {product.slot}
                            </span>
                            </div>
                        </div>
                        </div>

                        <div className="flex-1 w-full px-4">
                        <div className="flex justify-between items-end mb-2">
                            {getStatusBadge(product.status)}
                            <span className="text-lg font-bold text-gray-900">
                            {product.current} <span className="text-sm text-gray-400 font-normal">/ {product.capacity}</span>
                            </span>
                        </div>
                        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                            <div
                            className={`h-full ${getProgressBarColor(
                                product.status
                            )} transition-all duration-500 ease-out`}
                            style={{
                                width: `${
                                (product.current / product.capacity) * 100
                                }%`,
                            }}
                            ></div>
                        </div>
                        </div>

                        <div className="w-full md:w-auto flex justify-end gap-3">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="h-10 w-10 rounded-xl flex items-center justify-center border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                        >
                            <Edit className="h-4 w-4" />
                        </button>
                        {product.status === "in-stock" ? (
                            <button 
                              onClick={() => handleStock(product)}
                              className="h-10 px-6 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 text-sm"
                            >
                            <span>Atur Stok</span>
                            </button>
                        ) : (
                            <button 
                              onClick={() => handleStock(product)}
                              className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center gap-2 text-sm hover:-translate-y-0.5"
                            >
                            <Plus className="h-4 w-4" />
                            Isi Stok
                            </button>
                        )}
                        </div>
                    </div>
                    ))
                )}
              </div>
            </>
          )}
        </>
      )}
        </div>

        {/* Floating Quick Action Button for Mobile */}
        {!isLoading && (
          <button className="absolute bottom-8 right-8 size-14 bg-gray-900 rounded-full shadow-2xl shadow-black/20 flex items-center justify-center text-white z-30 md:hidden hover:scale-110 transition-transform">
            <QrCode className="h-6 w-6" />
          </button>
        )}
      </main>

      {/* Right side details panel - Activity Log */}
      {!isLoading && view === "list" && (
        <aside className="w-80 bg-white border-l border-amber-100 hidden xl:flex flex-col p-6 overflow-y-auto z-10 shadow-lg shadow-amber-50">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <History className="h-5 w-5 text-amber-500" />
            Riwayat Aktivitas
          </h3>
          <div className="relative pl-6 border-l-2 border-dashed border-gray-100 space-y-8">
            {activityLogs.length === 0 ? (
                <div className="text-gray-400 text-sm italic">Belum ada aktivitas tercatat.</div>
            ) : (
                activityLogs.map((log, index) => (
                <div key={log.id} className="relative">
                    <div
                    className={`absolute -left-[31px] top-1 size-4 rounded-full border-4 border-white shadow-sm ${
                        index === 0 ? "bg-amber-500" : "bg-gray-300"
                    }`}
                    ></div>
                    <p className="text-sm font-bold text-gray-900">{log.title}</p>
                    <div className="flex gap-2 text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">
                    <span>{log.user}</span>
                    <span>•</span>
                    <span>{log.time}</span>
                    </div>
                    <div
                    className={`mt-2 p-3 rounded-xl text-xs font-medium border ${
                        log.type === "refill"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : log.type === "alert"
                        ? "bg-orange-50 text-orange-700 border-orange-100"
                        : "bg-red-50 text-red-700 border-red-100"
                    }`}
                    >
                    {log.message}
                    </div>
                </div>
                ))
            )}
          </div>

          <div className="mt-auto pt-6">
            <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-3 border border-amber-100">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <HelpCircle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Butuh Bantuan?</p>
                <p className="text-xs text-amber-700 font-medium">Hubungi Teknisi</p>
              </div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
