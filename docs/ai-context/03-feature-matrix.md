# Özellik Matrisi ve Durum (AI Memory)

## 📌 Mevcut Tamamlanmış Özellikler 
- [x] Süper Admin / Tenant altyapısı (Frontend ve Backend auth/iam hazır)
- [x] Temel Ürün ve Stok tabloları (NestJS Entities yaratıldı)
- [x] Standartlaştırılmış AI Memory (RAG/Context) yapısı

## 🚀 İnşa Aşamasındaki Özellikler (Mevcut Sprint / Plan)
1. **PIM (Ürün ve Varyant Yönetimi) Ekranları:** `product-radar` altındaki genel yapıların tekstil spesifik (En, Gramaj) olarak güncellenmesi.
2. **WMS Depo Kabul (Top Girişi) Ekranı:** Yeni gelen fiziksel barkodlu toplarin sisteme `initial_quantity` ve Parti (Lot) numarasıyla hızlıca girileceği, barkod tarayıcı destekli ekran.
3. **WMS Stok Listesi ve Top Detay Ekranları:** Gelişmiş filtreleme (Metraj aralığı, rezerve durum, Lot durumu) ve top tarihçesi sayfası.
4. **Satış ve Kesim (Rezervasyon) Motoru:** Sepet mantığıyla kumaş kesimi ve fire(scrap) optimizasyon algoritması.

*(Bu alan, in-app ve kod geliştirici AI'lar için mutlak "Canlı Kaynak/Truth" olarak kabul edilmelidir.)*
