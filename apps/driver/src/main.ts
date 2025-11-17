/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path'; ``
import { driverPackage } from '@uit-go-backend/shared';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.connectMicroservice(
    {
      transport: Transport.GRPC,
      options: {
        package: driverPackage.DRIVER_PACKAGE_PACKAGE_NAME,
        url: 'driver-service:3004',
        protoPath: join(process.cwd(), 'libs/shared/src/lib/protos/driver.proto')
      }
    }
  );

  app.connectMicroservice(
    {
      transport: Transport.RMQ,
      options: {
        urls: ['amqp://guest:guest@rabbitmq:5672'],
        queue: 'driver.q',
        queueOptions: {
          durable: true
        }
      }
    },
  );

  const port = process.env.DRIVER_SERVICE_PORT || 3004;
  await app.startAllMicroservices();
  // await app.listen(port);
  Logger.log(
    `🚀 Driver Service is running with gRPC port ${port}`
  );
}

bootstrap();
