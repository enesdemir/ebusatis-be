# Rol ve Yetki Yönetimi - Detaylı Ekran Listesi

**Tarih:** 07.02.2026
**Durum:** Taslak
**İlgili Mimari:** [rol_yetki_mimari.md](./rol_yetki_mimari.md)
**Dosya Konumu:** `ebusatis-be/docs/rol_yetki_ekranlari.md`

Bu belge, rol ve yetki yönetimi mimarisine uygun olarak geliştirilecek ön yüz (frontend) ekranlarını ve fonksiyonel gereksinimlerini listeler.

---

## 1. Firma (Tenant) Yönetim Ekranları
*Firma yöneticilerinin (Müşterilerin) kendi organizasyonlarını yönettikleri ekranlardır.*

### 1.1. Rol Listesi (Role Management List)
Firma içindeki tanımlı rollerin listelendiği ana ekrandır.

*   **Rota:** `/settings/roles`
*   **Kullanıcı:** Tenant Admin
*   **Temel Bileşenler:**
    *   **Tablo:**
        *   `Rol Adı`: (Örn: Satış Müdürü, Depocu)
        *   `Kullanıcı Sayısı`: Bu role atanmış aktif kullanıcı sayısı.
        *   `Türü`: Sistem Rolü (Değiştirilemez) / Özel Rol (Düzenlenebilir).
        *   `Oluşturulma Tarihi`
    *   **Aksiyonlar:**
        *   `Yeni Rol Ekle` butonu (Üst sağda).
        *   Satır İçi İşlemler: `Düzenle`, `Sil` (Sadece özel roller için), `Kopyala` (Mevcut rolden taslak oluşturarak yeni rol ekleme).

### 1.2. Rol Oluşturma/Düzenleme (Role Editor)
Kullanıcının detaylı yetki ayarlarını yaptığı, sistemin en kritik ekranıdır.

*   **Rota:** `/settings/roles/create` veya `/settings/roles/:id`
*   **Kullanıcı:** Tenant Admin
*   **Bölümler:**
    1.  **Rol Temel Bilgileri:**
        *   `Rol Adı` (Input): Zorunlu alan.
        *   `Açıklama` (Textarea): Opsiyonel, rolün amacını belirtir.
    2.  **Veri Erişim Kapsamı (Data Scope):**
        *   Bu rolün göreceği veri sınırlarını belirler.
        *   Seçenekler (Dropdown):
            *   *Tüm Veriler (All)*: Şirketteki her şeyi görür.
            *   *Sadece Kendi Şubesi (Branch)*: Bağlı olduğu şubenin verilerini görür.
            *   *Sadece Kendi Kayıtları (Own Data)*: Sadece kendi oluşturduğu kayıtları görür (Örn: Plasiyer).
    3.  **Yetki Matrisi (Permission Matrix):**
        *   Yetkiler `Category` alanına göre gruplanmış Accordion/Collapse yapısında listelenmelidir.
        *   **ÖNEMLİ:** Listelenen yetkiler, `assignable_scope = 'TENANT'` olanlarla sınırlandırılmalıdır. Tenant Admin, Platform seviyesindeki yetkileri (`assignable_scope = 'PLATFORM'`) görmemeli ve atayamamalıdır.
        *   Her kategori başlığında "Tümünü Seç" kutucuğu bulunmalıdır.
        *   **Örnek Yapı:**
            *   **[+] Stok Yönetimi (Inventory)**
                *   [x] Stok Görüntüle (`stock.view`)
                *   [ ] Maliyet Görüntüle (`stock.view_cost`) - *Kritik Yetki*
                *   [x] Stok Hareketi Ekle (`stock.create_movement`)
            *   **[+] Sipariş Yönetimi (Order)**
                *   [x] Sipariş Listele (`order.view`)
                *   [ ] Sipariş Sil (`order.delete`)

### 1.3. Kullanıcı Listesi (User Management)
Kullanıcıların görüntülendiği ve durumlarının yönetildiği ekrandır.

*   **Rota:** `/settings/users`
*   **Kullanıcı:** Tenant Admin
*   **Temel Bileşenler:**
    *   **Filter & Search:** İsim, E-posta veya Role göre filtreleme.
    *   **Tablo:**
        *   `Ad Soyad`
        *   `E-posta`
        *   `Atanan Roller`: (Tag yapısında, örn: [Satış Müdürü], [Depo Sorumlusu])
        *   `Durum`: Aktif / Pasif (Toggle switch).
    *   **Aksiyonlar:** `Kullanıcı Ekle`, `Düzenle`, `Şifre Sıfırla`.

### 1.4. Kullanıcı Detay/Düzenleme (User Modal/Page)
*   **Rota:** `/settings/users/:id` veya Modal
*   **Kritik Alanlar:**
    *   `Kullanıcı Bilgileri`: Ad, Soyad, E-posta.
    *   `Rol Atama` (Multi-select Dropdown): Bir kullanıcıya birden fazla rol atanabilir. (Örn: Bir personel hem "Satışçı" hem "Lojistik Destek" olabilir).
    *   `Şube/Lokasyon Seçimi`: Kullanıcının varsayılan şubesi.

---

## 2. Platform (SaaS) Yönetim Ekranları
*SaaS sahibinin (Süper Admin) sistemi yönettiği ekranlardır.*

### 2.1. Global İzin Tanımları (Permission Seeder)
Sistemdeki tüm yeteneklerin (`slug`) listesidir.

*   **Rota:** `/admin/permissions`
*   **Kullanıcı:** Platform Admin
*   **İşlev:** Geliştirici tarafından kodla tanımlanan izinlerin veritabanındaki karşılığını kontrol etmek. Genellikle salt okunurdur.
*   **Alanlar:** `Slug`, `Kategori`, `Açıklama`, `Atanabilir Seviye` (Platform/Tenant).

### 2.2. Sistem Rol Şablonları (Global Role Templates)
Yeni bir firma sisteme kayıt olduğunda otomatik tanımlanacak "Varsayılan Roller"in yönetildiği ekran.

*   **Rota:** `/admin/global-roles`
*   **Kullanıcı:** Platform Admin
*   **İşlev:** "Standart Paket", "Premium Paket" gibi paketlere göre varsayılan rol setleri oluşturmak.
*   **Yapı:** Ekran 1.2 (Role Editor) ile aynıdır, ancak bu rollerin `tenant_id` değeri `NULL` olarak kaydedilir.

---

## 3. Frontend Geliştirme Notları

1.  **Permission Enum:** `enums/Permissions.ts` dosyası backend'deki yetki slug'ları ile birebir eşleşmelidir.
2.  **Guard Bileşeni (`<Can />`):**
    *   Sayfa içindeki butonları veya bölümleri yetkiye göre gizlemek/göstermek için bir React Context yapısı veya Higher Order Component (HOC) kullanılmalıdır.
    *   Örnek: `<Can perform="order.delete"><DeleteButton /></Can>`
3.  **Dinamik Menü:** Sol menü (Sidebar), kullanıcının sahip olduğu yetkilere göre filtrelenerek render edilmelidir. Yetkisi olmayan modüller menüde hiç görünmemelidir.
