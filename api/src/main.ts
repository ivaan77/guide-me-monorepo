import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { connectToDatabase } from './database/client';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  connectToDatabase();
  await app.listen(3001);
}
bootstrap();
