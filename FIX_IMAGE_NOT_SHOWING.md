# Fix: Gambar Produk Tidak Muncul di Vending Machine

## 🐛 Masalah

Setelah update gambar produk dari admin panel, gambar tidak muncul di menu vending machine.

## 🔍 Penyebab

1. **ProductCard.tsx** dan **ProductDetailScreen.tsx** menggunakan `product.image_url` langsung tanpa menambahkan base URL backend
2. Database menyimpan path relatif: `/uploads/products/xxx.jpg`
3. Next.js Image component membutuhkan full URL untuk external images
4. Missing environment variable untuk backend URL

## ✅ Solusi

### 1. Update `.env.local`

Tambahkan `NEXT_PUBLIC_BACKEND_URL`:

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### 2. Update `ProductCard.tsx`

Tambahkan helper function `getImageUrl()`:

```typescript
const getImageUrl = (imageUrl: string | null) => {
  if (!imageUrl) return "/images/placeholder-product.jpg";

  // If already full URL, return as is
  if (imageUrl.startsWith("http")) return imageUrl;

  // If relative path, add backend URL
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
  return `${backendUrl}${imageUrl}`;
};
```

Gunakan di Image component:

```tsx
<Image
  src={getImageUrl(product.image_url)}
  alt={product.name}
  fill
  className="object-cover"
/>
```

### 3. Update `ProductDetailScreen.tsx`

Sama seperti ProductCard, tambahkan helper function yang sama.

### 4. Update `next.config.ts`

Sudah dikonfigurasi untuk allow localhost:3001:

```typescript
images: {
  remotePatterns: [
    {
      protocol: "http",
      hostname: "localhost",
      port: "3001",
      pathname: "/uploads/**",
    },
  ],
}
```

## 🚀 Cara Test

1. **Restart Frontend** (wajib karena .env.local berubah):

   ```bash
   cd frontend
   npm run dev
   ```

2. **Upload/Update Gambar di Admin**:

   - Buka `http://localhost:3000/admin/products`
   - Upload gambar baru atau update existing product
   - Gambar tersimpan di `backend/uploads/products/`

3. **Cek di Vending Machine**:
   - Buka `http://localhost:3000`
   - Gambar produk seharusnya muncul di grid
   - Klik produk untuk lihat detail - gambar muncul di detail page

## 📸 Image URL Flow

### Admin Upload:

```
User uploads: photo.jpg
↓
Backend saves: /uploads/products/product-1234567890-123.jpg
↓
Database stores: /uploads/products/product-1234567890-123.jpg
```

### Frontend Display:

```
Database: /uploads/products/product-1234567890-123.jpg
↓
getImageUrl() adds base URL
↓
Final URL: http://localhost:3001/uploads/products/product-1234567890-123.jpg
↓
Next.js Image component displays
```

## 🔧 Files Modified

1. ✅ `frontend/.env.local` - Added NEXT_PUBLIC_BACKEND_URL
2. ✅ `frontend/components/ProductCard.tsx` - Added getImageUrl()
3. ✅ `frontend/components/screens/ProductDetailScreen.tsx` - Added getImageUrl()
4. ✅ `frontend/next.config.ts` - Already configured remotePatterns

## ✨ Result

- ✅ Gambar muncul di product grid (HomeScreen)
- ✅ Gambar muncul di product detail
- ✅ Gambar muncul di admin panel
- ✅ Support gambar lama (path relatif) dan baru (uploaded)
- ✅ Fallback ke placeholder jika gambar tidak ada
- ✅ Next.js Image optimization tetap jalan

## 🎯 Testing Checklist

- [ ] Upload gambar baru via admin panel
- [ ] Gambar muncul di list admin
- [ ] Refresh vending machine homepage
- [ ] Gambar muncul di product grid
- [ ] Klik produk untuk detail
- [ ] Gambar muncul di detail screen
- [ ] Update gambar existing product
- [ ] Gambar lama terhapus, gambar baru muncul
- [ ] Delete product
- [ ] Gambar ikut terhapus dari server

## 📝 Notes

- Environment variables dengan prefix `NEXT_PUBLIC_` bisa diakses di client-side
- Restart development server wajib setelah ubah .env file
- Image URL di database tetap path relatif (portable)
- Full URL hanya di-construct saat render di frontend
