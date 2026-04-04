# E2E Akis Senaryolari (Cross-Module)

Bu senaryolar birden fazla kademeyi kesen uctan uca is akislarini test eder.

---

## E2E-1: Tam Satis Dongusu (Tanim → Urun → Stok → Siparis → Fatura → Odeme)

**Aktor:** Tum roller
**Kapsam:** Kademe 1-6

### Adimlar:

**1. Tanim Hazirlik (Kademe 1)**
1. Birim "Metre" tanimli oldugundan emin ol
2. Para birimi "TRY" varsayilan oldugundan emin ol
3. Kategori "Fon Perde" tanimli oldugundan emin ol
4. Vergi "KDV %20" tanimli oldugundan emin ol
5. Depo "Ana Depo" tanimli oldugundan emin ol
6. Odeme yontemi "Banka Havalesi" tanimli oldugundan emin ol
7. Teslimat yontemi "Kargo" tanimli oldugundan emin ol
8. Siparis durumlari seed edilmis oldugundan emin ol
   -> Nereye bakilir: `GET /definitions/*` endpoint'leri

**2. Musteri Karti (Kademe 2)**
9. Musteri olustur: "Hilton Otel Grubu", tip: CUSTOMER, kredi limiti: 100000
10. Cari hesap ekle: "Hilton Turizm A.S.", VKN: 1234567890
   -> Nereye bakilir: Partner + Counterparty olusturulmus

**3. Urun Tanimlama (Kademe 3)**
11. Urun olustur: "Premium Velvet", kod: PRM-VLV, kategori: Fon Perde, birim: Metre
12. Varyant ekle: "Bordo", SKU: PRM-VLV-BRD, fiyat: 55 TRY, maliyet: 25 TRY
13. Varyant ekle: "Krem", SKU: PRM-VLV-KRM, fiyat: 50 TRY, maliyet: 22 TRY
   -> Nereye bakilir: Urun + 2 varyant olusturulmus

**4. Stok Girisi (Kademe 4)**
14. Mal kabul olustur: Tedarikci "Ithal Tekstil", Depo "Ana Depo"
    - Bordo: 3 top (R100/50m/LOT-X, R101/48m/LOT-X, R102/52m/LOT-Y)
    - Krem: 2 top (R200/45m/LOT-Z, R201/50m/LOT-Z)
15. Stok kontrolu: 5 top, toplam 245m
   -> Nereye bakilir: `GET /inventory/summary` → 2 varyant, 5 top, 245m

**5. Siparis Olusturma (Kademe 5)**
16. Satis siparisi olustur:
    - Musteri: Hilton Otel Grubu
    - Depo: Ana Depo
    - Odeme: Banka Havalesi
    - Teslimat: Kargo
    - Kalem 1: Bordo 20m × 55 TRY = 1100 TRY
    - Kalem 2: Krem 15m × 50 TRY = 750 TRY
    - Toplam: 1850 TRY
17. Siparis numarasi kontrol: SO-2026-0001
   -> Nereye bakilir: `orderNumber`, `grandTotal: 1850`

**6. Rulo Tahsis (Kademe 4 + 5)**
18. Bordo kalem icin R100'den 20m tahsis et
    -> R100: reservedQuantity 0→20, currentQuantity hala 50
19. Krem kalem icin R200'den 15m tahsis et
    -> R200: reservedQuantity 0→15, currentQuantity hala 45
20. Stok kontrolu: reservedQuantity'ler artti, currentQuantity degismedi
   -> Nereye bakilir: `GET /inventory/rolls/<id>` ile kontrol

**7. Kesim (Kademe 4)**
21. R100'den 20m kes (siparis referansli)
    -> R100: currentQuantity 50→30, reservedQuantity 20→20 (veya service mantigi)
22. R200'den 15m kes
    -> R200: currentQuantity 45→30
23. Stok ozeti kontrolu: totalQuantity azaldi
   -> Nereye bakilir: `GET /inventory/summary`

**8. Faturalama (Kademe 6)**
24. Satis faturasi olustur:
    - Cari: Hilton Turizm A.S.
    - Kalemler: Siparis kalemlerinden
    - Toplam: 1850 TRY, Vade: 30 gun sonra
