/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { tripPackage } from '@uit-go-backend/shared';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.GRPC,
      options: {
        url: '0.0.0.0:3003',
        package: tripPackage.TRIP_PACKAGE_PACKAGE_NAME,
        protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/trip.proto')
      }
    }
  );

  app.connectMicroservice<MicroserviceOptions>(
    {
      transport: Transport.RMQ,
      options: {
        urls: [configService.get<string>('RABBITMQ_URL')],
        queue: 'trip.q',
        queueOptions: {
          durable: true
        }
      }
    },
  );

  const port = process.env.TRIP_SERVICE_PORT || 3003;
  app.startAllMicroservices();
  // await app.listen(port);
  // await rmqApp.listen();
  Logger.log(
    `🚀 Trip Service is running with gRPC port ${port}`
  );
}

bootstrap();
