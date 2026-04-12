import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { TenantContext } from './common/context/tenant.context';

const EMPTY_TENANT = '00000000-0000-0000-0000-000000000000';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── MikroORM RequestContext ──
  // Express seviyesinde kayıt → Guards, Interceptors, Controllers hepsinden ÖNCE çalışır.
  // forMiddleware() yerine manuel kayıt, çünkü forMiddleware() sıralama garantisi vermiyor.
  const orm = app.get(MikroORM);
  app.use((req: Request, _res: Response, next: NextFunction) => {
    RequestContext.create(orm.em, () => {
      // Tenant filter: fork'lanmış EM'ye set et
      const tenantId = req.headers['x-tenant-id'] as string;
      const em = RequestContext.getEntityManager()!;
      em.setFilterParams('tenant', {
        tenantId: tenantId || EMPTY_TENANT,
      });

      if (tenantId) {
        TenantContext.run(tenantId, () => next());
      } else {
        next();
      }
    });
  });

  // ── Security: Helmet (HTTP security headers) ──
  app.use(helmet());

  // ── Security: CORS (restrict origins) ──
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id'],
    credentials: true,
    maxAge: 86400, // 24h preflight cache
  });

  // ── API prefix ──
  app.setGlobalPrefix('api');

  // ── Validation ──
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // ── Response envelope & error handling ──
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Request body size limits ──
  // JSON: 1MB (default), configured via express
  // Multipart will be handled per-endpoint (e.g. file upload)

  const port = process.env.PORT || 3281;
  await app.listen(port);
  console.log(`🚀 EBusatis API running on http://localhost:${port}/api`);
}

bootstrap();
