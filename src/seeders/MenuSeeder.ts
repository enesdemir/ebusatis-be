import { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { MenuNode, MenuScope } from '../modules/admin/entities/menu-node.entity';

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
      console.log(`MenuSeeder: ${existing} menu nodes already exist – skipping.`);
      return;
    }

    /* ─────────────────────────────────────────────────
     * TENANT SCOPE — Kademe yapısına uygun menü
     * App.tsx rotaları ile birebir eşleşir
     * ───────────────────────────────────────────────── */
    const tenantItems: MenuSeed[] = [
      {
        code: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard',
        path: '/dashboard', sortOrder: 0, scope: MenuScope.BOTH,
      },

      // ═══ KADEME 2: İŞ ORTAKLARI ═══
      {
        code: 'partners', label: 'İş Ortakları', icon: 'Users', sortOrder: 10, scope: MenuScope.TENANT,
        children: [
          { code: 'partners.list', label: 'Müşteri & Tedarikçi', path: '/partners', sortOrder: 0, scope: MenuScope.TENANT },
        ],
      },

      // ═══ KADEME 3: PIM (Ürün Bilgi Yönetimi) ═══
      {
        code: 'pim', label: 'Ürün Yönetimi', icon: 'Package', sortOrder: 20, scope: MenuScope.TENANT,
        children: [
          { code: 'pim.products', label: 'Ürün Listesi', path: '/pim/products', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'pim.products-new', label: 'Yeni Ürün', path: '/pim/products/new', sortOrder: 1, scope: MenuScope.TENANT },
        ],
      },

      // ═══ KADEME 4: WMS (Depo & Stok) ═══
      {
        code: 'wms', label: 'Depo & Stok', icon: 'Warehouse', sortOrder: 30, scope: MenuScope.TENANT,
        children: [
          { code: 'wms.inventory', label: 'Stok Listesi', path: '/wms/inventory', sortOrder: 0, scope: MenuScope.TENANT },
        ],
      },

      // ═══ KADEME 5: SİPARİŞLER ═══
      {
        code: 'orders', label: 'Siparişler', icon: 'ShoppingCart', sortOrder: 40, scope: MenuScope.TENANT,
        children: [
          { code: 'orders.sales', label: 'Satış Siparişleri', path: '/orders/sales', sortOrder: 0, scope: MenuScope.TENANT },
        ],
      },

      // ═══ KADEME 6: FİNANS ═══
      {
        code: 'finance', label: 'Finans', icon: 'CreditCard', sortOrder: 50, scope: MenuScope.TENANT,
        children: [
          { code: 'finance.invoices', label: 'Faturalar', path: '/finance/invoices', sortOrder: 0, scope: MenuScope.TENANT },
        ],
      },

      // ═══ KADEME 7: RAPORLAR ═══
      {
        code: 'reports', label: 'Raporlama', icon: 'BarChart3', sortOrder: 60, scope: MenuScope.TENANT,
        children: [
          { code: 'reports.index', label: 'Rapor Paneli', path: '/reports', sortOrder: 0, scope: MenuScope.TENANT },
        ],
      },

      // ═══ AYARLAR (KADEME 1 tanımları + IAM + EAV) ═══
      {
        code: 'settings', label: 'Ayarlar', icon: 'Settings', sortOrder: 200, scope: MenuScope.TENANT, hasDivider: true,
        children: [
          // Kademe 1: Tanım yönetimi
          {
            code: 'settings.definitions', label: 'Tanımlar', icon: 'Database', sortOrder: 0, scope: MenuScope.TENANT,
            children: [
              { code: 'settings.definitions.units', label: 'Birimler', path: '/settings/definitions/units', sortOrder: 0, scope: MenuScope.TENANT },
              { code: 'settings.definitions.currencies', label: 'Para Birimleri', path: '/settings/definitions/currencies', sortOrder: 1, scope: MenuScope.TENANT },
              { code: 'settings.definitions.warehouses', label: 'Depolar', path: '/settings/definitions/warehouses', sortOrder: 2, scope: MenuScope.TENANT },
              { code: 'settings.definitions.tax-rates', label: 'Vergi Oranları', path: '/settings/definitions/tax-rates', sortOrder: 3, scope: MenuScope.TENANT },
              { code: 'settings.definitions.tags', label: 'Etiketler', path: '/settings/definitions/tags', sortOrder: 4, scope: MenuScope.TENANT },
              { code: 'settings.definitions.statuses', label: 'Durumlar', path: '/settings/definitions/statuses', sortOrder: 5, scope: MenuScope.TENANT },
              { code: 'settings.definitions.payment-methods', label: 'Ödeme Yöntemleri', path: '/settings/definitions/payment-methods', sortOrder: 6, scope: MenuScope.TENANT },
              { code: 'settings.definitions.delivery-methods', label: 'Teslimat Yöntemleri', path: '/settings/definitions/delivery-methods', sortOrder: 7, scope: MenuScope.TENANT },
            ],
          },
          { code: 'settings.attributes', label: 'Özellikler (EAV)', path: '/settings/attributes', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'settings.roles', label: 'Roller & Yetkiler', path: '/settings/roles', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'settings.users', label: 'Kullanıcılar', path: '/settings/users', sortOrder: 3, scope: MenuScope.TENANT },
        ],
      },
    ];

    /* ─────────────────────────────────────────────────
     * PLATFORM SCOPE — SuperAdmin menüsü
     * ───────────────────────────────────────────────── */
    const platformItems: MenuSeed[] = [
      {
        code: 'admin-dashboard', label: 'Platform Dashboard', icon: 'LayoutDashboard',
        path: '/dashboard', sortOrder: 0, scope: MenuScope.PLATFORM,
      },
      {
        code: 'tenants', label: 'Tenant Yönetimi', icon: 'Building2', sortOrder: 10, scope: MenuScope.PLATFORM,
        children: [
          { code: 'tenants.list', label: 'Tenant Listesi', path: '/tenants', sortOrder: 0, scope: MenuScope.PLATFORM },
          { code: 'tenants.new', label: 'Yeni Tenant', path: '/tenants/new', sortOrder: 1, scope: MenuScope.PLATFORM },
        ],
      },
      {
        code: 'iam', label: 'Erişim & Yetki', icon: 'Shield', sortOrder: 20, scope: MenuScope.PLATFORM,
        children: [
          { code: 'iam.permissions', label: 'İzin Tanımları', path: '/admin/permissions', sortOrder: 0, scope: MenuScope.PLATFORM },
          { code: 'iam.categories', label: 'Yetki Kategorileri', path: '/admin/permission-categories', sortOrder: 1, scope: MenuScope.PLATFORM },
          { code: 'iam.global-roles', label: 'Rol Şablonları', path: '/admin/global-roles', sortOrder: 2, scope: MenuScope.PLATFORM },
        ],
      },
      {
        code: 'platform-users', label: 'Platform Kullanıcıları', icon: 'UserCog', sortOrder: 30, scope: MenuScope.PLATFORM,
        children: [
          { code: 'platform-users.all', label: 'Tüm Kullanıcılar', path: '/admin/users', sortOrder: 0, scope: MenuScope.PLATFORM },
          { code: 'platform-users.audit', label: 'Oturum Logları', path: '/admin/audit-logs', sortOrder: 1, scope: MenuScope.PLATFORM },
        ],
      },
      {
        code: 'platform-config', label: 'Platform Ayarları', icon: 'Globe', sortOrder: 40, scope: MenuScope.PLATFORM,
        children: [
          { code: 'platform-config.general', label: 'Genel Ayarlar', path: '/admin/config', sortOrder: 0, scope: MenuScope.PLATFORM },
          { code: 'platform-config.modules', label: 'Modül Yönetimi', path: '/admin/modules', sortOrder: 1, scope: MenuScope.PLATFORM },
          { code: 'platform-config.plans', label: 'Abonelik Planları', path: '/admin/plans', sortOrder: 2, scope: MenuScope.PLATFORM },
        ],
      },
      {
        code: 'admin-reports', label: 'Platform Raporları', icon: 'BarChart3', sortOrder: 50, scope: MenuScope.PLATFORM,
        children: [
          { code: 'admin-reports.tenants', label: 'Tenant İstatistikleri', path: '/admin/reports/tenants', sortOrder: 0, scope: MenuScope.PLATFORM },
          { code: 'admin-reports.health', label: 'Sistem Sağlığı', path: '/admin/reports/health', sortOrder: 1, scope: MenuScope.PLATFORM },
          { code: 'admin-reports.usage', label: 'Kullanım Raporları', path: '/admin/reports/usage', sortOrder: 2, scope: MenuScope.PLATFORM },
        ],
      },
    ];

    const allSeeds = [...tenantItems, ...platformItems];
    await this.seedNodes(em, allSeeds, undefined);
    await em.flush();
    console.log('MenuSeeder: menu nodes created successfully.');
  }

  private async seedNodes(em: EntityManager, items: MenuSeed[], parent?: MenuNode): Promise<void> {
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
