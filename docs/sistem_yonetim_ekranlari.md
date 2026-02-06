# Sistem Yöneticisi Ekranları ve Özellik Seti

**Kullanıcı Profili:** Super Admin (Platform Sahibi)
**Amaç:** SaaS platformunun genel sağlığını, kiracılarını (tenants) ve finansallarını yönetmek.

---

## 1. Dashboard (Genel Bakış)
Login sonrası ilk açılan ekran.

### Metrikler (KPIs)
*   **Total Active Tenants:** Aktif firma sayısı.
*   **Monthly Recurring Revenue (MRR):** Tahmini aylık gelir.
*   **System Load:** CPU/RAM kullanımı (Opsiyonel, Monitor tool entegrasyonu).
*   **Recent Signups:** Son kayıt olan 5 firma.

### Eylemler
*   "Create New Tenant" butonu (Hızlı erişim).
*   "System Maintenance Mode" (Tüm sistemi bakıma al).

---

## 2. Tenant Management (Kiracı Yönetimi)

### Liste Görünümü
Tablo Kolonları:
*   **Company Name:** Firma adı.
*   **Domain:** Alt alan adı (örn: `x.tekstilcrm.com`).
*   **Plan:** Standart / Pro / Enterprise.
*   **Status:** Active 🟢 / Suspended 🔴 / Trial 🟡.
*   **Users:** Toplam kullanıcı sayısı.
*   **Created At:** Kayıt tarihi.

### Detay Görünümü
*   **Firma Bilgileri:** Adres, Vergi No, İletişim.
*   **Lisans Bilgileri:** Başlangıç/Bitiş tarihi, lisans anahtarı.
*   **Modül Ayarları:** Hangi modüller açık? (Örn: Sadece Stok modülü açık, CRM kapalı).
*   **Kullanıcı Listesi:** O firmanın admin kullanıcıları.

### İşlemler
*   **Login As Tenant (Impersonate):** Admin kullanıcısı, tek tıkla o firmanın paneline "Sanki o firmanın adminiymiş gibi" giriş yapabilmeli. (Destek vermek için kritik özellik).
*   **Suspend:** Ödeme yapmadıysa firmayı dondur.
*   **Migrate DB:** Sadece bu firmanın veritabanı şemasını güncelle (On-prem ise).

---

## 3. Global Settings (Sistem Ayarları)

### Konfigürasyonlar
*   **Döviz Kurları Entegrasyonu:** Merkez bankası API ayarları.
*   **Mail Sunucusu (SMTP):** Sistem mailleri için global ayar (Tenantlar bunu ezebilir).
*   **Yedekleme Politikası:** Günlük/Haftalık yedekleme saatleri.

---

## 4. Kullanıcı ve Rol Yönetimi (Platform Seviyesi)

Bu ekran tenantların içindeki kullanıcıları DEĞİL, sistemi yöneten "Süper Admin"leri yönetir.
*   **Admin List:** Sisteme girebilen developer/support ekibi.
*   **Audit Logs:** Hangi admin hangi tenant'ı ne zaman suspend etti?

---

## 5. Implementation Checklist (Geliştirici Notları)

- [ ] `TenantService` içinde `impersonate(tenantId)` metodu yazılacak. JWT payload'ına `isImpersonated: true` flag'i eklenecek.
- [ ] Dashboard için `StatsService` yazılacak (Basit COUNT sorguları).
- [ ] Frontend'de `Layout` komponenti "Super Admin" modunda farklı (belki kırmızı bir header ile) çalışmalı ki admin yanlışlıkla işlem yapmasın.