25. Fatura kontrol: INV-2026-0001, status: DRAFT, paidAmount: 0
   -> Nereye bakilir: Fatura detayi

**9. Odeme (Kademe 6)**
26. Kismi odeme: 1000 TRY banka havalesi, faturaya esle
    -> Fatura: paidAmount: 1000, status: PARTIALLY_PAID
27. Kalan odeme: 850 TRY, faturaya esle
    -> Fatura: paidAmount: 1850, status: PAID
   -> Nereye bakilir: Fatura durumu otomatik guncellendi

**10. Raporlama (Kademe 7)**
28. Stok raporu: Bordo icin toplam miktar azalmis (150→130)
29. Satis performansi: 1 siparis, 1850 TRY ciro
30. Karlilik: Bordo: gelir 1100, maliyet 500, kar 600 (%54.5)
31. Cari bakiye: Hilton bakiyesi: 0 (tamamen odendi)
32. Nakit akis: incoming: 1850 TRY
   -> Nereye bakilir: Tum rapor endpoint'leri

### Toplam Kontrol:
- [ ] 42 seed kayit olusturulmus (onboarding)
- [ ] 1 musteri + 1 cari olusturulmus
- [ ] 1 urun + 2 varyant olusturulmus
- [ ] 5 top giris yapilmis (mal kabul)
- [ ] 1 siparis + 2 kalem olusturulmus
- [ ] 2 top tahsis + 2 kesim yapilmis
- [ ] 1 fatura + 2 odeme olusturulmus
- [ ] Fatura tamamen odenmis (PAID)
- [ ] Tum raporlar tutarli

---

## E2E-2: Multi-Tenant Izolasyon Testi

**Aktor:** SuperAdmin
**Kapsam:** Tum kademeler

### Adimlar:
1. Tenant A olustur ("Alfa Tekstil")
2. Tenant B olustur ("Beta Kumas")
3. Tenant A context'inde:
   - Urun olustur: "Alfa Ipek"
   - Musteri olustur: "Alfa Musteri"
   - Stok girisi yap: R-ALFA-001 (30m)
   - Siparis olustur: SO-2026-0001
4. Tenant B context'inde:
   - Urun olustur: "Beta Kadife"
   - Musteri olustur: "Beta Musteri"
   - Stok girisi yap: R-BETA-001 (40m)
   - Siparis olustur: SO-2026-0001 (AYNI NUMARA - farkli tenant!)

5. Izolasyon Kontrolleri:
   - [ ] Tenant A: `GET /products` -> Sadece "Alfa Ipek" (1 urun)
   - [ ] Tenant B: `GET /products` -> Sadece "Beta Kadife" (1 urun)
   - [ ] Tenant A: `GET /inventory/rolls` -> Sadece R-ALFA-001
   - [ ] Tenant B: `GET /inventory/rolls` -> Sadece R-BETA-001
   - [ ] Tenant A: `GET /partners` -> Sadece "Alfa Musteri"
   - [ ] Tenant B: `GET /partners` -> Sadece "Beta Musteri"
   - [ ] Tenant A: `GET /orders/sales` -> Sadece kendi SO-2026-0001
   - [ ] Her iki tenant'in siparis numarasi "SO-2026-0001" (tenant-scoped)
   - [ ] Tenant A, Tenant B'nin urun/stok/siparis ID'lerine erisemez (404)
   - [ ] SuperAdmin platform modunda: tenant-scoped endpoint'lere erisemez (403)

---

## E2E-3: Fire ve Esik Senaryosu (Threshold)

**Aktor:** Depo Operatoru + Satis Temsilcisi
**Kapsam:** Kademe 4 + 5

### Adimlar:
1. Top girisi: R-FIRE-001 (23m, Bordo)
2. Siparis: 22.5m Bordo istendi
3. R-FIRE-001'den 22.5m tahsis et
   -> Musait: 23 - 0 = 23m >= 22.5m -> Basarili
4. Kesim: 22.5m kes
   -> Kalan: 0.5m
   -> IS KURALI: Kalan < scrap_threshold (1m) ise uyari ver
