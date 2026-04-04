# Kademe 5: Siparis Motoru Test Senaryolari

## Senaryo 5.1: Satis Siparisi Olusturma

**On Kosullar:** Musteri "ABC Tekstil", varyant "Zumrut Yesili" (fiyat: 45 TRY), durum "Taslak" tanimli, KDV %20
**Aktor:** Satis Temsilcisi

### Adimlar:
1. `POST /orders/sales` ile siparis olustur:
   ```json
   {
     "partnerId": "<abc-id>",
     "warehouseId": "<ana-depo-id>",
     "currencyId": "<try-id>",
     "statusId": "<taslak-id>",
     "paymentMethodId": "<vadeli30-id>",
     "deliveryMethodId": "<kargo-id>",
     "note": "Acil teslimat isteniyor",
     "lines": [
       { "variantId": "<zmr-id>", "requestedQuantity": 20, "unitPrice": 45, "discount": 10, "taxRateId": "<kdv20-id>" },
       { "variantId": "<ant-id>", "requestedQuantity": 15, "unitPrice": 42, "discount": 0 }
     ]
   }
   ```
   -> Siparis olusturuldu
   -> Nereye bakilir:
     - `orderNumber: "SO-2026-0001"` (tenant-scoped auto-increment)
     - `lines[0].lineTotal: 20 * 45 * 0.90 = 810.00` (%10 indirim)
     - `lines[1].lineTotal: 15 * 42 = 630.00`
     - `totalAmount: 1440.00`

2. `GET /orders/sales/:id` ile detay cek
   -> Partner, currency, status, lines, variants populate edilmis
   -> Nereye bakilir: `lines[0].variant.name === "Zumrut Yesili"`

3. `GET /orders/sales` ile liste cek
   -> 1 siparis donmeli, pagination meta ile

4. Siparis durumunu guncelle: `PATCH /orders/sales/:id` `{ "statusId": "<onaylandi-id>" }`
   -> Durum "Onaylandi" oldu
   -> Nereye bakilir: `status.code === "confirmed"`

### Edge Case'ler:
- `requestedQuantity: 0` -> Gecerli mi?
- `unitPrice: 0` -> Ucretsiz satir (numune?)
- `discount: 100` -> %100 indirim (ucretsiz)
- `discount: 150` -> %150 indirim gecerli mi? (negatif tutar)
- Partner'in `creditLimit` kontrolu -> Ileride: siparis aninda bakiye uyarisi

---

## Senaryo 5.2: Rulo Tahsis (Allocation) - KRITIK IS MANTIGI

**On Kosullar:** SO-2026-0001 siparisi (20m Zumrut Yesili), R001 (35m mevcut, 0 rezerve)
**Aktor:** Depo Operatoru

### Adimlar:
1. `POST /orders/sales/lines/<line1-id>/allocate`:
   ```json
   { "rollId": "<r001-id>", "quantity": 20 }
   ```
   -> Tahsis basarili
   -> Nereye bakilir:
     - `OrderRollAllocation` olusturuldu, `status: "RESERVED"`, `allocatedQuantity: 20`
     - R001'in `reservedQuantity: 20` (onceki 0'dan artmis)
     - R001'in `currentQuantity: 35` (DEGISMEDI - sadece reserve artti)

2. R001'i kontrol et (`GET /inventory/rolls/<r001-id>`)
   -> `currentQuantity: 35`, `reservedQuantity: 20`
   -> Kullanilabilir miktar: 35 - 20 = 15m

3. Baska bir siparise R001'den 20m daha tahsis etmeye calis
   -> 400 "Yetersiz stok. Musait: 15, Istenen: 20"
   -> Nereye bakilir: available = currentQuantity - reservedQuantity

4. 15m daha tahsis et (kalan musait miktarin tamami)
   -> Basarili, `reservedQuantity: 35`
   -> Artik R001'de musait miktar: 0

5. 1m daha tahsis etmeye calis
   -> 400 "Yetersiz stok. Musait: 0, Istenen: 1"

### Kritik Kontroller:
- [ ] Tahsis `currentQuantity`'yi DUSURMUYOR (sadece `reservedQuantity` artar)
- [ ] `currentQuantity` sadece kesim (cutRoll) yapildiginda duser
- [ ] Musait miktar = `currentQuantity - reservedQuantity` formulu dogru
- [ ] Birden fazla siparisten ayni topa tahsis yapilabilir (musait oldugu surece)

### Edge Case'ler:
- Ayni siparis satirina ayni toptan iki kez tahsis -> Gecerli mi? (ayri allocation kayitlari)
- Silinmis topa tahsis -> 404
- Baska tenant'in topuna tahsis -> 404 (filter engeller)
- `quantity: 0` -> Validasyon hatasi
- Ondalikli tahsis: `quantity: 12.75` -> Gecerli

---

## Senaryo 5.3: Satinalma Siparisi

**On Kosullar:** "ABC Tekstil" tedarikci olarak tanimli
**Aktor:** Satin Alma Sorumlusu

### Adimlar:
1. `POST /orders/purchase` ile siparis olustur:
   ```json
   {
     "supplierId": "<abc-id>",
     "currencyId": "<usd-id>",
     "exchangeRate": 34.50,
     "expectedDeliveryDate": "2026-05-01",
     "containerInfo": { "containerNo": "CONT-123", "vessel": "MSC Maria", "customsRef": "GTD-2026-001" },
     "lines": [
       { "variantId": "<zmr-id>", "quantity": 500, "unitPrice": 8.50 }
     ]
   }
   ```
   -> `orderNumber: "PO-2026-0001"`
   -> `totalAmount: 4250.00` (USD)
   -> `containerInfo` JSON olarak saklanmali

2. `GET /orders/purchase/:id` ile detay cek
   -> Tum alanlar populate edilmis
   -> `containerInfo.customsRef === "GTD-2026-001"` (Gumruk Beyannamesi)

### Edge Case'ler:
- `containerInfo` olmadan olusturma -> Gecerli (nullable)
- Ayni supplier'a birden fazla PO -> Farkli numaralar (PO-0001, PO-0002)

---

## Senaryo 5.4: Siparis Listesi (Frontend)

**On Kosullar:** 3 siparis mevcut (farkli durumlarda)
**Aktor:** Satis Temsilcisi (Frontend)

### Adimlar:
1. `/orders/sales` sayfasina git
   -> 3 siparis listelenmeli: siparis no, musteri, tarih, durum badge, tutar
   -> Nereye bakilir: Durum badge'leri renk kodlu (Taslak=gri, Onay=mavi, Hazirlik=sari)

2. Arama kutusuna "SO-2026" yaz
   -> Tum siparisler filtrelenmeli (hepsi bu prefix'le basliyor)

3. Siparis satirina tikla
   -> Siparis detay sayfasina yonlendirme
   -> Nereye bakilir: URL degisimi

4. Bos durum: Hic siparis yokken
   -> EmptyState goruntuleniyor: "Henuz siparis yok" + "Ilk Siparisi Olustur" butonu
