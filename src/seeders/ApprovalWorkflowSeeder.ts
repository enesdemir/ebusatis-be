import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import {
  ApprovalEntityType,
  ApprovalWorkflow,
} from '../modules/approvals/entities/approval-workflow.entity';
import { ApprovalStep } from '../modules/approvals/entities/approval-step.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * Seed default approval workflows for every tenant.
 *
 * PO_AMOUNT_BASED:
 *   < 10 000 USD     → USER (auto-approve, no step)
 *   10 000 – 50 000  → MANAGER
 *   ≥ 50 000         → GM
 *
 * SO_CREDIT_BASED:
 *   any over-limit   → MANAGER
 *
 * CLAIM_RESOLUTION:
 *   ≥ 5 000 USD      → MANAGER
 *
 * Idempotent: looks up by `(tenant, code)` before inserting.
 */
export class ApprovalWorkflowSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const tenants = await em.find(Tenant, {}, { filters: false });

    for (const tenant of tenants) {
      // Tenant scope per row — the @Filter('tenant') is `default: true`
      // so every entity lookup needs the current tenant id set first.
      em.setFilterParams('tenant', { tenantId: tenant.id });

      await this.seedWorkflow(em, tenant, {
        code: 'PO_AMOUNT_BASED',
        name: 'Purchase Order — Amount-Based Approval',
        entityType: ApprovalEntityType.PURCHASE_ORDER,
        description:
          'Routes PO approval based on grand total: <10K auto, 10-50K Manager, ≥50K GM',
        steps: [
          {
            stepOrder: 0,
            name: 'Manager Approval',
            minAmount: 10000,
            maxAmount: 50000,
            approverRoleCode: 'MANAGER',
            timeoutHours: 24,
          },
          {
            stepOrder: 1,
            name: 'GM Approval',
            minAmount: 50000,
            maxAmount: undefined,
            approverRoleCode: 'TENANT_ADMIN',
            timeoutHours: 48,
          },
        ],
      });

      await this.seedWorkflow(em, tenant, {
        code: 'SO_CREDIT_BASED',
        name: 'Sales Order — Credit-Limit Approval',
        entityType: ApprovalEntityType.SALES_ORDER,
        description:
          'Triggered when a SO would exceed the customer credit limit.',
        steps: [
          {
            stepOrder: 0,
            name: 'Credit Manager Approval',
            minAmount: 0,
            maxAmount: undefined,
            approverRoleCode: 'MANAGER',
            timeoutHours: 24,
          },
        ],
      });

      await this.seedWorkflow(em, tenant, {
        code: 'CLAIM_RESOLUTION',
        name: 'Supplier Claim — Resolution Approval',
        entityType: ApprovalEntityType.SUPPLIER_CLAIM,
        description: 'Required when settled amount of a claim ≥ 5 000.',
        steps: [
          {
            stepOrder: 0,
            name: 'Manager Approval',
            minAmount: 5000,
            maxAmount: undefined,
            approverRoleCode: 'MANAGER',
            timeoutHours: 48,
          },
        ],
      });
    }

    await em.flush();
  }

  private async seedWorkflow(
    em: EntityManager,
    tenant: Tenant,
    spec: {
      code: string;
      name: string;
      entityType: ApprovalEntityType;
      description?: string;
      steps: Array<{
        stepOrder: number;
        name: string;
        minAmount: number;
        maxAmount?: number;
        approverRoleCode?: string;
        approverGroupCode?: string;
        timeoutHours?: number;
        requireAll?: boolean;
      }>;
    },
  ) {
    let workflow = await em.findOne(ApprovalWorkflow, {
      tenant: tenant.id,
      code: spec.code,
    });
    if (!workflow) {
      workflow = em.create(ApprovalWorkflow, {
        tenant,
        code: spec.code,
        name: spec.name,
        entityType: spec.entityType,
        isActive: true,
        description: spec.description,
      } as never);
      em.persist(workflow);
    }

    // Reset / refresh step set.
    const existingSteps = await em.find(ApprovalStep, {
      workflow: workflow.id,
    });
    for (const s of existingSteps) em.remove(s);

    for (const step of spec.steps) {
      const row = em.create(ApprovalStep, {
        tenant,
        workflow,
        ...step,
      } as never);
      em.persist(row);
    }
  }
}
