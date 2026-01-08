## 🧪 **Step-by-Step Testing Pembayaran Midtrans**

### **1. 🚀 Akses Vending Machine Interface**

1. Buka browser dan ke: **http://localhost:3000**
2. Anda akan melihat halaman vending machine dengan daftar produk

### **2. 🛒 Simulasi Pembelian Produk**

1. **Klik salah satu produk** yang tersedia (misalnya Coca Cola)
2. **Pilih quantity** yang diinginkan
3. **Klik "Beli Sekarang"** untuk lanjut ke ringkasan pesanan
4. **Review pesanan** di halaman Order Summary
5. **Klik "Lanjut ke Pembayaran"**

### **3. 💳 Testing Metode Pembayaran**

#### **A. Test Midtrans Payment:**

1. **Pilih "Kartu Kredit/Debit"** (Midtrans option)
2. **Klik "Bayar Sekarang"**
3. **Popup Midtrans** akan muncul dengan opsi pembayaran

#### **B. Test Cards untuk Sandbox:**

Gunakan kartu test ini di popup Midtrans:

**💳 Credit Card (Sukses):**

- **Number**: `4811 1111 1111 1114`
- **CVV**: `123`
- **Expiry**: `12/25` (any future date)
- **Result**: Payment SUCCESS

**💳 Credit Card (Gagal):**

- **Number**: `4911 1111 1111 1113`
- **CVV**: `123`
- **Expiry**: `12/25`
- **Result**: Payment FAILED

**🏦 Bank Transfer:**

- Pilih bank (BCA, Mandiri, etc.)
- Copy virtual account number
- **Untuk testing**: Otomatis berhasil setelah 1-2 menit

**📱 E-Wallet (GoPay/OVO/DANA):**

- Pilih e-wallet
- Scan QR code (untuk testing gunakan simulator)

### **4. 🔍 Monitor Payment Flow**

#### **Success Flow:**

```
Produk → Order → Payment → Midtrans Popup →
SUCCESS → Callback Page → Dispensing → Success
```

#### **Error Flow:**

```
Produk → Order → Payment → Midtrans Popup →
FAILED → Error Page → Back to Home
```

#### **Pending Flow:**

```
Produk → Order → Payment → Midtrans Popup →
PENDING → Pending Page → Auto Check Status
```

### **5. 🛠️ Debug dan Monitoring**

#### **Check Console Logs:**

1. Buka **Developer Tools** (F12)
2. Lihat **Console tab** untuk logs
3. Monitor API calls di **Network tab**

#### **Backend Logs:**

Monitor terminal backend untuk:

- Payment creation logs
- Webhook notifications
- Database updates

#### **Database Check:**

Jika menggunakan database, cek tabel:

- `orders` - status pesanan
- `transactions` - detail pembayaran
- `products` - update stok

### **6. 🎯 Test Scenarios**

#### **Scenario 1: Successful Payment**

1. Pilih produk → Checkout → Midtrans
2. Use: `4811 1111 1111 1114`
3. Expected: Success page → Product dispensed

#### **Scenario 2: Failed Payment**

1. Pilih produk → Checkout → Midtrans
2. Use: `4911 1111 1111 1113`
3. Expected: Error page → Back to home

#### **Scenario 3: QRIS Payment**

1. Pilih produk → Checkout → QRIS
2. View QR code
3. Simulate scan success

#### **Scenario 4: Payment Timeout**

1. Pilih produk → Checkout → Midtrans
2. Close popup without paying
3. Expected: Timeout → Error handling

### **7. 🔧 Troubleshooting**

#### **Problem: Midtrans Popup Not Opening**

- Check browser console for Snap.js errors
- Verify client key in .env.local
- Check CORS settings

#### **Problem: Payment Always Fails**

- Verify server key di backend .env
- Check Midtrans dashboard untuk transaction logs
- Monitor webhook endpoint

#### **Problem: Database Errors**

- Check MySQL connection
- Verify tables exist
- Check user permissions

### **8. 📊 Midtrans Dashboard Monitoring**

1. **Login ke [Sandbox Dashboard](https://dashboard.sandbox.midtrans.com)**
2. **Go to "Transactions"** untuk melihat test payments
3. **Monitor webhook calls** di "Settings → Configuration"

### **9. 🎭 Advanced Testing**

#### **Webhook Testing:**

```bash
# Test webhook endpoint
curl -X POST http://localhost:3000/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{"order_id":"TEST123","transaction_status":"settlement"}'
```

#### **API Testing:**

```bash
# Test payment creation
curl -X POST http://localhost:3000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{"orderId":"TEST123","amount":5000,"customerName":"Test User","items":[{"id":"1","name":"Test Product","price":5000,"quantity":1}]}'
```

### **10. ✅ Expected Results**

**✅ Success Indicators:**

- Midtrans popup opens smoothly
- Payment processes without errors
- Correct callbacks to success/error pages
- Database records updated
- Console shows proper logs

**❌ Common Issues:**

- CORS errors in console
- 500 errors on payment creation
- Webhook not receiving notifications
- Invalid credentials errors

---

## 🎉 **Quick Test Commands:**

### Start Testing:

1. **Frontend**: http://localhost:3000
2. **Test Card**: `4811 1111 1111 1114`
3. **CVV**: `123`
4. **Expiry**: `12/25`

Ikuti flow ini dan laporkan jika ada error yang muncul! 🚀
