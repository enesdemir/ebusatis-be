# Kademe 7: Raporlama Test Senaryolari

## Senaryo 7.1: Stok Durum Raporu

**On Kosullar:** 3 varyant, toplam 10 top, cesitli durumlar
**Aktor:** Depo Muduru

### Adimlar:
1. `GET /reports/inventory/stock-status` cagir
   -> Varyant bazli ozet donmeli:
   ```json
   [
     { "variantId": "x", "variantName": "Zumrut Yesili", "sku": "PRM-VLV-ZMR", "productName": "Premium Velvet", "rollCount": 3, "totalQuantity": 120.50, "totalReserved": 20.00, "availableQuantity": 100.50 },
     { "variantId": "y", "variantName": "Antrasit Gri", ... }
   ]
   ```
   -> Nereye bakilir: `availableQuantity = totalQuantity - totalReserved`

2. Depo filtresi ile cagir: `?warehouseId=<ana-depo-id>`
   -> Sadece o depodaki stok donmeli

3. Kesim yap, raporu tekrar cek
   -> `totalQuantity` azalmis olmali

### Kritik Kontroller:
- [ ] Sadece IN_STOCK ve RESERVED durumdaki toplar dahil
- [ ] SOLD, CONSUMED, WASTE, LOST toplar haric
- [ ] Soft-deleted toplar haric (deletedAt != null)
- [ ] Toplamlar decimal hassasiyetle dogru

---

## Senaryo 7.2: Stok Hareket Raporu

**On Kosullar:** Cesitli islemler yapilmis (giris, kesim, fire, duzeltme)
**Aktor:** Depo Muduru

### Adimlar:
1. `GET /reports/inventory/movements?from=2026-04-01&to=2026-04-30` cagir
   -> Islem turune gore ozet:
   ```json
   [
     { "type": "PURCHASE", "transactionCount": 10, "totalQuantity": 500.00 },
     { "type": "SALE_CUT", "transactionCount": 5, "totalQuantity": 120.00 },
     { "type": "WASTE", "transactionCount": 2, "totalQuantity": 5.50 },
     { "type": "ADJUSTMENT", "transactionCount": 1, "totalQuantity": 2.00 }
   ]
   ```
   -> Nereye bakilir: Her turun toplam islem sayisi ve miktari

2. Varyant filtresi ile cagir: `?variantId=<zmr-id>`
   -> Sadece o varyantin hareketleri

---

## Senaryo 7.3: Yaslandirma Raporu

**On Kosullar:** Bazi toplar 90+ gun once giris yapmis
**Aktor:** Depo Muduru

### Adimlar:
1. `GET /reports/inventory/aging?days=90` cagir
   -> 90 gunden fazla depoda kalan toplar:
   ```json
   [
     { "barcode": "R-OLD-001", "variantName": "...", "currentQuantity": 30, "receivedAt": "2026-01-01", "daysInStock": 93 }
   ]
   ```
   -> Nereye bakilir: `daysInStock >= 90`

2. `?days=30` ile cagir -> Daha fazla sonuc donmeli
3. `?days=365` ile cagir -> Belki hic sonuc yok (1 yil)

---

## Senaryo 7.4: Satis Performansi

**On Kosullar:** 10 siparis mevcut, cesitli musteriler
**Aktor:** Satis Muduru

### Adimlar:
1. `GET /reports/sales/performance?from=2026-04-01&to=2026-04-30` cagir
   -> Response:
   ```json
   {
     "summary": { "orderCount": 10, "totalRevenue": 45000.00, "avgOrderValue": 4500.00 },
     "topCustomers": [
       { "partnerId": "x", "partnerName": "ABC Tekstil", "orderCount": 4, "totalRevenue": 20000.00 },
       ...
     ]
   }
   ```
   -> Nereye bakilir: En iyi 10 musteri sirasi (ciro DESC)

---

## Senaryo 7.5: Karlilik Raporu - KRITIK

