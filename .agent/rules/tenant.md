---
description: How to handle Tenant Data Isolation in NestJS
---

# Multi-Tenant (SaaS) Kodlama Standartları

Bu kural seti, projenin SaaS veri yalıtım (Data Isolation) güvenliğini korumak içindir ve ASLA ihlal edilmemelidir.

## 1. Veritabanı Tabloları (Entities)
Projeye yeni eklenen her operasyonel varlık (Örn: Order, Invoice, Product, Material) zorunlu olarak Tenant tablosuna bağlı olmalıdır. Yeni bir entity oluşturduğunuzda şu işlemi yapmalısınız:
```typescript
@ManyToOne(() => Tenant)
tenant: Tenant;
```

## 2. Global MikroORM Filtreleri
Tüm operasyonel Entity'lerin en tepesine, NestJS AsyncLocalStorage üzerinden tenantId okuyacak bir `@Filter` eklenmelidir. Asla SQL sorgularında (Service katmanında) manuel `where: { tenant: req.user.tenantId }` yazmayınız! MikroORM bu işi global filtrelerle çözmelidir.

## 3. Servis Katmanı (Service Scope)
`@Injectable()` servislerde, geçerli Tenant ID'sine ihtiyacınız varsa argüman olarak fonksiyonlara taşımayın (Prop drilling yapmayın). Daima `TenantContext.getTenantId()` şeklinde merkezi ALS üzerinden değeri çağırın.

## 4. Kaydetme İşlemleri (Create)
Yeni bir satır oluştururken (Örn: `em.create(Product, data)`), Lifecycle Hook (`@BeforeCreate`) veya Service katmanı kullanılarak context üzerinden tenant referansı otomatik olarak atanmalıdır.
