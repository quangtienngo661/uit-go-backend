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
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:3003',
        package: 'tripPackage',
        protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/trip.proto')
      }
    }
  );
  const port = process.env.TRIP_SERVICE_PORT || 3003;
  await app.listen();
  Logger.log(
    `🚀 Trip Service is running with gRPC port ${port}`
  );
}

bootstrap();
