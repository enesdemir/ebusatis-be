# Kademe 3: PIM Urun ve Varyant Test Senaryolari

## Senaryo 3.1: Urun Olusturma (Wizard Akisi)

**On Kosullar:** Kategori "Perdelik > Fon Perde", birim "Metre", KDV %20 tanimli
**Aktor:** Urun Yoneticisi

### Adimlar:
1. `POST /products` ile urun olustur:
   ```json
   {
     "name": "Premium Velvet",
     "code": "PRM-VLV",
     "categoryId": "<fon-perde-id>",
     "unitId": "<metre-id>",
     "taxRateId": "<kdv20-id>",
     "trackingStrategy": "SERIAL",
     "fabricComposition": "%80 Pamuk, %20 Polyester",
     "washingInstructions": "30C yikama, utu orta",
     "collectionName": "SS26",
     "moq": 10,
     "origin": "Turkiye"
   }
   ```
   -> Urun olusturuldu
   -> Nereye bakilir: `category.name === "Fon Perde"`, `trackingStrategy === "SERIAL"`

2. `GET /products/:id` ile detay cek
   -> Category, unit, taxRate populate edilmis donmeli
   -> Nereye bakilir: Relation'lar dolu mu

3. `GET /products?categoryId=<fon-perde-id>` ile filtrele
   -> Sadece Fon Perde kategorisindeki urunler donmeli

4. `GET /products?search=velvet` ile ara
   -> "Premium Velvet" bulunmali

### Edge Case'ler:
- `code` bos birakma -> Gecerli (nullable)
- Gecersiz `categoryId` -> Hata veya null category
- `trackingStrategy` verilmezse -> Varsayilan SERIAL
- `moq: 0` -> Gecerli (sifir minimum)

---

## Senaryo 3.2: Varyant Yonetimi

**On Kosullar:** "Premium Velvet" urunu mevcut
**Aktor:** Urun Yoneticisi

### Adimlar:
1. `POST /products/:id/variants` ile varyant ekle:
   ```json
   {
     "name": "Zumrut Yesili",
     "sku": "PRM-VLV-ZMR",
     "price": 45.00,
     "costPrice": 22.50,
     "colorCode": "#2E4057",
     "width": 280,
     "weight": 450,
     "martindale": 40000,
     "minOrderQuantity": 5
   }
   ```
   -> Varyant olusturuldu
   -> Nereye bakilir: `product.id` baglantisi, tum teknik alanlar

2. Ikinci varyant ekle: "Antrasit Gri" (SKU: PRM-VLV-ANT)
   -> Farkli SKU ile olusturuldu

3. Ayni SKU ile ucuncu varyant eklemeye calis ("PRM-VLV-ZMR")
   -> Unique constraint hatasi (SKU benzersiz olmali)

4. `GET /products/:id/variants` cagir
   -> 2 varyant donmeli
   -> Nereye bakilir: Her ikisinin `product.id` ayni

5. `PATCH /products/variants/:variantId` ile fiyat guncelle: `{ "price": 48.00 }`
   -> Fiyat guncellendi

6. `DELETE /products/variants/:variantId` ile sil
   -> 204, soft delete

### Edge Case'ler:
- `price: -10` -> Negatif fiyat gecerli mi?
- `width: 0` -> Sifir en gecerli mi?
- `martindale: null` -> Nullable (sadece doseemelik icin)
- Urunu sildikten sonra varyantlari ne olur? -> Cascade soft delete?

---

## Senaryo 3.3: Urun Detay Sayfalari (Frontend)

**On Kosullar:** Urun + 3 varyant tanimli
**Aktor:** Satis Temsilcisi (Frontend)

### Adimlar:
1. `/pim/products` sayfasina git
   -> Urun listesi goruntuleniyor, arama ve kategori filtresi var
   -> Nereye bakilir: Tablo satirlari, tracking strategy badge

2. Urune tikla -> `/pim/products/:id`
   -> Detay sayfasi: 6 tab (Genel, Teknik, Varyantlar, Gorseller, Fiyatlar, Stok)
   -> Nereye bakilir: Breadcrumb, PageHeader bilgileri

3. "Varyantlar" tab'ina tikla
   -> 3 varyant listeli: renk kutusu + isim + SKU + en + gramaj + fiyat
   -> Nereye bakilir: Renk kodu dogru gosteriliyor mu

4. "Fiyatlar" tab'ina tikla
   -> Satis/Maliyet/Kar tablosu goruntuleniyor
   -> Nereye bakilir: Kar = Satis - Maliyet hesabi

5. "Stok" tab'i -> Disabled (Kademe 4'te aktif)
   -> Tiklanamaz, tooltip aciklamasi var
