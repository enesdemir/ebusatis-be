import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { AppModule } from '../../src/app.module';

/**
 * Test uygulamasi olusturucu.
 * Her test suite icin temiz bir NestJS app + DB baglantisi saglar.
 */
export class TestApp {
  app: INestApplication;
  module: TestingModule;
  orm: MikroORM;
  em: EntityManager;

  static async create(): Promise<TestApp> {
    const instance = new TestApp();

    instance.module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    instance.app = instance.module.createNestApplication();
    instance.app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await instance.app.init();

    instance.orm = instance.module.get(MikroORM);
    instance.em = instance.orm.em.fork();

    return instance;
  }

  /** Temiz EntityManager fork'u al */
  getEm(): EntityManager {
    return this.orm.em.fork();
  }

  /** Belirli tablolari temizle */
  async cleanTables(...tables: string[]): Promise<void> {
    const em = this.getEm();
    for (const table of tables.reverse()) {
      await em.getConnection().execute(`DELETE FROM "${table}"`);
    }
  }

  /** Uygulamayi kapat */
  async close(): Promise<void> {
    await this.orm.close();
    await this.app.close();
  }
}
