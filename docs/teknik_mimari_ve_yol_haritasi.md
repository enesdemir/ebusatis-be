# Tekstil ERP & CRM Platformu (GMPSeller Benzeri) - Teknik Mimari ve Uygulama Planı

**Tarih:** 05.02.2026
**Hazırlayan:** Senior Software Architect
**Durum:** Taslak

---

## 1. Giriş ve Proje Vizyonu

Bu doküman, perde ve tekstil sektörü için özelleşmiş; stok takibini standart "adet" üzerinden değil, "top/metraj" (Dimensional Inventory) üzerinden yapan, B2B odaklı bir SaaS platformunun teknik yol haritasını içerir. 

Sistem, **"Top Kumaş Yönetimi"** ve **"Hassas Kesim/Fire Takibi"** problemlerini merkeze alarak tasarlanacaktır.

---

## 2. Veritabanı Mimarisi (Database Schema Strategy)

Tekstil sektörünün en büyük problemi "Dimensional Inventory" (Boyutlu Stok) yönetimidir. Standart bir e-ticaret yapısındaki `product (id, stock_qty)` mantığı burada **çalışmaz**. Her bir top kumaş, kendi kimliği (unique ID) olan tekil bir varlıktır.

### Önerilen Entity Relationship (ERD) Yaklaşımı

Temel hiyerarşi şu şekilde olmalıdır: `Product` > `Variant` > `InventoryItem (Roll)` > `InventoryTransaction`.

#### Kritik Tablolar ve Alanlar:

1.  **Products (Ürünler):**
    *   Temel ürün bilgileri (Adı, Kodu, Üretici, Kategori).
    *   `unit_type`: 'meter', 'kg', 'yard' (Ölçü birimi).
    *   `tracking_strategy`: 'serial_tracking' (Seri/Top takibi) vs 'bulk_tracking' (Dökme).

2.  **ProductVariants (Varyantlar):**
    *   Renk, desen, en (width), gramaj bilgileri.
    *   `sku`: Varyant bazlı stok kodu.

3.  **InventoryItems (Rolls/Toplar) - **EN KRİTİK TABLO**:**
    *   `id`: UUID (Her topun benzersiz kimliği).
    *   `variant_id`: Hangi varyanta ait olduğu.
    *   `barcode`: Topun üzerindeki fiziksel barkod.
    *   `initial_quantity`: Topun ilk geliş metrajı (örn: 50m).
    *   `current_quantity`: Kalan metraj (örn: 23.40m).
    *   `batch_no` / `lot_no`: Boya kazanı (Lot) numarası (Renk farkı yönetimi için kritik).
    *   `status`: 'AVAILABLE', 'RESERVED', 'SOLD', 'SCRAP' (Fire), 'RETURNED'.
    *   `location_id`: Depo/Raf adresi (Raf: A-12).
    *   `warehouse_id`: Hangi depoda olduğu.

4.  **InventoryAuditLog (Traceability / İzlenebilirlik):**
    *   Hangi toptan, ne zaman, kim, ne kadar kesti?
    *   `action`: 'CUT', 'RECEIVE', 'ADJUSTMENT', 'MOVE'.
    *   `parent_roll_id`: Eğer bir toptan parça bölündüyse ana top ID'si.

### "Dimensional Inventory" Çözümü

Bir topu kestiğimizde veritabanında **UPDATE** yapmak yerine **Event-Sourcing** benzeri bir mantıkla çalışmalıyız, ancak performans için snapshot mantığını korumalıyız.

*   **Senaryo:** Müşteri 10m kumaş istedi. Depoda 50m'lik bir top (ID: R1) var.
*   **İşlem:**
    1.  R1 topundan 10m rezerve edilir (`current_quantity` düşülmez, `committed_quantity` artar).
    2.  Kesim onaylandığında:
        *   R1 `current_quantity` = 40m olur.
        *   Yeni bir Sanal Varlık (Kesilmiş Parça) veya doğrudan Sipariş Satırı ile R1 arasında link kurulur.
        *   `InventoryTransaction` tablosuna kayıt atılır: `Source: R1, Qty: -10m, Reason: Order #123`.

