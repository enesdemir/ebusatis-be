# Proje Contexti (AI Master Memory)

## 🎯 Projenin Amacı ve Vizyonu (GMPSeller Alternatifi)
Bu proje, **1C Enterprise (Adonis)** gibi köklü ancak hantal, sekme ve menü cehennemi olan masaüstü sistemlerinin yerini almayı hedefleyen **modern bir SaaS ERP/WMS/CRM** platformudur. Özel odak noktası **Tekstil ve Kumaş Topu (Dimensional Inventory)** yönetimidir.

## 🎨 UX/UI Felsefesi (Kritik Kurallar)
- **Aşırı Kolay Kullanım:** Arayüzler "Apple/Stripe" sadeliğinde olmalıdır.
- **Görev Odaklı (Task-Based) Tasarım:** CRUD odaklı değil, aksiyon odaklı (Örn: "Yeni Top Geldi", "Müşteriye Kumaş Kes") ekranlar tasarlanmalıdır.
- **Progressive Disclosure (Kademeli Güç):** Ekranda sadece en gerekli 3-4 alan gösterilir. Gelişmiş (1C tarzı yetenekler) ince ayarlar "Gelişmiş Seçenekler" butonuyla sağdan açılan Drawers (Off-canvas) veya Modal içinde sunulur.

## 🤖 AI Ajanları İçin Sistem Yönergeleri
İster kodu yazan ajan (Cursor, Antigravity vs.), ister uygulama içinde son kullanıcıya hizmet verecek olan In-App AI Agent olsun, bu kurallara ve özellik matrisine uymak zorundadır:
1. Bir soru geldiğinde önce `03-feature-matrix.md` dosyasına bakılıp özelliğin var olup olmadığı kontrol edilecek.
2. Eğer özellik sistemde yoksa, dürüstçe **"Bu özellik henüz sistemde yoktur."** denilecek.
3. Kullanıcıdan eksik özellikle ilgili detaylı workflow (nasıl çalışmalı, beklenti nedir) bilgisi alınacak.
4. Bu bilgi, teknik bir "Nasıl Yapılır?" planına (Implementasyon planı) dönüştürülüp `04-ai-memory-log.md` dosyasına eklenecektir.

## 🛠️ Teknik Yığın (Tech Stack)
- **Frontend:** React (TypeScript), TailwindCSS, Görev bazlı bileşenler (Radix/Shadcn UI mantığı), Zustang (Global State), React-Router.
- **Backend:** NestJS (TypeScript), MikroORM, PostgreSQL. DDD (Domain-Driven Design) standartları.
- **Standartlar:** `rule: nest-js.md` içeriğindeki adlandırma, servis, controller kuralları kesinlikle benimsenecektir.
