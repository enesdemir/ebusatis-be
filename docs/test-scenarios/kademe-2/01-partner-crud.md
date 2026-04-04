# Kademe 2: Is Ortaklari Test Senaryolari

## Senaryo 2.1: Partner CRUD

**On Kosullar:** Tenant aktif, TRY para birimi mevcut
**Aktor:** Satis Temsilcisi

### Adimlar:
1. `POST /partners` ile musteri olustur:
   ```json
   { "name": "ABC Tekstil", "types": ["CUSTOMER"], "email": "info@abc.com", "phone": "+905551234567", "creditLimit": 50000 }
   ```
   -> Partner olusturuldu
   -> Nereye bakilir: `id`, `types: ["CUSTOMER"]`, `riskScore: "LOW"` (varsayilan)

2. Ayni partner'i tedarikci olarak da isaretle:
   `PATCH /partners/:id` `{ "types": ["CUSTOMER", "SUPPLIER"] }`
   -> Artik hem musteri hem tedarikci
   -> Nereye bakilir: `types` dizisi 2 eleman

3. `GET /partners?type=CUSTOMER` cagir
   -> ABC Tekstil listede olmali

4. `GET /partners?type=SUPPLIER` cagir
   -> ABC Tekstil bu listede de olmali (coklu tip)

5. `GET /partners?search=abc` cagir
   -> ABC Tekstil bulunmali (isim aramassi)

6. `DELETE /partners/:id`
   -> 204, soft delete
   -> Nereye bakilir: Tekrar GET'te listede yok

### Edge Case'ler:
- `types: []` (bos dizi) -> Validasyon hatasi olmali mi?
- `creditLimit: -1000` -> Negatif olamamali
- Cok uzun isim (1000+ karakter) -> Max length kontrolu

---

## Senaryo 2.2: Cari Hesap (Counterparty) Yonetimi

**On Kosullar:** "ABC Tekstil" partner'i mevcut
**Aktor:** Muhasebe

### Adimlar:
1. `POST /partners/:id/counterparties` ile cari olustur:
   ```json
   { "legalName": "ABC Ithalat A.S.", "taxId": "1234567890", "taxOffice": "Kadikoy VD", "type": "COMPANY", "isDefault": true }
   ```
   -> Cari olusturuldu
   -> Nereye bakilir: `partner.id` ile baglantili, `isDefault: true`

2. Ikinci cari ekle: "ABC Perakende Ltd."
   ```json
   { "legalName": "ABC Perakende Ltd.", "taxId": "9876543210", "type": "COMPANY" }
   ```
   -> `isDefault: false` olmali (ilk cari varsayilan)

3. `GET /partners/:id/counterparties` cagir
   -> 2 cari donmeli
   -> Nereye bakilir: Her ikisinin `partner` FK'si ayni

4. Farkli tenant'tan ayni endpoint'i cagir
   -> 404 veya bos dizi (partner bulunamaz)
   -> Nereye bakilir: Tenant izolasyonu

---

## Senaryo 2.3: CRM Etkilesim Logu

**On Kosullar:** "ABC Tekstil" partner'i mevcut, kullanici giris yapmis
**Aktor:** Satis Temsilcisi

### Adimlar:
1. `POST /partners/:id/interactions` ile etkilesim kaydet:
   ```json
   { "type": "CALL", "summary": "Yeni sezon fiyatlari gorusuldu", "contactPerson": "Ahmet Bey", "nextActionDate": "2026-04-10", "nextActionNote": "Numune gonderilecek" }
   ```
   -> Etkilesim olusturuldu, `createdBy` login olan kullanici
   -> Nereye bakilir: `createdBy.email` dogru mu

2. Toplanti notu ekle:
   ```json
   { "type": "MEETING", "summary": "Fabrika ziyareti", "details": "Yeni tezgahlar goruldu" }
   ```

3. `GET /partners/:id/interactions` cagir
   -> 2 etkilesim, DESC sirada (en yeni ust)
   -> Nereye bakilir: Siralama

4. `nextActionDate` gecmis olanlar icin filtre?
   -> Ileride: takip gerektiren etkilerimler raporu

### Edge Case'ler:
- `summary` bos -> Validasyon hatasi
- Gecersiz `type` enum degeri -> 400
- Gelecekte olmayan `nextActionDate` -> Gecerli (gecekmis gorev)
