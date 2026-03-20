import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Security: Helmet (HTTP security headers) ──
  app.use(helmet());

  // ── Security: CORS (restrict origins) ──
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim());

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
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

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
