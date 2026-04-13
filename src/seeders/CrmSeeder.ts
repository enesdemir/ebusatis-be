import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { Fair, FairStatus } from '../modules/crm/entities/fair.entity';
import { FairParticipant } from '../modules/crm/entities/fair-participant.entity';
import { Lead, LeadStage } from '../modules/crm/entities/lead.entity';
import { LeadSource } from '../modules/crm/entities/lead-source.entity';
import {
  PhysicalSample,
  SampleStatus,
  SampleType,
} from '../modules/products/entities/physical-sample.entity';
import { SampleLoanHistory } from '../modules/products/entities/sample-loan-history.entity';
import { Product } from '../modules/products/entities/product.entity';
import {
  Partner,
  PartnerType,
} from '../modules/partners/entities/partner.entity';
import { Tenant } from '../modules/tenants/entities/tenant.entity';

/**
 * CrmSeeder (Sprint 17).
 *
 * Seeds one active fair with 5 participants, one lead per kanban stage
 * (NEW/QUALIFIED/PROPOSAL/WON/LOST), 2 lead sources, and 5 physical
 * samples (3 IN_STOCK + 2 LENT with loan history).
 *
 * Idempotent — looks up by code / sampleCode before inserting.
 */
export class CrmSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    const tenants = await em.find(Tenant, {}, { filters: false });

    for (const tenant of tenants) {
      em.setFilterParams('tenant', { tenantId: tenant.id });

      // LeadSource lookup
      const sources: LeadSource[] = [];
      for (const spec of [
        { code: 'FAIR', name: 'Fuar' },
        { code: 'WEB_FORM', name: 'Web Formu' },
      ]) {
        let src = await em.findOne(
          LeadSource,
          { tenant: tenant.id, code: spec.code },
          { filters: false },
        );
        if (!src) {
          src = em.create(LeadSource, {
            tenant,
            ...spec,
          } as unknown as LeadSource);
          em.persist(src);
        }
        sources.push(src);
      }

      // Fair
      let fair = await em.findOne(
        Fair,
        { tenant: tenant.id, name: 'Textile Expo 2026' },
        { filters: false },
      );
      if (!fair) {
        const start = new Date();
        start.setDate(start.getDate() - 3);
        const end = new Date();
        end.setDate(end.getDate() + 2);
        fair = em.create(Fair, {
          tenant,
          name: 'Textile Expo 2026',
          venue: 'Istanbul Expo Center',
          city: 'Istanbul',
          country: 'TR',
          startDate: start,
          endDate: end,
          status: FairStatus.ACTIVE,
          budget: 25000,
          currency: 'USD',
        } as unknown as Fair);
        em.persist(fair);

        for (let i = 1; i <= 5; i++) {
          em.persist(
            em.create(FairParticipant, {
              tenant,
              fair,
              fullName: `Visitor ${i}`,
              company: `Acme ${i} Ltd.`,
              email: `visitor${i}@example.com`,
              phone: `+90 555 000 000${i}`,
            } as unknown as FairParticipant),
          );
        }
      }

      // Leads — one per stage
      const stages: LeadStage[] = [
        LeadStage.NEW,
        LeadStage.QUALIFIED,
        LeadStage.PROPOSAL,
        LeadStage.WON,
        LeadStage.LOST,
      ];
      for (let i = 0; i < stages.length; i++) {
        const fullName = `Lead-${stages[i]} ${i + 1}`;
        const exists = await em.findOne(
          Lead,
          { tenant: tenant.id, fullName },
          { filters: false },
        );
        if (exists) continue;
        em.persist(
          em.create(Lead, {
            tenant,
            fullName,
            company: `Prospect ${i + 1} Co.`,
            email: `lead${i + 1}@example.com`,
            phone: `+90 555 111 000${i}`,
            stage: stages[i],
            estimatedValue: 5000 * (i + 1),
            currency: 'USD',
            source: sources[i % sources.length],
            fair: i < 2 ? fair : undefined,
          } as unknown as Lead),
        );
      }

      // Physical samples
      const product = await em.findOne(
        Product,
        { tenant: tenant.id },
        { filters: false },
      );
      const customer = await em.findOne(
        Partner,
        { tenant: tenant.id, types: { $contains: [PartnerType.CUSTOMER] } },
        { filters: false },
      );
      if (product) {
        for (let i = 1; i <= 5; i++) {
          const code = `SMP-DEMO-${String(i).padStart(3, '0')}`;
          const existing = await em.findOne(
            PhysicalSample,
            { tenant: tenant.id, sampleCode: code },
            { filters: false },
          );
          if (existing) continue;
          const lent = i >= 4 && !!customer;
          const sample = em.create(PhysicalSample, {
            tenant,
            sampleCode: code,
            product,
            type: SampleType.SWATCH,
            status: lent ? SampleStatus.LENT : SampleStatus.IN_STOCK,
            currentHolder: lent ? customer : undefined,
          } as unknown as PhysicalSample);
          em.persist(sample);
          if (lent) {
            const lentAt = new Date();
            lentAt.setDate(lentAt.getDate() - 7);
            const expected = new Date();
            expected.setDate(expected.getDate() - 1); // overdue
            em.persist(
              em.create(SampleLoanHistory, {
                tenant,
                sample,
                lentToPartner: customer,
                lentAt,
                expectedReturnDate: expected,
              } as unknown as SampleLoanHistory),
            );
          }
        }
      }
    }

    await em.flush();
  }
}
