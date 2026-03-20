---
description: React Frontend UI Coding Standards
---

# React UI & Component Standartları

## 1. Bildirimler ve Hata Mesajları (Notifications / Toasts)
Kullanıcıya gösterilecek olan başarı, hata veya bilgi mesajlarında Frontend genelinde bir bütünlük sağlanması zorunludur.

*   **YASAK:** Hiçbir component içerisinde `window.alert()` veya `alert()` çağırmak kesinlikle yasaktır!
*   **YASAK:** Component (veya sayfa) düzeyinde `react-hot-toast`, `react-toastify` gibi harici bildirim paketlerini **doğrudan (direct import)** etmek yasaktır.
*   **ZORUNLU KURAL:** Bildirim göstermek için daima `ebusatis/src/utils/toast.ts` altındaki merkezi yardımcı fonksiyon sınıfı (util) kullanılmalıdır.

### Örnek Kullanım:
```tsx
import notify from 'src/utils/toast';

try {
  await api.submit();
  notify.success('İşlem başarılı!');
} catch (error) {
  notify.error('Hay aksi: ' + error.message);
}
```
Bu kural sayesinde ileride projedeki Toast kütüphanesini değiştirmek istersek, projedeki yüzlerce sayfayı değiştirmek yerinde sadece `utils/toast.ts` dosyasını değiştirmemiz yetecektir.
