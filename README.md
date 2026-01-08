# Vending Machine Frontend

Frontend UI untuk sistem vending machine IoT menggunakan Next.js dan React. Dirancang khusus untuk touchscreen interface.

## 🚀 Fitur

- **Touchscreen Optimized UI** untuk pengalaman pengguna yang optimal
- **Real-time Product Display** dengan informasi stok
- **QRIS Payment Integration** dengan QR code scanner
- **Multi-step Transaction Flow** yang user-friendly
- **Responsive Design** untuk berbagai ukuran layar
- **Error Handling** yang komprehensif
- **State Management** dengan Zustand
- **Type Safety** dengan TypeScript

## 📱 User Flow

1. **Home** - Pilih produk dari grid
2. **Product Detail** - Lihat detail dan atur jumlah
3. **Order Summary** - Konfirmasi pesanan
4. **Payment** - Scan QR code untuk pembayaran
5. **Dispensing** - Proses pengeluaran produk
6. **Success/Error** - Hasil transaksi

## 🛠️ Installation

1. **Install dependencies**

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Setup environment**

   ```bash
   cp .env.example .env.local
   # Edit .env.local dengan konfigurasi API Anda
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

Edit file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_MACHINE_ID=VM01
NEXT_PUBLIC_KIOSK_MODE=true
NEXT_PUBLIC_DEBUG=false
```
