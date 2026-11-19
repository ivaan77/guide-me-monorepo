import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Express defaults to a 100kb JSON body, which excursions outgrow: a route
  // with ~14 stops of narration across en/de/hr already sits at ~100kb, so
  // the next edit would 413. Matches admin's serverActions.bodySizeLimit
  // ('2mb' in admin/next.config.mjs) so both ends of the path agree.
  app.useBodyParser('json', { limit: '2mb' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip properties not declared on DTOs
      forbidNonWhitelisted: true, // reject requests with extras
      transform: true, // auto-convert plain payloads into DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — driven by env so prod and dev can use the same code. In dev or
  // when CORS_ORIGINS is unset we allow everything; in prod set it to a
  // comma-separated list of the actual web + admin origins.
  // Mobile native clients are not subject to CORS.
  const corsOriginsEnv = process.env.CORS_ORIGINS;
  app.enableCors({
    origin:
      !corsOriginsEnv || corsOriginsEnv === '*'
        ? true
        : corsOriginsEnv
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
    credentials: true,
  });

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);
}

bootstrap();
