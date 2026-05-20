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
  await app.listen(3001);
}

bootstrap();
