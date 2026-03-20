# SaaS Multi-Tenant İzolasyon Mimarisi (AI Memory)

## 📌 Neden Bu Yapı Kullanılıyor?
Kullanıcıların birden fazla çalışma alanına (Tenant/Firma) üye olabildiği B2B SaaS projelerinde (1C veya Slack gibi), kullanıcının kimliği (JWT Token) ile o an hangi firma adına işlem yaptığı bağlamı (Context) birbirinden ayrıdır.

## 🏛 Mimarinin Bileşenleri
1. **İstek Başlığı (HTTP Header) `x-tenant-id`:** Frontend, kullanıcının o an ekranda seçili olan firmasını her API isteğinde bu başlıkla Backend'e iletir.
2. **Bağlam Saklama (AsyncLocalStorage - ALS):** NestJS Middleware, gelen `x-tenant-id` bilgisini yakalar. Kullanıcının o tenant'ta yetkisi olup olmadığı doğrulanır ve yetkisi varsa ALS içine `tenantId` gömülür.
3. **Veritabanı İzolasyonu (MikroORM Filters):** Tüm Tenant'a duyarlı (Sistemin %99'u) Entity'lerde `@Filter({ name: 'tenant', cond: ... })` dekoratörü bulunur. MikroORM, ALS içindeki ID'yi okuyarak her SQL sorgusuna otomatik `WHERE tenant_id = 'xxx'` ekler. Geliştirici bunu yazmayı asla unutamaz.
4. **Data Sızması Koruması:** Bu mimari sayesinde A firmasındaki veri, asla B firmasının ekranında (API'sinde) görünemez.
