# PIM Modülü - UI/UX ve Süreç Akışı (Frontend)

Bizim amacımız sistemi eski tip ERP'lerden (1C) kurtarmak. Dolayısıyla "Yeni Ürün Ekle" butonu tek bir devasa, sıkıcı Excel formuna benzememelidir.

## A. Sihirbaz (Wizard) Tabanlı Ürün Ekleme Süreci (Task-Based)

Kullanıcı "Yeni Kumaş Serisi Ekle" dediğinde:

**Adım 1: Temel Hikaye (Product)**
*   Ekran sadedir. Kumaşın Serisi (Adı), Kodu, Kategorisi ve Yıkama Talimatı sorulur. İleri tuşuna basılır.

**Adım 2: Teknik Spesifikasyonlar**
*   "Bu kumaşın teknik sınırları nedir?" 
*   Eni (Width), Gramajı vb. Bu aşamada varsayılan olarak tanımlanır (çünkü tüm renkler genelde aynı ende ve gramajda dokunur). İleri tuşuna basılır.

**Adım 3: Renkler ve Kartela (Varyantlar) - En Eğlenceli Kısım**
*   Kullanıcı karşısına boş bir renk damlası havuzu çıkar. "Tıklayıp Renkleri Hızlıca Ekleyin".
*   "Siyah", "Gri", "Bej" diye yazar. Sistem otomatik olarak alt tarafta 3 satırlık varyant (SKU) bloklarını oluşturur. Kullanıcı sürükle bırakla Siyah kumaş fotoğrafını siyah varyanta bırakır.

## B. Dijital Kartela Oluşturma Ekranı
1. Kullanıcı, `ProductRadar` (Veya yeni adıyla Ürün Katalogu) ekranındayken liste görünümünden sol kısımdaki checkbox'larla 4 farklı varyantı seçer.
2. Sayfanın altında veya üstünde "Yüzen(Floating) bir bar" çıkar: `[4 Kumaş Seçildi - Dijital Kartela Oluştur]`.
3. Tıkladığında bir Drawer açılır. Kartelanın adı (Örn: X Mimarlık Konsept Sunumu) yazılır. Fiyat stunu gösterilsin mi? (Evet/Hayır) seçilir.
4. `[Paylaşım Linki Yarat]` butonuna tıklanır ve oluşan link anında WhatsApp Web veya Mail üzerinden müşteriye atılabilir.

*Müşteri linke tıkladığında, `ebusatis` arayüzünün dışında, e-ticaret sitesi gibi çok zarif, ürünlerin dokusunu yakınlaştırabildiği readonly bir sayfayla karşılaşır.*
