# Eski Sistem (1C) Analizi ve Çıkarılan Yeni Özellikler

Bu doküman, eski sistem ekranlarından analiz edilerek EBusatış platformuna entegre edilmesine karar verilen özellikleri barındırır. Doküman ekran analizleri devam ettikçe güncellenecektir.

## 📦 1. Tedarik, Satınalma ve Lojistik Yönetimi
*   **Gelişmiş Tedarikçi Siparişleri:** Tedarikçilere geçilen siparişlerin detaylı statü takibi.
*   **İthalat Operasyonu ve Konteyner Takibi:** İthalat süreçlerinin yönetimi, siparişlerin konteyner, araç ve gümrük seri bilgisi ile eşleştirilmesi. **Özellikle Gümrük Beyannamelerinin (ГТД - GTD) sistemde numara ve maliyet bazında tutulması.**
*   **Çoklu Döviz (Multi-Currency) Desteği:** Dövizli sipariş ve faturalandırma.
*   **Tedarikçi Fiyat Katalogları:** Sisteme tedarikçilerin fiyat listelerinin yüklenebilmesi (Price-lists).

## 📥 2. Boyutlu Stok: Depo ve Mal Kabul (WMS)
*   **Rulo/Top Bazlı Benzersiz Mal Kabul (Dimensional Inventory):** Gelen her ürünün farklı metrajlarda (örn: 17.5m, 21m) ve benzersiz lot/seri (Lot/Roll) numaralarıyla kaydedilmesi (`InventoryItem`).
*   **El Terminalleri (ТСД) ile Entegrasyon:** Depodaki personelin kullandığı lazerli mobil barkod okuyuculara (Data Terminals) iş emirlerinin gönderilmesi ve toplanan sayım/toplama verisinin ERP'ye aktarılması.
*   **Depo Sayımı & Fire Yönetimi:** Eksik, Fazla, Hasarlı ürünlerin kayıtları. Yanlış etiketlenen ürünler için stok düzeltme "Regrading (Пересортица)" işlemi.

## 🛒 3. Satış, Çoklu Depo ve Rulo Algoritmaları
*   **Sipariş Verirken Rulo (Seri) Seçimi:** Satış kalemi eklenirken, varyanta ait uygun ruloların pop-up ile çıkması ve manuel veya "Tam Ruloları Dağıt" butonuyla tahsis edilmesi.
*   **Çoklu Depo / Alt Şirket Siparişi:** Siparişin hangi merkezden (Kazan, Ufa) çıkacağının ve o şubeye ait şirket (Legal Entity) kimliğinin seçilebilmesi.

## 📈 4. Gelişmiş Raporlama ve BI (Business Intelligence)
*   **Çoklu-Şube Matris Raporu (Cross-Branch Matrix):** Tek bir pivot ekranda tüm ürünlerin/varyantların yatayda Şubelere göre (Kazan, Ufa, Moskova) kategorize edilip her şubenin "Kalan Stok" ve "Satılan Miktar" verilerinin yan yana devasa bir matriste sunulması.
*   **Dinamik Pivot & Favori (Bookmark) Raporlar:** Kullanıcıların esnek filtre ve kolonlarla kendi raporlarını kurup "Natika'nın Raporu" diye ana menüye sabitleyebilmesi.
*   **Kârlılık ve Stok Hareket Matrixi (Profit Board):** Başlangıç Bakiyesi, Giren, Çıkan, Açık Kalan ve Kârlılığın yan yana satır satır analiz edilebildiği ana rapor.

## 🤝 5. CRM ve Gelişmiş Müşteri Yönetimi
*   **Müşteri ve Cari (Partner vs Counterparty) Ayrımı:** Tek Müşteri (Partner) altında farklı Fatura Kimlikleri (Cariler) tutulması ve firmaların aynı anda Tedarikçi & Rakip olarak işaretlenebilmesi.
*   **Türev Bazlı Satış Temsilcisi Ataması:** Tek bir müşteriye ürünün satış şekline göre (Metraj Temsilcisi, Kesim Temsilcisi, Hazır Ürün Temsilcisi) üç ayrı plasiyer atanabilmesi.
*   **Etkileşim Geçmişi (Interaction Log):** Görüşmelerin loglanması.