**On Kosullar:** Varyantlara maliyet fiyati (costPrice) girilmis, siparisler mevcut
**Aktor:** Genel Mudur

### Adimlar:
1. `GET /reports/sales/profitability?from=2026-04-01&to=2026-04-30` cagir
   -> Varyant bazli karlilik:
   ```json
   [
     { "variantId": "x", "variantName": "Zumrut Yesili", "sku": "PRM-VLV-ZMR", "revenue": 9000.00, "cost": 4500.00, "profit": 4500.00, "profitMargin": 50.00 },
     { "variantId": "y", "variantName": "Antrasit Gri", "revenue": 6300.00, "cost": 3780.00, "profit": 2520.00, "profitMargin": 40.00 }
   ]
   ```
   -> Nereye bakilir:
     - `profit = revenue - cost`
     - `profitMargin = (profit / revenue) * 100`
     - `cost = sum(requestedQuantity * variant.costPrice)`

### Kritik Kontroller:
- [ ] costPrice null olan varyantlarda cost = 0 (NaN olmamali)
- [ ] profitMargin: revenue 0 ise 0 donmeli (0'a bolme hatasi yok)
- [ ] Siralama: profit DESC

---

## Senaryo 7.6: Cari Bakiye Raporu

**On Kosullar:** Birden fazla musteriye fatura kesilmis, kismi odemeler yapilmis
**Aktor:** Muhasebe

### Adimlar:
1. `GET /reports/finance/balances` cagir
   -> Tum musterilerin bakiyeleri:
   ```json
   [
     { "partnerId": "x", "partnerName": "ABC Tekstil", "totalInvoiced": 2290, "totalPaid": 500, "balance": 1790, "invoiceCount": 2 },
     { "partnerId": "y", "partnerName": "XYZ Kumas", "totalInvoiced": 1500, "totalPaid": 1500, "balance": 0, "invoiceCount": 1 }
   ]
   ```
   -> Nereye bakilir: `balance = totalInvoiced - totalPaid`, siralama balance DESC

---

## Senaryo 7.7: Vade Analizi

**On Kosullar:** Bazi faturalarin vadesi gecmis
**Aktor:** Muhasebe

### Adimlar:
1. `GET /reports/finance/aging` cagir
   -> Vadesi gecmis faturalar kusaklara ayrilmis:
   ```json
   [
     { "partnerId": "x", "invoiceNumber": "INV-2026-0001", "remaining": 940, "dueDate": "2026-03-01", "overdueDays": 34, "agingBucket": "OVERDUE_60" },
     ...
   ]
   ```
   -> Nereye bakilir: Aging buckets dogru hesaplanmis (0-30, 31-60, 61-90, 90+)

---

## Senaryo 7.8: Nakit Akis

**On Kosullar:** Cesitli tahsilat ve odemeler yapilmis
**Aktor:** Finans Muduru

### Adimlar:
1. `GET /reports/finance/cash-flow?from=2026-04-01&to=2026-04-30` cagir
   -> Response:
   ```json
   { "incoming": 15000.00, "outgoing": 8000.00, "netCashFlow": 7000.00 }
   ```
   -> Nereye bakilir: `netCashFlow = incoming - outgoing`

2. Tarih filtresi olmadan cagir -> Tum zamanlarin toplami

---

## Senaryo 7.9: Rapor Ana Sayfasi (Frontend)

**Aktor:** Yonetici (Frontend)

### Adimlar:
1. `/reports` sayfasina git
   -> 9 rapor karti 3x3 grid'de goruntuleniyor
   -> Nereye bakilir: 3 grup (Stok, Satis, Finans), her grupta 3 kart

2. Her kartin baslik, aciklama ve ikonu var
   -> Nereye bakilir: i18n cevirileri dogru yuklenmis mi

3. "Stok Durum Raporu" kartina tikla
   -> `/reports/inventory/stock-status` sayfasina yonlendirme
