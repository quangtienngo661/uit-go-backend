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
      transport: Transport.GRPC, 
      options: {
        url: `0.0.0.0:3001`,
        package: 'authPackage', 
        protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/auth.proto'), 
      }
    }
  );

  const port = process.env.AUTH_SERVICE_PORT || 3001;

  await app.listen()

  Logger.log(
    `🚀 Auth Service is running on gRPC port ${port}`
  );
}

bootstrap();
