# Mevcut Veritabanı Şeması (AI Memory)

Bu belge, tekstil domainine (Top Kumaş) özel olarak kurgulanan veritabanı şemasının özetidir. `ebusatis-be/src/modules/` altında gerçek Entity karşılıkları bulunur.

## 📦 Temel Varlıklar (Entities)
1. **Product (`product.entity.ts`)**: Temel ürün kartı. (Örn: Keten Perde)
2. **ProductVariant (`product-variant.entity.ts`)**: Ürünün rek, desen, en (width) ve gramaj gibi özelliklerini taşıyan varyasyonları.
3. **InventoryItem / Top Kumaş (`inventory-item.entity.ts`)**: **Sistemin Kalbi.** Her bir kumaş topunun fiziksel karşılığı.
   - Özellikleri: `initial_quantity` (İlk Metraj), `current_quantity` (Kalan Metraj), `batch_no`/`lot_no` (Boya kazanı), `barcode` (Sistemin ürettiği etiket).
4. **InventoryTransaction (`inventory-transaction.entity.ts`)**: Kesim, fire, iade gibi stok hareketlerinin (Event-sourcing mantığıyla) loglandığı yapı. Kimin ne kadar kestiğini izler.

*(Bu dosya, kod tabanına yeni tablolar veya modüller eklendikçe AI ajanları tarafından güncellenmelidir.)*
