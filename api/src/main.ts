import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
