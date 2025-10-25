/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Logger.log(process.cwd());

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3001
      }
    }
  );

  const port = process.env.AUTH_SERVICE_PORT || 3001;

  await app.listen()

  Logger.log(
    `🚀 Auth Service is running on TCP port ${port}`
  );
}

bootstrap();
