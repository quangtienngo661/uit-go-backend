/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      // urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
      urls: [configService.get<string>('RABBITMQ_URL')],
      queue: 'notif.q',
      queueOptions: {
        durable: true,
      },
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.PORT || 3005);
  console.log(
    'Notification service is running on port',
    process.env.PORT || 3005,
  );
}

bootstrap();