## 🔗 6. ERP Belge Akışı (Document Graph) ve Kârlılık
*   **Hiyerarşik Belge Bağlantı Ağacı (Linked Documents):** Herhangi bir siparişin içine girildiğinde hiyerarşik bir ağaç yapısında o siparişe bağlı "İrsaliye", "Vergi Faturası", "Tahsilat" gibi tüm evrakların ata-soy ilişkisiyle (Parent-Child) dallanarak tek ekranda gösterilmesi.
*   **Sipariş İçi Bağlamsal Raporlar:** Sadece ana rapor menüsünde değil, bir siparişin içine girildiğinde "O siparişin anlık kârlılığı", "O müşterinin anlık borcu/bakiyesi" gibi o belgeye özel izole raporların anında çalıştırılabilmesi.

## 🏦 7. Finans, Yönderici Muhasebe ve Hazine (Treasury)
*   **Sipariş Anında Cari Limit/Borç Uyarısı:** Müşteri siparişi oluşturulurken anlık cari risk/bakiye bilgisinin görünmesi.
*   **Banka İşlemleri (Nakit Akışı):** Banka transferleri ve nakitsiz ödemelerin entegrasyon üzerinden sistem içine çekilmesi, faturalarla eşlenmesi (Payment Matching).
*   **Nakit Akış Planlaması (Treasury):** Krediler, mevduatlar ve banka planlaması, Kasa (Cashbook) yönetimi.
*   **Yönetim Muhasebesi (Controlling):** Gider dağıtımı, yönetimsel bilanço (Management Balance Sheet) ve Şirketler/Şubeler arası mal hareketleri (Intercompany transactions).

## 🧩 8. Satış Kanalları ve Bütçeleme (Satış & Bütçe Modülleri)
*   **Toptan ve Perakende POS Ayrımı:** Sistemin hem B2B "Sipariş (Wholesale)" ekranlarına hem de donanım entegreli bir "Kasiyer Ekranı (POS KKM)" modülüne sahip olması.
*   **Satış Planlama ve Bütçeleme:** Stok durumuna ve geçmiş satış öngörülerine bakılarak ürün bazlı satış hedeflerinin/planlarının sisteme girilmesi ve bütçe oluşturulması.

## 🏭 9. Üretim ve Mamül Dönüşümü (Manufacturing)
*   **Reçete (BOM) ve Üretim İş Emirleri:** Ham kumaşı (Örn: Tül) alıp keserek/dikerek bitmiş ürüne (Örn: Hazır Perde) dönüştürme yeteneği. İşçilik maliyetlerinin de dahil olduğu üretim fişleri.

## 🌐 10. Omni-Channel / Pazaryeri Entegrasyon Merkezi
*   **Harici Satış Kanalları (Marketplaces):** Sistemin ana ayarlarında Ozon, Wildberries (WB), Yandex Market, Sber Mega Market, Leroy Merlin ve 1C-Bitrix gibi platformlarla doğrudan entegrasyon ayarları mevcuttur. EBusatış da dışarıya açık e-ticaret siteleri ve pazar yerleriyle tam entegre bir yapıda (Omni-channel ERP) düşünülmelidir.

## 👥 11. İnsan Kaynakları ve Vergi Uyumluluğu
*   **Gelişmiş İK ve Bordro:** Personel yönetimi, prim hakedişleri, mesai çizelgeleri (Timesheets), izinler ve hastalık kesintilerine kadar inen tam kapsamlı bir İK modülü.
*   **Statüker (Regresyon/Resmi) Muhasebe:** İç raporlama dışında, devlete verilen yasal beyannamelerin (Vergi raporları) standartlara uygun işlendiği paralel bir resmi muhasebe izi.
