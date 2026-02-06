# Kiracı (Tenant) Detay Sayfası Tasarımı

**Amaç:** Sistem yöneticisinin (Super Admin), bir müşteri firmasıyla (Tenant) ilgili tüm bilgilere tek bir yerden erişmesi ve yönetimsel müdahaleleri yapabilmesi.

## 1. Başlık ve Hızlı Aksiyonlar (Header)
Sayfanın en üstünde firmanın temel kimliği ve kritik butonlar yer alır.
*   **Sol Taraf:** Firma Logosu, Firma Adı, Domain (`demo.ebusatis.com`) ve ID.
*   **Sağ Taraf (Aksiyonlar):**
    *   `Login As Tenant (Impersonate)`: Tek tıkla o firmanın içine admin olarak gir. (Destek için).
    *   `Suspend / Activate`: Ödeme yapılmadıysa firmayı durdur.
    *   `Edit`: Temel bilgileri düzenle.

## 2. Sekmeler (Tabs)
Bilgiyi kategorize etmek için sekmeli yapı önerilir.

### Sekme 1: Genel Bakış (Overview)
*   **Firma Özeti:** Vergi No, Adres, İletişim Bilgileri (Telefon, Email).
*   **Abonelik Durumu:**
    *   Mevcut Paket: `Enterprise Plan`
    *   Durum: `Active` 🟢
    *   Bitiş Tarihi: `01.01.2027`
    *   Lisans Türü: `SaaS` / `On-Prem`
*   **Kullanım İstatistikleri (Limitler):**
    *   Kullanıcı Sayısı: 5 / 10
    *   Dosya Alanı: 2.3 GB / 10 GB

### Sekme 2: Modül Konfigürasyonu (Features)
Bu firmaya özel hangi modüllerin açık olduğunun yönetimi.
*   [x] Stok Yönetimi (Core)
*   [x] B2B Portali
*   [ ] Üretim Modülü (Kapalı)
*   [x] E-Fatura Entegrasyonu

### Sekme 3: Yönetici Kullanıcılar (Admin Users)
Bu firmanın "Tenant Owner" veya "Admin" yetkisine sahip kullanıcıları.
*   Şifre Sıfırlama butonu (Müşteri şifresini unuttuğunda).
*   Yeni Admin ekleme.

### Sekme 4: Finansal Geçmiş (Invoices)
*   Sistem tarafından kesilen faturalar.
*   Ödeme geçmişi.

### Sekme 5: Teknik Ayarlar / Loglar
*   **Audit Logs:** Bu firma ile ilgili yapılan son kritik işlemler.
*   **Sistem Notları:** Adminlerin firma hakkında aldığı özel notlar (örn: "Müşteri ile X tarihinde görüşüldü, ek süre verildi").

## 3. Örnek Senaryo: "Impersonation" (Kritik Özellik)
Müşteri arayıp "Stok modülüne giremiyorum, hata alıyorum" dediğinde, Super Admin "Login As" butonuna basar. Sistem arka planda geçici bir token üretir ve Super Admin'i o firmaya giriş yapmış gibi yönlendirir. Hatayı yerinde görür.