---

## 3. Teknoloji Yığını (Tech Stack) Önerisi

Yüksek performans, "Real-time" güncelleme ihtiyacı ve karmaşık iş mantığı (business logic) gereksinimleri nedeniyle aşağıdaki modern stack'i öneriyorum:

### Backend: Node.js (NestJS)
*   **Neden:** 
    *   Şu anki projeniz (`ebusatis-be`) halihazırda NestJS yapısında görünüyor, bu ekosistemi korumak, geliştirme hızını artırır.
    *   Type-Safe (TypeScript) yapısı, karmaşık sipariş ve stok mantıklarında hata riskini azaltır.
    *   **Architecture:** Hexagonal Architecture veya Domain-Driven Design (DDD) uygulanmalı. "Inventory" (Stok) ve "Order" (Sipariş) bağımsız modüller (Bounded Contexts) olmalı.

### Veritabanı: PostgreSQL
*   **Neden:** Relational Data integrity (Veri tutarlılığı) bu işin kalbidir.
    *   Siparişin faturaya, faturanın stoğa, stoğun varyanta hatasız bağlanması gerekir. NoSQL (Mongo vb.) bu tip transaction-heavy ve ilişkisel işlerde veri tutarlılığını sağlamakta zorlanabilir.
    *   **Özellik:** JSONB desteği sayesinde varyantların dinamik özellikleri (desen, ekstra özellikler) esnek tutulabilir.

### Frontend: React (Vite) + TailwindCSS
*   **Neden:** 
    *   Hızlı render performansı ve zengin komponent ekosistemi.
    *   **State Management:** TanStack Query (Server State) + Zustand (Client State). Karmaşık sipariş formlarını yönetmek için React Hook Form.

### Real-Time: Socket.io veya Redis Pub/Sub
*   **Kullanım:** Stoktaki son bir topu aynı anda iki satış temsilcisi satmaya çalışırsa, biri "Sepete Ekle" dediğinde diğerinin ekranında o top anında "Rezerve" veya "Kilitli" olarak güncellenmelidir.

---

## 4. İş Mantığı ve Algoritma Zorlukları

### A. "Hassas Kesim" (Precision Cutting) Algoritması

Soru: Müşteri 22.5m istedi, stokta 23m var. Kalan 0.5m ne olacak?

**Önerilen Algoritma:**

1.  **Threshold (Eşik) Tanımlama:** Sistem genelinde veya ürün bazında bir `scrap_threshold` (Hurdama Eşiği) tanımlanır (Örn: 1.0 metre).
2.  **Sipariş Anı Kontrolü:**
    ```typescript
    if (Roll.length - Order.quantity < scrap_threshold) {
        // Kullanıcıya Soru Sor:
        // "Bu kesimden sonra kalan 0.5m parça 'satılamaz' (hurda) niteliğindedir."
        // Seçenek A: Müşteriye tüm topu (23m) satmayı öner.
        // Seçenek B: Kalan 0.5m'yi 'Fire' (Wastage) olarak işaretle ve maliyete yansıt.
    }
    ```
3.  **Fire Yönetimi:** Eğer 0.5m fire olarak ayrılırsa, bu miktar stoktan düşülür ancak finansal olarak "COGS" (Cost of Goods Sold) hesabına "Üretim/Kesim Firesi" olarak yansıtılır.

### B. Çoklu Para Birimi (Multi-Currency)

Tekstil sektörü dövizle hammadde alıp, farklı dövizlerle satış yapabilir.

