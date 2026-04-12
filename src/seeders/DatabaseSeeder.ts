import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { AdminSeeder } from './AdminSeeder';
import { PlatformConfigSeeder } from './PlatformConfigSeeder';
import { MenuSeeder } from './MenuSeeder';
import { ClassificationSeeder } from './ClassificationSeeder';
import { PilotSeeder } from './PilotSeeder';
import { ApprovalWorkflowSeeder } from './ApprovalWorkflowSeeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [
      AdminSeeder,
      PlatformConfigSeeder,
      MenuSeeder,
      ClassificationSeeder,
      PilotSeeder,
      ApprovalWorkflowSeeder,
    ]);
  }
}
