import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  MenuNode,
  MenuScope,
} from '../modules/admin/entities/menu-node.entity';

interface MenuSeed {
  code: string;
  label: string;
  icon?: string;
  path?: string;
  sortOrder: number;
  scope: MenuScope;
  hasDivider?: boolean;
  requiredPermission?: string;
  children?: MenuSeed[];
}

export class MenuSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const existing = await em.count(MenuNode, {});
    if (existing > 0) {
      console.log(
        `MenuSeeder: ${existing} menu nodes already exist – skipping.`,
      );
      return;
    }

    /* ─────────────────────────────────────────────────
     * TENANT SCOPE — Kademe yapısına uygun menü
     * App.tsx rotaları ile birebir eşleşir
     * ───────────────────────────────────────────────── */
    const tenantItems: MenuSeed[] = [
      // ── Dashboard ──
      {
        code: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        path: '/dashboard',
        sortOrder: 0,
        scope: MenuScope.BOTH,
      },

      // ── İş Ortakları & Satınalma ──
      {
        code: 'partners',
        label: 'Tedarikçi & Satınalma',
        icon: 'Users',
        sortOrder: 10,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'partners.list',
            label: 'Müşteri & Tedarikçi',
            path: '/partners',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'partners.new',
            label: 'Yeni İş Ortağı',
            path: '/partners/new',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'partners.rfq',
            label: 'RFQ Yönetimi',
            path: '/sourcing/rfq',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
          {
            code: 'partners.compare',
            label: 'Teklif Karşılaştırma',
            path: '/sourcing/compare',
            sortOrder: 3,
            scope: MenuScope.TENANT,
          },
          {
            code: 'partners.purchase',
            label: 'Satınalma Siparişleri',
            path: '/orders/purchase',
            sortOrder: 4,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Ürün Yönetimi (PIM) ──
      {
        code: 'pim',
        label: 'Ürün Yönetimi',
        icon: 'Package',
        sortOrder: 20,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'pim.products',
            label: 'Ürün Listesi',
            path: '/pim/products',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'pim.new',
            label: 'Yeni Ürün',
            path: '/pim/products/new',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Üretim Takibi ──
      {
        code: 'production',
        label: 'Üretim Takibi',
        icon: 'Factory',
        sortOrder: 30,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'production.orders',
            label: 'Üretim Siparişleri',
            path: '/production',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'production.milestones',
            label: 'Milestone Takibi',
            path: '/production/milestones',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'production.qc',
            label: 'Kalite Kontrol',
            path: '/production/qc',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
          {
            code: 'production.media',
            label: 'Medya & Dosyalar',
            path: '/production/media',
            sortOrder: 3,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Lojistik ──
      {
        code: 'logistics',
        label: 'Lojistik',
        icon: 'Truck',
        sortOrder: 40,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'logistics.plans',
            label: 'Sevkiyat Planları',
            path: '/logistics',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'logistics.quotes',
            label: 'Nakliye Teklifi',
            path: '/logistics/quotes',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'logistics.customs',
            label: 'Gümrük & Evrak',
            path: '/logistics/customs',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
          {
            code: 'logistics.tracking',
            label: 'Konteyner Takibi',
            path: '/logistics/tracking',
            sortOrder: 3,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Depo & Stok (WMS) ──
      {
        code: 'wms',
        label: 'Depo & Stok',
        icon: 'Warehouse',
        sortOrder: 50,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'wms.inbound',
            label: 'Inbound Planlama',
            path: '/wms/inbound',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'wms.receiving',
            label: 'Mal Kabul',
            path: '/wms/receiving',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'wms.count',
            label: 'Sayım & QC',
            path: '/wms/count',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
          {
            code: 'wms.inventory',
            label: 'Stok Kartları',
            path: '/wms/inventory',
            sortOrder: 3,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // Satış Kanalları şimdilik devre dışı — ileride aktif edilecek

      // ── Sipariş & Sevkiyat ──
      {
        code: 'orders',
        label: 'Sipariş & Sevkiyat',
        icon: 'Package',
        sortOrder: 70,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'orders.sales',
            label: 'Satış Siparişleri',
            path: '/orders/sales',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'orders.new',
            label: 'Yeni Sipariş',
            path: '/orders/sales/new',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'orders.labels',
            label: 'Kargo Etiketi',
            path: '/orders/labels',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
          {
            code: 'orders.packing',
            label: 'Paketleme',
            path: '/orders/packing',
            sortOrder: 3,
            scope: MenuScope.TENANT,
          },
          {
            code: 'orders.delivery',
            label: 'Teslimat Durumu',
            path: '/orders/delivery',
            sortOrder: 4,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Cari & Finans ──
      {
        code: 'finance',
        label: 'Cari & Finans',
        icon: 'CreditCard',
        sortOrder: 80,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'finance.invoices',
            label: 'Faturalar',
            path: '/finance/invoices',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'finance.payments',
            label: 'Tahsilat / Ödeme',
            path: '/finance/payments',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'finance.reconciliation',
            label: 'Vade & Mutabakat',
            path: '/finance/reconciliation',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Muhasebe ──
      {
        code: 'accounting',
        label: 'Muhasebe',
        icon: 'Calculator',
        sortOrder: 90,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'accounting.costs',
            label: 'Stok Maliyetleri',
            path: '/accounting/costs',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
          {
            code: 'accounting.exchange',
            label: 'Kur Farkı',
            path: '/accounting/exchange',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'accounting.tax',
            label: 'KDV & Gümrük',
            path: '/accounting/tax',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Raporlama ──
      {
        code: 'reports',
        label: 'Raporlama',
        icon: 'BarChart3',
        sortOrder: 100,
        scope: MenuScope.TENANT,
        children: [
          {
            code: 'reports.index',
            label: 'Rapor Paneli',
            path: '/reports',
            sortOrder: 0,
            scope: MenuScope.TENANT,
          },
        ],
      },

      // ── Ayarlar ──
      {
        code: 'settings',
        label: 'Ayarlar',
        icon: 'Settings',
        sortOrder: 200,
        scope: MenuScope.TENANT,
        hasDivider: true,
        children: [
          {
            code: 'settings.definitions',
            label: 'Tanımlar',
            icon: 'Database',
            sortOrder: 0,
            scope: MenuScope.TENANT,
            children: [
              {
                code: 'settings.definitions.units',
                label: 'Birimler',
                path: '/settings/definitions/units',
                sortOrder: 0,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.currencies',
                label: 'Para Birimleri',
                path: '/settings/definitions/currencies',
                sortOrder: 1,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.warehouses',
                label: 'Depolar',
                path: '/settings/definitions/warehouses',
                sortOrder: 2,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.tax-rates',
                label: 'Vergi Oranları',
                path: '/settings/definitions/tax-rates',
                sortOrder: 3,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.tags',
                label: 'Etiketler',
                path: '/settings/definitions/tags',
                sortOrder: 4,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.statuses',
                label: 'Durumlar',
                path: '/settings/definitions/statuses',
                sortOrder: 5,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.payment-methods',
                label: 'Ödeme Yöntemleri',
                path: '/settings/definitions/payment-methods',
                sortOrder: 6,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.delivery-methods',
                label: 'Teslimat Yöntemleri',
                path: '/settings/definitions/delivery-methods',
                sortOrder: 7,
                scope: MenuScope.TENANT,
              },
              {
                code: 'settings.definitions.categories',
                label: 'Kategoriler',
                path: '/settings/definitions/categories',
                sortOrder: 8,
                scope: MenuScope.TENANT,
              },
            ],
          },
          {
            code: 'settings.attributes',
            label: 'Özellikler (EAV)',
            path: '/settings/attributes',
            sortOrder: 1,
            scope: MenuScope.TENANT,
          },
          {
            code: 'settings.roles',
            label: 'Roller & Yetkiler',
            path: '/settings/roles',
            sortOrder: 2,
            scope: MenuScope.TENANT,
          },
          {
            code: 'settings.users',
            label: 'Kullanıcılar',
            path: '/settings/users',
            sortOrder: 3,
            scope: MenuScope.TENANT,
          },
        ],
      },
    ];

    /* ─────────────────────────────────────────────────
     * PLATFORM SCOPE — SuperAdmin menüsü
     * ───────────────────────────────────────────────── */
    const platformItems: MenuSeed[] = [
      {
        code: 'admin-dashboard',
        label: 'Platform Dashboard',
        icon: 'LayoutDashboard',
        path: '/dashboard',
        sortOrder: 0,
        scope: MenuScope.PLATFORM,
      },
      {
        code: 'tenants',
        label: 'Tenant Yönetimi',
        icon: 'Building2',
        sortOrder: 10,
        scope: MenuScope.PLATFORM,
        children: [
          {
            code: 'tenants.list',
            label: 'Tenant Listesi',
            path: '/tenants',
            sortOrder: 0,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'tenants.new',
            label: 'Yeni Tenant',
            path: '/tenants/new',
            sortOrder: 1,
            scope: MenuScope.PLATFORM,
          },
        ],
      },
      {
        code: 'iam',
        label: 'Erişim & Yetki',
        icon: 'Shield',
        sortOrder: 20,
        scope: MenuScope.PLATFORM,
        children: [
          {
            code: 'iam.permissions',
            label: 'İzin Tanımları',
            path: '/admin/permissions',
            sortOrder: 0,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'iam.categories',
            label: 'Yetki Kategorileri',
            path: '/admin/permission-categories',
            sortOrder: 1,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'iam.global-roles',
            label: 'Rol Şablonları',
            path: '/admin/global-roles',
            sortOrder: 2,
            scope: MenuScope.PLATFORM,
          },
        ],
      },
      {
        code: 'platform-users',
        label: 'Platform Kullanıcıları',
        icon: 'UserCog',
        sortOrder: 30,
        scope: MenuScope.PLATFORM,
        children: [
          {
            code: 'platform-users.all',
            label: 'Tüm Kullanıcılar',
            path: '/admin/users',
            sortOrder: 0,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'platform-users.audit',
            label: 'Oturum Logları',
            path: '/admin/audit-logs',
            sortOrder: 1,
            scope: MenuScope.PLATFORM,
          },
        ],
      },
      {
        code: 'platform-config',
        label: 'Platform Ayarları',
        icon: 'Globe',
        sortOrder: 40,
        scope: MenuScope.PLATFORM,
        children: [
          {
            code: 'platform-config.general',
            label: 'Genel Ayarlar',
            path: '/admin/config',
            sortOrder: 0,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'platform-config.modules',
            label: 'Modül Yönetimi',
            path: '/admin/modules',
            sortOrder: 1,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'platform-config.plans',
            label: 'Abonelik Planları',
            path: '/admin/plans',
            sortOrder: 2,
            scope: MenuScope.PLATFORM,
          },
        ],
      },
      {
        code: 'admin-reports',
        label: 'Platform Raporları',
        icon: 'BarChart3',
        sortOrder: 50,
        scope: MenuScope.PLATFORM,
        children: [
          {
            code: 'admin-reports.tenants',
            label: 'Tenant İstatistikleri',
            path: '/admin/reports/tenants',
            sortOrder: 0,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'admin-reports.health',
            label: 'Sistem Sağlığı',
            path: '/admin/reports/health',
            sortOrder: 1,
            scope: MenuScope.PLATFORM,
          },
          {
            code: 'admin-reports.usage',
            label: 'Kullanım Raporları',
            path: '/admin/reports/usage',
            sortOrder: 2,
            scope: MenuScope.PLATFORM,
          },
        ],
      },
    ];

    const allSeeds = [...tenantItems, ...platformItems];
    await this.seedNodes(em, allSeeds, undefined);
    await em.flush();
    console.log('MenuSeeder: menu nodes created successfully.');
  }

  private async seedNodes(
    em: EntityManager,
    items: MenuSeed[],
    parent?: MenuNode,
  ): Promise<void> {
    for (const item of items) {
      const node = new MenuNode(item.code, item.label, item.scope);
      node.icon = item.icon;
      node.path = item.path;
      node.sortOrder = item.sortOrder;
      node.hasDivider = item.hasDivider ?? false;
      node.requiredPermission = item.requiredPermission;
      node.parent = parent;
      em.persist(node);
      if (item.children?.length) {
        await this.seedNodes(em, item.children, node);
      }
    }
  }
}