*   **Best Practice:**
    *   Tüm parasal değerler veritabanında **Decimal** (Floating point hatası olmaması için) olarak saklanmalı.
    *   Her işlem (Sipariş, Fatura), işlemin yapıldığı andaki **Kur Değeri (Exchange Rate)** ile birlikte saklanmalı.
    *   `Orders` tablosunda: `amount`, `currency`, `exchange_rate_to_base` alanları bulunmalı.
    *   Raporlarda P&L hesaplanırken, faturanın kesildiği günkü kur ile tahsilatın yapıldığı günkü kur arasındaki **Kur Farkı Kar/Zararı** otomatik hesaplanmalıdır.

---

## 5. Rakip ve Pazar Araştırması

### Mevcut Çözümler ve Eksikleri:
*   **Genel ERP'ler (Logo, Netsis, Mikro):** Çok güçlü muhasebe altyapıları var ancak "Top Takibi" (Roll Management) konusunda yetersizler. Genelde topu sadece "Adet" olarak görüyorlar, metraj takibini "Parti/Lot" modülleriyle çözmeye çalışıyorlar ki bu da kullanıcı deneyimini (UX) zorlaştırıyor.
*   **Sektörel Çözümler (Nebim V3 vb.):** Tekstil perakendesi için iyiler (T-shirt, pantolon) ama "Kumaş Toptancılığı" ve "Top Kesim" süreçleri mağazacılıktan çok farklıdır.
*   **GMP Seller:** Rusya/BDT pazarında güçlü, özellikle lojistik entegrasyonu iyi. Ancak modern UI/UX ve tam web tabanlı SaaS deneyimi konusunda yeni teknolojilerle (React/Next.js) rekabet edemeyebilir.

**Sizin Fırsatınız:** Modern, hızlı, mobil uyumlu ve "Top" mantığını native (doğal) olarak destekleyen bir stok motoru.

---

## 6. MVP (Minimum Viable Product) Yol Haritası (İlk 1 Ay)

Tek kişilik veya küçük bir ekiple ilk ayda odaklanılması gerekenler:

**Hafta 1: Temel Yapı ve Ürün Kataloğu**
*   [Backend] NestJS proje kurulumu, PostgreSQL bağlantısı.
*   [DB] `Products`, `Variants`, `Rolls` tablolarının oluşturulması.
*   [Frontend] Ürün ve varyant tanımlama ekranları.
*   [Feature] "Stok Girişi" (Top bazında barkodlu giriş).

**Hafta 2: Stok ve Depo Yönetimi**
*   [Feature] Top listeleme, filtreleme (Metraj aralığına göre, rezerve durumuna göre).
*   [Feature] Top detay görüntüleme (Tarihçe: Ne zaman girdi, kim kesti?).
*   [Backend] Barkod oluşturma ve yazdırma servisi (Zebra/PDF).

**Hafta 3: Sipariş ve Rezevasyon Motoru (Core Logic)**
*   [Feature] Sipariş oluşturma (Basket).
*   [Logic] Sepete atılan ürün için **Doğru Topu Otomatik Seçme** (FIFO veya Müşterinin istediği metraja en yakın topu önerme algoritması).
*   [Logic] Rezervasyon kilitleme (Concurrency control).

**Hafta 4: Dashboard ve Temel Raporlama**
*   [UI] Admin Dashboard (Toplam Stok Metrajı, Toplam Varyant Sayısı).
*   [Feature] Basit Sevkiyat (Stoktan düşüş).

**Sonraki Aylar:** Cari Hesap, Banka Entegrasyonu, Telegram Botu.

---

### Özet Tavsiye
Projeye **"Inventory First"** (Önce Stok) yaklaşımıyla başlayın. Eğer stok motorunuz "Top bölme, birleştirme, fire verme" işlemlerini kusursuz yapamazsa, üzerine kuracağınız sipariş veya finans modülleri anlamsız kalır. Öncelikle "Sanal Bir Kumaş Deposu"nu yönetebilen bir API yazın.
