import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { AdminSeeder } from './AdminSeeder';
import { PlatformConfigSeeder } from './PlatformConfigSeeder';
import { MenuSeeder } from './MenuSeeder';
import { ClassificationSeeder } from './ClassificationSeeder';
import { PilotSeeder } from './PilotSeeder';
import { ApprovalWorkflowSeeder } from './ApprovalWorkflowSeeder';
import { CarrierSeeder } from './CarrierSeeder';
import { WarehouseLocationSeeder } from './WarehouseLocationSeeder';
import { SalesOrderSampleSeeder } from './SalesOrderSampleSeeder';
import { AllocationDemoSeeder } from './AllocationDemoSeeder';
import { CrmSeeder } from './CrmSeeder';
import { SupplierProducerSeeder } from './SupplierProducerSeeder';

/**
 * DatabaseSeeder (Sprint 17).
 *
 * Execution order is load-bearing: foundational seeders (tenants,
 * users, menu, classifications, definitions) run first, then Pilot
 * creates Products + Partners + PO + GR + Shipment, then the
 * Sprint 17 additions layer SO + allocations + CRM + warehouse
 * locations + supplier portal token on top.
 */
export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [
      AdminSeeder,
      PlatformConfigSeeder,
      MenuSeeder,
      ClassificationSeeder,
      PilotSeeder,
      ApprovalWorkflowSeeder,
      CarrierSeeder,
      WarehouseLocationSeeder,
      SalesOrderSampleSeeder,
      AllocationDemoSeeder,
      CrmSeeder,
      SupplierProducerSeeder,
    ]);
  }
}
