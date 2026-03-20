# PIM (Ürün Bilgi Yönetimi) Modülü - Genel Bakış

## 🎯 Modülün Amacı
Tekstil (Kumaş/Perde) sektöründeki çok boyutlu ve spesifik ürün yapısını (Varyant Ağacı, Teknik Spesifikasyonlar, Rulo Takibi) yalın ve "Apple sadeliğinde" bir UX ile yönetebilmek. Müşterilere hızlıca dijital kartelalar oluşturup sunabilmek.

## 🌳 Ürün ve Varyant Hiyerarşisi
Sistemdeki ürünler standart e-ticaretteki gibi düz bir listeye değil, yapısal bir ağaca oturacaktır:
1. **Koleksiyon / Sezon (Opsiyonel Üst Katman):** Örn: İlkbahar/Yaz 2026.
2. **Ana Ürün (Product):** Örn: İtalyan Keten Fon Perde. (Ürünün genel hikayesi, yıkama talimatları vb.)
3. **Varyant (Renk/Desen):** Örn: Antrasit Gri, Indigo Mavi. (Kesin teknik veriler, spesifik doku görselleri buradadır.)
4. **Fiziksel Stok (Top/Roll):** Örn: R123 (50m, Lot: A1), R124 (42m, Lot: A2).

## 📊 Teknik Spesifikasyonlar (Domain Specific)
E-ticaretten farklı olarak B2B tekstilde Müşteri "Bu kumaşın gramajı nedir?" diye sorar.
- **En (Width):** Örn: 280 cm, 300 cm, 320 cm.
- **Gramaj (Weight):** Örn: 450 gr/m².
- **Kompozisyon (Composition):** Örn: %80 Pamuk (Cotton), %20 Polyester.
- **Aşınma Direnci (Martindale Test):** Döşemelik kumaşlar için (Örn: 40.000 Martindale).
- **Sertifikalar:** Oeko-Tex Standard 100, Yanmazlık vb.

## 📚 Katalog ve Dijital Kartela Yönetimi
Satış temsilcilerinin en sık yapacağı işlem: B2B müşterisi "Bana otel projesi için gri tonlarında yanmaz kumaşlarınızı atar mısınız?" dediğinde:
1. Filtreleme ile varyantlar seçilir.
2. Sistemin ürettiği tek tıkla şık bir "Dijital Kartela Linki" veya PDF oluşturulur.
3. Müşteri linke girdiğinde ürünün dokusunu, yıkama talimatlarını ve stoku (isteğe bağlı) görür. Müşteriye özel fiyat görebilmesi için yetkilendirilebilir.

## 💰 Fiyatlandırma ve MOQ (İhtiyaç Analizi)
- Farklı müşteri tipleri için Toptan / Perakende fiyat listeleri.
- **MOQ (Minimum Order Quantity):** Varyant bazında "En az 15 metreden aşağısı kesilmez" gibi kuralların tanımlanabilmesi.
