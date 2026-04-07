import type { EntityManager } from '@mikro-orm/core';
import { Seeder } from '@mikro-orm/seeder';
import { AdminSeeder } from './AdminSeeder';
import { MenuSeeder } from './MenuSeeder';

export class DatabaseSeeder extends Seeder {
  async run(em: EntityManager): Promise<void> {
    return this.call(em, [AdminSeeder, MenuSeeder]);
  }
}
