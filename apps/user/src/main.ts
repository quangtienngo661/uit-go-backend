/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport } from '@nestjs/microservices';

async function bootstrap() {
  const userServicePort = process.env.PORT || process.env.USER_SERVICE_PORT || 3002;

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      host: '0.0.0.0',
      port: userServicePort
    }
  });
  await app.listen();
  Logger.log(
    `🚀 Application is running on TCP port ${userServicePort}`
  );
}

bootstrap();
