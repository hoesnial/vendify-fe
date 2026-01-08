"use client";

import { useState, FormEvent } from "react";
import { Package, Plus, Minus, RefreshCw } from "lucide-react";
import { vendingAPI } from "@/lib/api";

interface StockFormProps {
  slotId: number;
  productName: string;
  currentStock: number;
  capacity: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function StockForm({
  slotId,
  productName,
  currentStock,
  capacity,
  onSuccess,
  onCancel,
}: StockFormProps) {
  const [method, setMethod] = useState<"add" | "remove" | "set">("add");
  const [quantity, setQuantity] = useState<number>(0); // Start with 0 for safety
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!slotId || slotId < 1) {
        alert("Produk ini belum ditempatkan di slot vending machine. Silakan atur slot terlebih dahulu di database Admin.");
        return;
    }

    setIsSubmitting(true);

    try {
      let change_type = "MANUAL_ADJUST";
      if (method === "add") change_type = "RESTOCK";
      if (method === "remove") change_type = "REMOVE";

      const payload = {
          slot_id: slotId,
          quantity: Number(quantity),
          change_type,
          reason: "Admin Manual Update",
          expected_current_stock: currentStock // OCC: Optimistic Locking
      };
      
      await vendingAPI.updateStock(payload);

      alert("Stok berhasil diperbarui!");
      onSuccess();
    } catch (error) {
      console.error("Update stock error:", error);
      alert("Gagal memperbarui stok.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-amber-50 rounded-xl p-4 flex items-center gap-4 border border-amber-100">
         <div className="p-3 bg-white rounded-lg shadow-sm">
            <Package className="h-6 w-6 text-amber-500" />
         </div>
         <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Product</p>
            <h3 className="font-bold text-gray-900 text-lg leading-none mt-1">{productName}</h3>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
         <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
            <p className="text-sm font-medium text-gray-500 mb-1">Current Stock</p>
            <p className="text-3xl font-black text-gray-900">{currentStock}</p>
         </div>
         <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
             <p className="text-sm font-medium text-gray-500 mb-1">Max Capacity</p>
            <p className="text-3xl font-black text-gray-400">{capacity}</p>
         </div>
      </div>

      <div>
        <label className="block text-sm font-bold text-gray-700 mb-3">Update Method</label>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
           <button
             type="button"
             onClick={() => { setMethod("add"); setQuantity(0); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                method === "add" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
             }`}
           >
             Add
           </button>
           <button
             type="button"
             onClick={() => { setMethod("remove"); setQuantity(0); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                method === "remove" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
             }`}
           >
             Remove
           </button>
           <button
             type="button"
             onClick={() => { setMethod("set"); setQuantity(currentStock); }}
             className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                method === "set" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
             }`}
           >
             Set Total
           </button>
        </div>
      </div>

      <div>
         <label className="block text-sm font-bold text-gray-700 mb-2">
            {method === "add" ? "Quantity to Add" : method === "remove" ? "Quantity to Remove" : "New Total Stock"}
         </label>
         <div className="flex items-center gap-3">
             <button 
                type="button"
                onClick={() => setQuantity(Math.max(0, quantity - 5))}
                className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                <Minus className="h-5 w-5 text-gray-500" />
             </button>
             <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="flex-1 text-center font-bold text-xl h-12 rounded-xl border-gray-300 focus:ring-amber-500 focus:border-amber-500"
                min="0"
             />
              <button 
                type="button"
                 onClick={() => setQuantity(quantity + 5)}
                className="p-3 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
                <Plus className="h-5 w-5 text-gray-500" />
             </button>
         </div>
         {method !== "set" && (
            <p className="text-xs text-center text-gray-400 mt-2 font-medium">
                New Total: <span className="text-amber-600 font-bold">
                    {method === "add" 
                        ? Math.min(currentStock + quantity, capacity) 
                        : Math.max(currentStock - quantity, 0)
                    }
                </span>
            </p>
         )}
      </div>

      <div className="pt-4 border-t border-gray-100 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-lg shadow-amber-200 flex items-center justify-center gap-2"
        >
          {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
          confirm Update
        </button>
      </div>
    </form>
  );
}
