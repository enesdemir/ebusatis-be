# Kademe 4: WMS - Mal Kabul Test Senaryolari

## Senaryo 4.1: Mal Kabul ile Top Girisi

**On Kosullar:** "ABC Tekstil" tedarikci, "Zumrut Yesili" varyant, "Ana Depo" tanimli
**Aktor:** Depo Sorumlusu

### Adimlar:
1. `POST /inventory/receiving` ile mal kabul olustur:
   ```json
   {
     "supplierId": "<abc-id>",
     "warehouseId": "<ana-depo-id>",
     "note": "PO-2026-0001 siparisi teslimati",
     "lines": [
       {
         "variantId": "<zmr-variant-id>",
         "rolls": [
           { "barcode": "R001", "quantity": 50, "batchCode": "LOT-A1", "costPrice": 22.50 },
           { "barcode": "R002", "quantity": 45, "batchCode": "LOT-A1", "costPrice": 22.50 },
           { "barcode": "R003", "quantity": 52, "batchCode": "LOT-B1", "costPrice": 23.00 }
         ]
       }
     ]
   }
   ```
   -> GoodsReceive olusturuldu (status: COMPLETED)
   -> Nereye bakilir: `receiveNumber: "GR-2026-0001"`, `status: "COMPLETED"`

2. `GET /inventory/rolls` cagir
   -> 3 yeni top gorunmeli
   -> Nereye bakilir: Her topun `status: "IN_STOCK"`, `receivedFrom: "ABC Tekstil"`

3. R001 topunu kontrol et (`GET /inventory/rolls/<r001-id>`)
   -> `initialQuantity: 50`, `currentQuantity: 50`, `reservedQuantity: 0`
   -> `batchCode: "LOT-A1"`, `costPrice: 22.50`
   -> `warehouse: "Ana Depo"`
   -> `transactions[0].type: "PURCHASE"`, `quantityChange: 50`

4. `GET /inventory/receiving` cagir
   -> 1 mal kabul fisi gorunmeli
   -> `lines[0].receivedRollCount: 3`, `totalReceivedQuantity: 147`

### Tenant Izolasyon:
- [ ] Baska tenant'tan `GET /inventory/rolls` -> R001/R002/R003 gorunmuyor
- [ ] Baska tenant kendi mal kabulunu yaptiginda bu tenant'in stogunu etkilemiyor

### Edge Case'ler:
- Ayni barkod ile tekrar giris -> 409 Unique constraint hatasi
- Sifir metrajli top girisi -> Validasyon hatasi (quantity > 0)
- Tedarikci secmeden giris -> Validasyon hatasi (supplierId zorunlu)
- 100+ top tek seferde giris -> Performans testi

---

## Senaryo 4.2: Top Kesim (Cut)

**On Kosullar:** R001 topu mevcut (50m, LOT-A1, IN_STOCK)
**Aktor:** Depo Operatoru

### Adimlar:
1. `POST /inventory/cut` ile kesim yap:
   ```json
   { "rollId": "<r001-id>", "amount": 15, "referenceId": "SO-2026-0001", "note": "Musteri siparisi" }
   ```
   -> Basarili
   -> Nereye bakilir: Response'da `currentQuantity: 35`, `status: "IN_STOCK"`

2. R001'i kontrol et (`GET /inventory/rolls/<r001-id>`)
   -> `currentQuantity: 35`
   -> `transactions` dizisinde yeni kayit: `type: "SALE_CUT"`, `quantityChange: -15`, `previousQuantity: 50`, `newQuantity: 35`

3. Tekrar kesim: 20m daha kes
   -> `currentQuantity: 15`

4. Son kesim: 15m kes (topun tamami)
   -> `currentQuantity: 0`, `status: "SOLD"`
   -> Top artik tamamen tuketildi

5. Bos toptan kesim yapmaya calis: 1m daha kes
   -> 400 "Yetersiz stok. Mevcut: 0, Istenen: 1"

### Edge Case'ler:
- `amount: 0` -> 400 "Kesim miktari pozitif olmali"
- `amount: -5` -> 400 "Kesim miktari pozitif olmali"
- `amount: 51` (stoktan fazla) -> 400 "Yetersiz stok"
- Ondalikli kesim: `amount: 12.75` -> Gecerli (decimal)
- Rezerve miktardan fazla kesim -> `available = current - reserved`, available kontrol edilir

---

## Senaryo 4.3: Fire Kaydi (Waste)

**On Kosullar:** R002 topu mevcut (45m, LOT-A1, IN_STOCK)
**Aktor:** Kalite Kontrol

### Adimlar:
1. `POST /inventory/waste`:
   ```json
   { "rollId": "<r002-id>", "amount": 2.5, "note": "Boya hatasi, 2.5m kullanilmaz" }
   ```
   -> `currentQuantity: 42.5`
   -> `transactions`: `type: "WASTE"`, `quantityChange: -2.5`

2. Topun tamamini fireye ayir: `amount: 42.5`
   -> `currentQuantity: 0`, `status: "WASTE"`

3. Bos toptan fire yapmaya calis
   -> 400 "Fire miktari kalan stoktan fazla olamaz"

### Edge Case'ler:
- Stoktan fazla fire -> 400 hatasi
- `amount: 0` -> Gecerli mi? (sifir fire anlamli mi?)

---

## Senaryo 4.4: Sayim Duzeltme (Adjustment)

**On Kosullar:** R003 topu mevcut (52m, LOT-B1, IN_STOCK)
**Aktor:** Depo Sayim Ekibi

### Adimlar:
1. `POST /inventory/adjust`:
   ```json
   { "rollId": "<r003-id>", "newQuantity": 50.5, "note": "Sayim farki: -1.5m" }
   ```
   -> `currentQuantity: 50.5`
   -> `transactions`: `type: "ADJUSTMENT"`, `quantityChange: -1.5`, `previousQuantity: 52`

2. Yukari duzeltme: `newQuantity: 53`
   -> `quantityChange: +2.5` (pozitif)

3. Sifira duzeltme: `newQuantity: 0`
   -> `status: "CONSUMED"`

4. Sifirdan geri duzeltme: `newQuantity: 10`
   -> `status: "IN_STOCK"` (geri aktif)

### Edge Case'ler:
- `newQuantity: -5` -> 400 "Miktar negatif olamaz"
- Cok buyuk miktar: `newQuantity: 999999` -> Gecerli mi? (is kurali gerekebilir)

---

## Senaryo 4.5: Stok Ozeti

**On Kosullar:** Birden fazla varyant icin toplar girilmis
**Aktor:** Depo Muduru

### Adimlar:
1. `GET /inventory/summary` cagir
   -> Varyant bazli ozet:
   ```json
   [
     { "variantId": "xxx", "rollCount": 3, "totalQuantity": 147.00, "totalReserved": 0 },
     { "variantId": "yyy", "rollCount": 5, "totalQuantity": 230.50, "totalReserved": 20.00 }
   ]
   ```
   -> Nereye bakilir: Toplamlar dogru mu

2. Bir topta kesim yap, summary tekrar kontrol et
   -> `totalQuantity` azalmis olmali
