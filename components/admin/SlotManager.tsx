"use strict";
import { useState, useEffect } from "react";
import { vendingAPI } from "@/lib/api"; // Corrected import path
import { X, Save, RefreshCw, AlertTriangle } from "lucide-react";
import Image from "next/image";

interface Slot {
  id: number;
  slot_number: number;
  product_id: number | null;
  product_name: string | null;
  image_url: string | null;
  current_stock: number;
  capacity: number;
  is_active: number;
}

// Reuse Product interface from parent or redefine
interface Product {
  id: string;
  name: string;
  image: string;
}

interface SlotManagerProps {
  products: Product[];
  onClose: () => void;
}

export default function SlotManager({ products, onClose }: SlotManagerProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      setIsLoading(true);
      const machineInfo = await vendingAPI.getMachineInfo("VM01");
      if (machineInfo && machineInfo.slots) {
        setSlots(machineInfo.slots);
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      alert("Gagal memuat data slot.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setSelectedProductId(slot.product_id ? String(slot.product_id) : "");
  };

  const handleSave = async () => {
    if (!selectedSlot || !selectedProductId) return;

    try {
      setIsSaving(true);
      await vendingAPI.assignSlot("VM01", selectedSlot.id, Number(selectedProductId));
      
      alert(`Slot ${selectedSlot.slot_number} berhasil diperbarui!`);
      setSelectedSlot(null);
      fetchSlots(); // Refresh grid
    } catch (error) {
      console.error("Failed to assign slot:", error);
      alert("Gagal memperbarui slot.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Manajemen Slot</h2>
            <p className="text-gray-500 text-sm">Atur posisi produk dalam mesin vending</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50/50">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {slots.map((slot) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot)}
                  className={`
                    flex flex-col items-center p-3 rounded-xl border-2 transition-all relative overflow-hidden group
                    ${slot.product_id 
                        ? 'bg-white border-gray-200 hover:border-amber-400 hover:shadow-md' 
                        : 'bg-gray-100 border-dashed border-gray-300 hover:border-gray-400'
                    }
                  `}
                >
                  <span className="absolute top-2 left-2 text-xs font-bold bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                    #{slot.slot_number}
                  </span>
                  
                  <div className="w-16 h-16 relative mb-2 mt-4">
                    {slot.image_url ? (
                         <Image 
                            src={slot.image_url} 
                            alt={slot.product_name || "Product"}
                            fill
                            className="object-contain"
                         />
                    ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-gray-400 text-[10px]">Empty</span>
                        </div>
                    )}
                  </div>
                  
                  <p className="text-xs font-medium text-center line-clamp-2 text-gray-700 h-8">
                    {slot.product_name || "Kosong"}
                  </p>
                  
                  {slot.current_stock === 0 && slot.product_id && (
                    <div className="absolute top-2 right-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal (Internal) */}
        {selectedSlot && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in zoom-in-95 duration-200">
                    <h3 className="text-lg font-bold mb-4">Edit Slot #{selectedSlot.slot_number}</h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Pilih Produk
                            </label>
                            <select
                                value={selectedProductId}
                                onChange={(e) => setSelectedProductId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 font-medium"
                            >
                                <option value="">-- Kosongkan Slot --</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.name}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-2">
                                Mengubah produk akan mereset stok jika produk berbeda.
                            </p>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setSelectedSlot(null)}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !selectedProductId}
                                className="flex-1 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                                Simpan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
