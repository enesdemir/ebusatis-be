import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import config from './mikro-orm.config';
import { IamModule } from './modules/iam/iam.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AdminModule } from './modules/admin/admin.module';
import { DefinitionsModule } from './modules/definitions/definitions.module';
import { PartnersModule } from './modules/partners/partners.module';
import { OrdersModule } from './modules/orders/orders.module';
import { FinanceModule } from './modules/finance/finance.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ClassificationsModule } from './modules/classifications/classifications.module';
import { ProductionModule } from './modules/production/production.module';
import { LogisticsModule } from './modules/logistics/logistics.module';
import { SourcingModule } from './modules/sourcing/sourcing.module';
import { SalesChannelsModule } from './modules/sales-channels/sales-channels.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { StorageModule } from './modules/storage/storage.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { DocumentsModule } from './modules/documents/documents.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { SupplierPortalModule } from './modules/supplier-portal/supplier-portal.module';
import { CrmModule } from './modules/crm/crm.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MikroOrmModule.forRoot(config),
    // RequestContext artık main.ts'de Express seviyesinde oluşturuluyor (Guards dahil her yerde çalışsın diye)
    // Rate Limiting: 60 requests per 60 seconds (per IP)
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '60', 10),
      },
    ]),
    AuthModule,
    IamModule,
    UsersModule,
    TenantsModule,
    ProductsModule,
    InventoryModule,
    AdminModule,
    DefinitionsModule,
    PartnersModule,
    OrdersModule,
    FinanceModule,
    ReportsModule,
    ClassificationsModule,
    ProductionModule,
    LogisticsModule,
    SourcingModule,
    SalesChannelsModule,
    AccountingModule,
    StorageModule,
    NotificationsModule,
    DocumentsModule,
    ApprovalsModule,
    SupplierPortalModule,
    CrmModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Apply rate limiting globally to all endpoints
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
