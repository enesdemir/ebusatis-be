import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MikroORM, EntityManager } from '@mikro-orm/core';
import { AppModule } from '../../src/app.module';

/**
 * Full NestJS application bootstrap for integration / e2e tests.
 *
 * Creates a real app instance wired to the test database so that
 * entity filters, middleware and guards work exactly as they do in
 * production. Each test suite should call `TestApp.create()` in
 * `beforeAll` and `testApp.close()` in `afterAll`.
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
    // Mirror the same configuration as main.ts so that routes,
    // validation and interceptors behave identically in tests.
    instance.app.setGlobalPrefix('api');
    instance.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    await instance.app.init();

    instance.orm = instance.module.get(MikroORM);
    instance.em = instance.orm.em.fork();

    return instance;
  }

  /** Fork a fresh EntityManager (avoids identity-map collisions). */
  getEm(): EntityManager {
    return this.orm.em.fork();
  }

  /** Delete all rows from the given tables (in reverse order for FK safety). */
  async cleanTables(...tables: string[]): Promise<void> {
    const em = this.getEm();
    for (const table of tables.reverse()) {
      await em.getConnection().execute(`DELETE FROM "${table}"`);
    }
  }

  /** Shut down the application and close the ORM connection. */
  async close(): Promise<void> {
    await this.orm.close();
    await this.app.close();
  }
}