5. Uyari: "Kalan 0.5m satilamaz niteliktedir"
   - Secenek A: Tum topu sat (23m) -> Musteri 0.5m fazla alir
   - Secenek B: 0.5m'yi fire olarak isaretle
6. Fire sec: `POST /inventory/waste` `{ rollId, amount: 0.5 }`
   -> R-FIRE-001: currentQuantity: 0, status: WASTE

### Kontroller:
- [ ] 22.5m kesim basarili
- [ ] 0.5m kalan dogru hesaplandi
- [ ] Fire sonrasi top tamamen tuketildi (WASTE status)
- [ ] Stok raporunda fire miktari gorunuyor

---

## E2E-4: Coklu Doviz Siparis Akisi

**Aktor:** Satis Temsilcisi + Muhasebe
**Kapsam:** Kademe 1 + 5 + 6

### Adimlar:
1. USD ile siparis olustur: 100m × $12.00 = $1200, kur: 34.50
2. TRY karsiligi: 1200 × 34.50 = 41400 TRY
3. Fatura olustur: USD, exchangeRate: 34.50
4. Odeme al: USD cinsinden $1200, kur: 35.00 (kur degismis)
5. Raporlama: Kur farki hesabi -> (35.00 - 34.50) × 1200 = 600 TRY kur farki kari

### Kontroller:
- [ ] Siparis ve fatura farkli kurlarla saklanabiliyor
- [ ] Her islem kendi kuru ile kaydediliyor
- [ ] Kur farki hesaplanabiliyor (ileride rapor)

---

## E2E-5: Belge Grafigi (Document Graph)

**Kapsam:** Kademe 5 + 6

### Beklenen Zincir:
```
SalesOrder (SO-2026-0001)
  └── Shipment (SH-2026-0001) [CREATED_FROM]
      └── Invoice (INV-2026-0001) [CREATED_FROM]
          ├── Payment (PAY-2026-0001) [matchedInvoices]
          └── Payment (PAY-2026-0002) [matchedInvoices]
```

### Kontroller:
- [ ] `DocumentLink` kayitlari dogru olusturuluyor
- [ ] Bir belgenin detayinda "Bagli Belgeler" agaci goruntuleniyor
- [ ] Baglanti tipleri dogru: CREATED_FROM, PARTIAL, RETURN

---

## E2E-6: Frontend Tam Kullanici Akisi

**Aktor:** SuperAdmin → Tenant kullanicisi
**Kapsam:** Tum frontend sayfalari

### Adimlar:
1. `/login` -> admin@ebusatis.com / admin123 ile giris
   -> Workspace secim sayfasina yonlendirme

2. `/workspace-selection` -> "Test Firma" tenant'ini sec
   -> Dashboard'a yonlendirme, sidebar tenant moduna gecti

3. `/settings/definitions/units` -> Birimler listesi
   -> 8 varsayilan birim gorunuyor, PageHelp butonu var

4. `/partners` -> Partner listesi (bos)
   -> EmptyState goruntuleniyor, egitici aciklama + CTA butonu

5. `/pim/products` -> Urun listesi (bos)
   -> EmptyState + "Ilk Urunu Olustur" butonu

6. `/wms/inventory` -> Stok listesi (bos)
   -> EmptyState + "Mal Kabul Yap" butonu

7. `/orders/sales` -> Siparis listesi (bos)
   -> EmptyState + "Ilk Siparisi Olustur" butonu

8. `/finance/invoices` -> Fatura listesi (bos)
   -> EmptyState + "Ilk Faturayi Olustur" butonu

9. `/reports` -> Rapor index sayfasi
   -> 9 rapor karti 3x3 grid'de gorunuyor

### Kontroller:
- [ ] Tum sayfalar yukleniyor (500 hatasi yok)
- [ ] i18n cevirileri dogru yuklenmis (t() cagrilari calisiyor)
- [ ] EmptyState bileşenleri egitici icerikle dolu
- [ ] PageHelp butonlari calisiyor
- [ ] Sidebar menu ogeleri dogru gorunuyor
- [ ] Tenant context header'da gorunuyor
- [ ] Logout calisiyor ve login'e yonlendiriyor
