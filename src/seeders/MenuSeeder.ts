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

    const tenantItems: MenuSeed[] = [
      {
        code: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard',
        path: '/dashboard', sortOrder: 0, scope: MenuScope.BOTH,
      },
      {
        code: 'product-radar', label: 'Ürün Radar', icon: 'Search', sortOrder: 10, scope: MenuScope.TENANT,
        children: [
          { code: 'product-radar.list', label: 'Radar Listesi', path: '/product-radar', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'product-radar.new', label: 'Yeni Ürün', path: '/product-radar/new', sortOrder: 1, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'supplier', label: 'Tedarikçi & Satınalma', icon: 'Users', sortOrder: 20, scope: MenuScope.TENANT,
        children: [
          { code: 'supplier.list', label: 'Tedarikçi Listesi', path: '/suppliers', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'supplier.new', label: 'Yeni Tedarikçi', path: '/suppliers/new', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'supplier.rfq', label: 'RFQ Yönetimi', path: '/rfq', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'supplier.compare', label: 'Teklif Karşılaştırma', path: '/quotations/compare', sortOrder: 3, scope: MenuScope.TENANT },
          { code: 'supplier.po', label: 'Satınalma Siparişleri', path: '/po', sortOrder: 4, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'production', label: 'Üretim Takibi', icon: 'Factory', sortOrder: 30, scope: MenuScope.TENANT,
        children: [
          { code: 'production.orders', label: 'Üretim Siparişleri', path: '/production', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'production.milestones', label: 'Milestone Takibi', path: '/production/milestones', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'production.qc', label: 'Kalite Kontrol', path: '/production/qc', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'production.media', label: 'Medya & Dosyalar', path: '/production/media', sortOrder: 3, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'logistics', label: 'Lojistik', icon: 'Truck', sortOrder: 40, scope: MenuScope.TENANT,
        children: [
          { code: 'logistics.plans', label: 'Sevkiyat Planları', path: '/logistics', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'logistics.quotes', label: 'Teklif Karşılaştırma', path: '/logistics/quotes', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'logistics.customs', label: 'Gümrük & Evrak', path: '/logistics/customs', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'logistics.tracking', label: 'Konteyner Takibi', path: '/logistics/tracking', sortOrder: 3, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'warehouse', label: 'Depo & Stok', icon: 'Warehouse', sortOrder: 50, scope: MenuScope.TENANT,
        children: [
          { code: 'warehouse.inbound', label: 'Inbound Planlama', path: '/warehouse/inbound', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'warehouse.receiving', label: 'Depo Kabul', path: '/warehouse/receiving', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'warehouse.count', label: 'Sayım & QC', path: '/warehouse/count', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'warehouse.stock', label: 'Stok Kartları', path: '/warehouse/stock', sortOrder: 3, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'sales-channels', label: 'Satış Kanalları', icon: 'ShoppingCart', sortOrder: 60, scope: MenuScope.TENANT,
        children: [
          { code: 'sales-channels.manage', label: 'Kanal Yönetimi', path: '/sales-channels', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'sales-channels.mapping', label: 'Ürün Eşleştirme', path: '/sales-channels/mapping', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'sales-channels.sync', label: 'Fiyat & Stok Sync', path: '/sales-channels/sync', sortOrder: 2, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'orders', label: 'Sipariş & Sevkiyat', icon: 'Package', sortOrder: 70, scope: MenuScope.TENANT,
        children: [
          { code: 'orders.list', label: 'Sipariş Havuzu', path: '/orders', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'orders.labels', label: 'Kargo Etiketi', path: '/orders/labels', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'orders.packing', label: 'Paketleme', path: '/orders/packing', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'orders.delivery', label: 'Teslimat Durumu', path: '/orders/delivery', sortOrder: 3, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'finance', label: 'Cari & Finans', icon: 'CreditCard', sortOrder: 80, scope: MenuScope.TENANT,
        children: [
          { code: 'finance.accounts', label: 'Cari Kartlar', path: '/finance/accounts', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'finance.transactions', label: 'Tahsilat / Ödeme', path: '/finance/transactions', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'finance.reconciliation', label: 'Vade & Mutabakat', path: '/finance/reconciliation', sortOrder: 2, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'accounting', label: 'Muhasebe', icon: 'Calculator', sortOrder: 90, scope: MenuScope.TENANT,
        children: [
          { code: 'accounting.invoices', label: 'Faturalar', path: '/accounting/invoices', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'accounting.costs', label: 'Stok Maliyetleri', path: '/accounting/costs', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'accounting.exchange', label: 'Kur Farkı', path: '/accounting/exchange', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'accounting.tax', label: 'KDV & Gümrük', path: '/accounting/tax', sortOrder: 3, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'reports', label: 'Raporlama', icon: 'BarChart3', sortOrder: 100, scope: MenuScope.TENANT,
        children: [
          { code: 'reports.dashboard', label: 'Dashboard', path: '/reports', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'reports.profitability', label: 'Ürün Kârlılığı', path: '/reports/profitability', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'reports.channels', label: 'Kanal Performansı', path: '/reports/channels', sortOrder: 2, scope: MenuScope.TENANT },
          { code: 'reports.supplier-sla', label: 'Tedarikçi SLA', path: '/reports/supplier-sla', sortOrder: 3, scope: MenuScope.TENANT },
          { code: 'reports.inventory-turnover', label: 'Stok Devir Hızı', path: '/reports/inventory-turnover', sortOrder: 4, scope: MenuScope.TENANT },
        ],
      },
      {
        code: 'settings', label: 'Ayarlar', icon: 'Settings', sortOrder: 200, scope: MenuScope.TENANT, hasDivider: true,
        children: [
          { code: 'settings.users', label: 'Kullanıcılar', path: '/settings/users', sortOrder: 0, scope: MenuScope.TENANT },
          { code: 'settings.roles', label: 'Roller & Yetkiler', path: '/settings/roles', sortOrder: 1, scope: MenuScope.TENANT },
          { code: 'settings.attributes', label: 'Özellikler (EAV)', path: '/settings/attributes', sortOrder: 2, scope: MenuScope.TENANT },
        ],
      },
    ];

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
