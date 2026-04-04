# Kademe 6: Finans Test Senaryolari

## Senaryo 6.1: Satis Faturasi Olusturma

**On Kosullar:** Siparis SO-2026-0001 mevcut (ABC Tekstil, 1440 TRY)
**Aktor:** Muhasebe

### Adimlar:
1. `POST /finance/invoices` ile fatura olustur:
   ```json
   {
     "type": "SALES",
     "partnerId": "<abc-id>",
     "counterpartyId": "<abc-ithalat-id>",
     "currencyId": "<try-id>",
     "dueDate": "2026-05-04",
     "sourceOrderId": "<so-id>",
     "lines": [
       { "description": "Zumrut Yesili Kadife 20m", "variantId": "<zmr-id>", "quantity": 20, "unitPrice": 45, "discount": 10 },
       { "description": "Antrasit Gri Kadife 15m", "variantId": "<ant-id>", "quantity": 15, "unitPrice": 42, "discount": 0 }
     ]
   }
   ```
   -> Fatura olusturuldu
   -> Nereye bakilir:
     - `invoiceNumber: "INV-2026-0001"`
     - `status: "DRAFT"`
     - `subtotal: 1440.00`
     - `grandTotal: 1440.00`
     - `paidAmount: 0`
     - `dueDate: "2026-05-04"`

2. `GET /finance/invoices/:id` ile detay cek
   -> Partner, counterparty, lines populate edilmis
   -> Nereye bakilir: `lines[0].lineTotal === 810.00` (20*45*0.9)

3. `GET /finance/invoices?type=SALES` ile filtrele
   -> Sadece satis faturalari donmeli

4. `GET /finance/invoices?status=DRAFT` ile filtrele
   -> Taslak faturalar donmeli

### Edge Case'ler:
- Ayni siparisten ikinci fatura (kismi faturalama) -> Gecerli
- `dueDate` gecmis tarih -> Gecerli (geriye donuk duzenleme)
- Sifir tutarli fatura -> Gecerli mi? (iade faturasi olabilir)

---

## Senaryo 6.2: Odeme ve Fatura Eslestirme - KRITIK IS MANTIGI

**On Kosullar:** INV-2026-0001 faturasi mevcut (1440 TRY, DRAFT, paidAmount: 0)
**Aktor:** Muhasebe

### Adimlar:
1. Kismi odeme kaydet: `POST /finance/payments`:
   ```json
   {
     "direction": "INCOMING",
     "partnerId": "<abc-id>",
     "counterpartyId": "<abc-ithalat-id>",
     "amount": 500,
     "currencyId": "<try-id>",
     "methodId": "<havale-id>",
     "reference": "DKT-20260405-001",
     "matchedInvoices": [
       { "invoiceId": "<inv-id>", "amount": 500 }
     ]
   }
   ```
   -> Odeme olusturuldu: `paymentNumber: "PAY-2026-0001"`
   -> Nereye bakilir:
     - `PaymentInvoiceMatch` kaydi: `matchedAmount: 500`
     - Faturanin `paidAmount: 500` (onceki 0'dan artmis)
     - Faturanin `status: "PARTIALLY_PAID"` (500 < 1440)

2. Fatura durumunu kontrol et: `GET /finance/invoices/<inv-id>`
   -> `paidAmount: 500`, `status: "PARTIALLY_PAID"`
   -> Kalan: `grandTotal - paidAmount = 940`

3. Ikinci odeme: Kalan tutari ode (940 TRY)
   ```json
   {
     "direction": "INCOMING",
     "partnerId": "<abc-id>",
     "amount": 940,
     "matchedInvoices": [
       { "invoiceId": "<inv-id>", "amount": 940 }
     ]
   }
   ```
   -> `paymentNumber: "PAY-2026-0002"`
   -> Faturanin `paidAmount: 1440`, `status: "PAID"` (tam odendi)

4. Fatura durumunu kontrol et
   -> `status: "PAID"`, `paidAmount === grandTotal`

### Kritik Kontroller:
- [ ] Kismi odeme `paidAmount` dogru artiyor
- [ ] `paidAmount >= grandTotal` oldugunda status otomatik `PAID` oluyor
- [ ] `0 < paidAmount < grandTotal` oldugunda status `PARTIALLY_PAID`
- [ ] Bir odeme birden fazla faturaya eslestirilabiliyor
- [ ] Bir fatura birden fazla odemeden karsilanabiliyor

### Edge Case'ler:
- Fazla odeme: `matchedAmount > remaining` -> Is kurali: kabul mu, uyari mi?
- Eslestirmesiz odeme (`matchedInvoices: []`) -> Gecerli (avans odeme)
- Fatura silindikten sonra odeme eslestirme -> 404
- Ayni faturaya ayni odemeyi iki kez eslestirme -> Engellenmeli mi?

---

## Senaryo 6.3: Cari Hesap Ekstresi (Ledger) - KRITIK RAPOR

**On Kosullar:** ABC Ithalat A.S. carisi: 2 fatura (1440 + 850 TRY), 1 odeme (500 TRY)
**Aktor:** Muhasebe

### Adimlar:
1. `GET /finance/payments/ledger/<counterpartyId>` cagir
   -> Response:
   ```json
   {
     "counterpartyId": "xxx",
     "movements": [
       { "date": "2026-04-04", "type": "INVOICE", "ref": "INV-2026-0001", "debit": 1440, "credit": 0, "balance": 1440 },
       { "date": "2026-04-04", "type": "INVOICE", "ref": "INV-2026-0002", "debit": 850, "credit": 0, "balance": 2290 },
       { "date": "2026-04-05", "type": "PAYMENT", "ref": "PAY-2026-0001", "debit": 0, "credit": 500, "balance": 1790 }
     ],
     "closingBalance": 1790
   }
   ```

2. Tarih filtresi ile cagir: `?from=2026-04-04&to=2026-04-04`
   -> Sadece o gunku hareketler donmeli

### Kritik Kontroller:
- [ ] Hareketler tarih sirasina gore (ASC)
- [ ] Satis faturasi -> debit (borc, musteri bize borclu)
- [ ] Gelen odeme -> credit (alacak, musteri odedi)
- [ ] Calisan bakiye dogru hesaplaniyor (her satirin balance'i)
- [ ] `closingBalance` son satiridaki balance ile esit

### Edge Case'ler:
- Hic hareketi olmayan cari -> `movements: []`, `closingBalance: 0`
- Alis faturasi (PURCHASE) -> debit/credit yon degisir
- Giden odeme (OUTGOING) -> debit/credit yon degisir

---

## Senaryo 6.4: Fatura Listesi (Frontend)

**On Kosullar:** 5 fatura mevcut (farkli durumlarda)
**Aktor:** Muhasebe (Frontend)

### Adimlar:
1. `/finance/invoices` sayfasina git
   -> 5 fatura: fatura no, tur, firma, tarih, tutar, odenen/kalan, durum
   -> Nereye bakilir:
     - PAID -> yesil badge
     - PARTIALLY_PAID -> sari badge
     - OVERDUE -> kirmizi badge
     - Kalan kolonu: `grandTotal - paidAmount`, kirmizi renk

2. Tur filtresi: "Satis Faturasi" tikla
   -> Sadece SALES turundekiler gorunmeli

3. Bos durum: Hic fatura yokken
   -> EmptyState + "Ilk Faturayi Olustur" butonu
