# PIM Modülü - Veritabanı ve Mimari Tasarımı

Bu dizayn, NestJS + MikroORM ve PostgreSQL kullanarak inşa edilecek PIM modülünün Entity mimarisini tanımlar.

## Tablo Tasarımları

### 1. `Product` (Ana Ürün Kartı)
- `id`: UUID
- `name`: string (Örn: "Premium Velvet")
- `code`: string (Ana ürün kodu, Örn: "PRM-VLV")
- `description`: text
- `fabric_composition`: string (Opsiyonel/Genel Yıkama/Kompozisyon. Örn: "%100 Polyester")
- `washing_instructions`: string (Yıkama ikon referansları veya açıklamaları)
- `category_id`: Relation (Perdelik, Döşemelik vs.)
- `collection_name`: string (Örn: "SS26 Collection")
- `is_active`: boolean 
- `created_at`, `updated_at`

### 2. `ProductVariant` (Renk / Desen Katmanı)
Buradaki veriler `Product`'tan daha kritiktir çünkü sipariş ve stok aslında varyanta bağlanır.
- `id`: UUID
- `product_id`: Relation (Product)
- `name`: string (Örn: "Zümrüt Yeşili")
- `sku`: string (Örn: "PRM-VLV-ZMR")
- `color_code`: string (Hex kod veya Pantone referansı)
- `width`: decimal (En. Örn: 140.0 cm)
- `weight`: decimal (Gramaj, gr/m². Örn: 320.0)
- `test_martindale`: integer (Döşemelik ise sürtünme katsayısı, Örn: 50000)
- `price`: decimal (Baz Toptan Satış Fiyatı)
- `currency`: string ('USD', 'EUR', 'TRY')
- `min_order_quantity`: decimal (Örn: 1.0 veya 10.0 metre)
- `primary_image_url`: string (Doku/Kartela fotoğrafı)

*(Önemli: Topların/Ruloların tutulduğu `InventoryItem` tablosundaki `variant_id` direkt olarak bu tabloya bakar.)*

### 3. `DigitalCatalog` (Kartela Paylaşımı)
B2B satış temsilcisinin anlık oluşturduğu veya sisteme kaydettiği linkler.
- `id`: UUID
- `title`: string (Örn: "Hilton Otel Projesi Karartma Kumaşlar")
- `slug_or_token`: string (Dışarıya verilecek gizli link)
- `expires_at`: datetime (Linkin süresi dolsun mu?)
- `customer_id`: Relation (Hangi cari için hazırlandı, zorunlu değil)

### 4. `DigitalCatalogItems`
- `catalog_id`: Relation
- `variant_id`: Relation (Karteladaki renkler)
