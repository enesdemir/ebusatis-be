# Stok ve Envanter Mimarisi: "Dimensional Inventory" (Boyutlu Stok)

**Konu:** Tekstil sektörüne özel "Top Kumaş" ve "Metraj" takibi.
**Sorun:** Standart e-ticaret/ERP sistemleri stokları "Adet" olarak tutar. (Örn: 5 adet iPhone). Ancak tekstilde stok "500 Metre"dir ama bu 500 metre tek parça değildir (10 top x 50m olabilir, ya da 50 parça x 10m olabilir). Hangi topun kesildiğinin bilinmesi (Lot/Batch takibi) gerekir.

## 1. Veri Modeli (ERD)

### 1.1. Products (Ürünler)
Genel ürün tanımı.
- `id`: UUID
- `name`: "Kadife Perde"
- `code`: "KDF-001"
- `baseUnit`: "Meter" (Ana birim)

### 1.2. ProductVariants (Varyantlar)
Renk/Desen kırılımı. SKUd'dur.
- `id`: UUID
- `productId`: FK
- `name`: "Kırmızı"
- `sku`: "KDF-001-RED"
- `price`: 15.00 USD

### 1.3. InventoryItems (Rolls / Toplar) - **CORE ENTITY**
Spesifik bir fiziksel varlık. Barkodlu her bir top kumaş.
- `id`: UUID
- `variantId`: FK
- `barcode`: "12345678" (Tekil Barkod)
- `batchCode`: "LOT-2024-01" (Aynı kazanda boyananlar)
- `initialQuantity`: 50.00 (İlk metraj)
- `currentQuantity`: 32.50 (Kalan metraj)
- `warehouseLocation`: "Raf A-12"
- `status`: `AVAILABLE` | `RESERVED` | `SOLD` | `WASTE` (Fire)

### 1.4. InventoryTransactions (Stok Hareketleri)
Bir top üzerinde yapılan her işlem (Giriş, Kesim, Fire, İade).
- `id`: UUID
- `itemId`: FK (Hangi top?)
- `type`: `PURCHASE` | `SALES_ORDER_CUT` | `WASTE` | `RETURN` | `ADJUSTMENT`
- `quantity`: -10.50 (Düşen miktar)
- `referenceId`: FK (Sipariş No vb.)
- `previousQuantity`: 43.00
- `newQuantity`: 32.50
- `createdBy`: User

---

## 2. Kritik İş Mantığı (Business Logic)

### 2.1. Sipariş Karşılama (Allocation Strategy)
Sipariş: "20m Kırmızı Kadife".
Sistem ne yapmalı?
1.  **Tam Eşleşme:** Tam 20m'lik bir parça var mı? Varsa onu öner.
2.  **FIFO (First In First Out):** En eski topu getir.
3.  **Optimizasyon (Best Fit):** 20m için 22m'lik topu mu kesmeli, 50m'lik topu mu? (Genelde en az fire verecek olan seçilir).

### 2.2. Eşik Kontrolü (Threshold Check)
Senaryo: 50m'lik toptan 48m sipariş geldi.
- Kalan: 2m.
- Kural: "Eğer kalan parça 5m'den az ise, müşteriye (veya satış temsilcisine) sor: 'Kalan 2m parçayı da almak ister misiniz (promosyonlu)?' veya 'Bunu fireye ayır'."

### 2.3. Rezerve (Reservation)
Sipariş onaylandığında fiziksel kesim hemen yapılmaz. Top "Rezerve" statüsüne geçer veya "ReservedQuantity" artar.

---

## 3. Servis Metotları (InventoryService)

*   `createRoll(variantId, quantity, batch)`: Yeni top girişi.
*   `cutRoll(rollId, amount, reason)`: Kesim işlemi. Transaction kaydeder, Roll miktarını düşer.
*   `findBestMatchRolls(variantId, requestedAmount)`: En uygun topları listeleyen algoritma.
*   `adjustStock(rollId, newAmount)`: Sayım farkı düzeltme.

---

## 4. API Endpoints

*   `POST /inventory/rolls`: Top girişi (Barkod basımı tetikler).
*   `GET /inventory/rolls?variantId=...`: Varyantın topları.
*   `POST /inventory/cut`: Kesim emri.
*   `GET /inventory/movements/:rollId`: Topun tarihçesi (Traceability).
