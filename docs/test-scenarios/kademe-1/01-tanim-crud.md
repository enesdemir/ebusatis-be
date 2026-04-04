# Kademe 1: Temel Tanimlar CRUD Test Senaryolari

## Senaryo 1.1: Birim Tanimi CRUD

**On Kosullar:** Tenant olusturulmus, varsayilan birimler seed edilmis
**Aktor:** Tenant Admin

### Adimlar:
1. `GET /definitions/units` cagir
   -> 8 varsayilan birim listelenmeli (scope: SYSTEM_SEED)
   -> Nereye bakilir: Her birimin `name`, `code`, `symbol`, `category` alanlari

2. `POST /definitions/units` ile yeni birim olustur:
   ```json
   { "name": "Inch", "code": "in", "symbol": "in", "category": "LENGTH", "decimalPrecision": 2, "baseConversionFactor": 0.0254 }
   ```
   -> Birim olusturuldu, `scope: "TENANT"` olmali
   -> Nereye bakilir: Response'da ID + scope

3. Ayni `code` ile tekrar olusturmaya calis (`code: "in"`)
   -> 409 Conflict donmeli
   -> Nereye bakilir: Hata mesaji "Bu kod zaten kullaniliyor"

4. `PATCH /definitions/units/:id` ile guncelle: `{ "name": "Inç" }`
   -> Isim guncellendi
   -> Nereye bakilir: Response'da `name: "Inç"`

5. `PATCH /definitions/units/:id/toggle-active` cagir
   -> `isActive: false` oldu
   -> Nereye bakilir: Response'da `isActive`

6. `DELETE /definitions/units/:id` cagir
   -> 204 No Content
   -> Nereye bakilir: Tekrar GET yapinca listede yok (soft delete)

### Edge Case'ler:
- `code` bos string -> Validasyon hatasi
- `category` gecersiz enum -> Validasyon hatasi
- `decimalPrecision: -1` -> Min 0 validasyonu
- SYSTEM_SEED kaydi silinebilir mi? -> Evet (tenant kendi kopyasini yonetir)

---

## Senaryo 1.2: Kategori Agac Yapisi

**On Kosullar:** Varsayilan kategoriler seed edilmis
**Aktor:** Tenant Admin

### Adimlar:
1. `GET /definitions/categories/tree` cagir
   -> Agac yapisi donmeli:
   ```
   Kumaslar (depth:0)
     Perdelik (depth:1)
       Fon Perde (depth:2)
       Tul Perde (depth:2)
     Doseemelik (depth:1)
   Aksesuarlar (depth:0)
   ```
   -> Nereye bakilir: `children` dizileri ve `depth` alanlari

2. Yeni alt kategori ekle: Perdelik > "Stor Perde"
   ```json
   { "name": "Stor Perde", "code": "roller-blind", "parentId": "<perdelik-id>" }
   ```
   -> `depth: 2`, `parent.id === perdelik-id` olmali

3. `GET /definitions/categories/tree` tekrar cagir
   -> Perdelik altinda 3 alt kategori gorunmeli

4. Kok kategori ekle: "Tul ve Perdeler"
   ```json
   { "name": "Tul ve Perdeler", "code": "tulle", "parentId": null }
   ```
   -> `depth: 0`, parent null olmali

### Edge Case'ler:
- Kendisini parent olarak atamaya calis -> Hata veya dongusel referans engeli
- Silinmis parent'a child eklemeye calis -> 404
- Ayni parent altinda ayni code -> Unique constraint hatasi

---

## Senaryo 1.3: Para Birimi ve Varsayilan Secim

**On Kosullar:** 4 varsayilan para birimi mevcut
**Aktor:** Tenant Admin

### Adimlar:
1. `GET /definitions/currencies` cagir
   -> TRY `isDefault: true` olmali, diger 3 `isDefault: false`

2. USD'yi varsayilan yap: `PATCH /definitions/currencies/<usd-id>` `{ "isDefault": true }`
   -> USD artik varsayilan
   -> Nereye bakilir: TRY'nin de `isDefault: false` olmasi gerekir mi? (is kurali)

3. Yeni para birimi ekle: GBP
   ```json
   { "name": "Ingiliz Sterlini", "code": "GBP", "symbol": "£", "position": "PREFIX" }
   ```
   -> Olusturuldu, `isDefault: false` olmali

### Edge Case'ler:
- Tum para birimlerini pasif yapmaya calis -> En az bir aktif kalmali mi?
- `decimalPlaces: 5` -> Max 4 siniri asmali mi?

---

## Senaryo 1.4: Durum Tanimlari ve Gecis Kurallari

**On Kosullar:** 7 siparis durumu seed edilmis
**Aktor:** Tenant Admin

### Adimlar:
1. `GET /definitions/statuses` cagir
   -> 7 kayit, hepsi `entityType: "ORDER"`

2. "Taslak" durumunun `allowedTransitions` kontrol et
   -> `["confirmed", "cancelled"]` olmali
   -> Nereye bakilir: JSON array icerigi

3. "Teslim Edildi" durumunun `isFinal: true` kontrol et
   -> Final durumlarda `isFinal: true`

4. Yeni durum ekle: "Kismi Sevk"
   ```json
   { "name": "Kismi Sevk", "code": "partial-ship", "entityType": "ORDER", "color": "#6B21A8", "allowedTransitions": ["shipped", "delivered"] }
   ```
   -> Olusturuldu

5. "Hazirlaniyor" durumunun gecislerine "partial-ship" ekle
   -> `PATCH` ile `allowedTransitions: ["shipped", "cancelled", "partial-ship"]`

### Edge Case'ler:
- `allowedTransitions` icinde var olmayan code -> Uyari mi gerekli?
- Ayni entityType icinde ayni code -> Unique constraint hatasi
- Farkli entityType'da ayni code -> Gecerli (ORDER.draft vs INVOICE.draft)
